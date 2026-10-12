import { createHash } from 'node:crypto';

export class FacturacionError extends Error {
  constructor(message: string, public readonly status = 400) { super(message); }
}
export interface DetalleFactura {
  idProducto: number; cantidad: number; precioUnitario: number; descuento: number;
}
export interface SolicitudFactura {
  idCliente: number; idEmpleado: number; idSucursal: number; idTermino: number;
  fecha: string; detalles: DetalleFactura[]; usuarioId: number; clave: string;
}
export interface FacturaRegistrada { idVenta: string; huella: string }
export interface UnidadFacturacion {
  solicitudes: {
    buscar(usuarioId: number, clave: string): Promise<FacturaRegistrada | undefined>;
    guardar(solicitud: SolicitudFactura, factura: FacturaRegistrada): Promise<void>;
  };
  inventario: { validarDisponibilidad(solicitud: SolicitudFactura): Promise<void> };
  facturas: { registrar(solicitud: SolicitudFactura): Promise<string>; consultar(id: string): Promise<unknown> };
}
export interface TransaccionesFacturacion {
  ejecutar<T>(operacion: (unidad: UnidadFacturacion) => Promise<T>): Promise<T>;
}
function numero(value: unknown, campo: string, entero = false): number {
  if ((typeof value !== 'number' && typeof value !== 'string') || String(value).trim() === '') {
    throw new FacturacionError(`${campo} debe ser numérico.`);
  }
  const n = Number(value);
  if (!Number.isFinite(n) || (entero && (!Number.isInteger(n) || n < 1 || n > 2147483647))) {
    throw new FacturacionError(`${campo} no es válido.`);
  }
  return n;
}
function decimal(value: unknown, campo: string, escala: number): number {
  const n = numero(value, campo);
  if (n < 0 || n > 999999999 || Math.abs(n * 10 ** escala - Math.round(n * 10 ** escala)) > 0.0001) {
    throw new FacturacionError(`${campo} debe ser positivo y tener hasta ${escala} decimales.`);
  }
  return n;
}
export function validarSolicitud(body: any, usuarioId: number, clave: string): SolicitudFactura {
  if (!usuarioId) throw new FacturacionError('Se requiere una sesión activa.', 401);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(clave)) {
    throw new FacturacionError('Envíe un UUID en el encabezado Idempotency-Key.');
  }
  if (!body || typeof body.fecha !== 'string' || !Number.isFinite(Date.parse(body.fecha))) {
    throw new FacturacionError('La fecha es requerida y debe ser válida.');
  }
  if (!Array.isArray(body.detalles) || body.detalles.length === 0 || body.detalles.length > 500) {
    throw new FacturacionError('La factura debe contener entre 1 y 500 productos.');
  }
  const productos = new Set<number>();
  const detalles = body.detalles.map((d: any): DetalleFactura => {
    if (!d || typeof d !== 'object') throw new FacturacionError('Detalle inválido.');
    const idProducto = numero(d.idProducto, 'Producto', true);
    if (productos.has(idProducto)) throw new FacturacionError('Cada producto debe aparecer una sola vez.');
    productos.add(idProducto);
    const cantidad = decimal(d.cantidad, 'Cantidad', 2);
    const precioUnitario = decimal(d.precioUnitario, 'Precio', 4);
    const descuento = decimal(d.descuento ?? 0, 'Descuento', 4);
    if (cantidad === 0 || descuento > cantidad * precioUnitario) throw new FacturacionError('Cantidad o descuento fuera de rango.');
    return { idProducto, cantidad, precioUnitario, descuento };
  }).sort((a: DetalleFactura, b: DetalleFactura) => a.idProducto - b.idProducto);
  return {
    idCliente: numero(body.idCliente, 'Cliente', true), idEmpleado: numero(body.idEmpleado, 'Empleado', true),
    idSucursal: numero(body.idSucursal, 'Sucursal', true), idTermino: numero(body.idTermino, 'Término', true),
    fecha: new Date(body.fecha).toISOString(), detalles, usuarioId, clave: clave.toLowerCase(),
  };
}

/** Single application entry point. Persistence details stay in the SQL adapter. */
export class FacturacionFacade {
  constructor(private readonly transacciones: TransaccionesFacturacion) {}
  async confirmar(body: unknown, usuarioId: number, clave: string) {
    const solicitud = validarSolicitud(body, usuarioId, clave);
    if (solicitud.idTermino > 32767) throw new FacturacionError('Término fuera de rango.');
    const huella = createHash('sha256').update(JSON.stringify(solicitud)).digest('hex');
    return this.transacciones.ejecutar(async unidad => {
      const anterior = await unidad.solicitudes.buscar(usuarioId, solicitud.clave);
      if (anterior) {
        if (anterior.huella !== huella) throw new FacturacionError('La clave ya corresponde a otra solicitud.', 409);
        return { factura: await unidad.facturas.consultar(anterior.idVenta), reutilizada: true };
      }
      await unidad.inventario.validarDisponibilidad(solicitud);
      const idVenta = await unidad.facturas.registrar(solicitud);
      await unidad.solicitudes.guardar(solicitud, { idVenta, huella });
      const factura = await unidad.facturas.consultar(idVenta);
      return { factura, reutilizada: false };
    });
  }
}
