import sql from 'mssql';
import { getMSSQLPool } from '../../../database';
import { FacturacionError, SolicitudFactura, TransaccionesFacturacion, UnidadFacturacion } from './facturacion.facade';

export function crearUnidad(tx: sql.Transaction): UnidadFacturacion {
  const request = () => new sql.Request(tx);
  return {
    solicitudes: {
      async buscar(usuarioId, clave) {
        // Transaction-owned application lock works across API processes and absent keys.
        const lock = await request().input('recurso', sql.NVarChar(255), `factura:${usuarioId}:${clave}`)
          .query("DECLARE @r int; EXEC @r = sys.sp_getapplock @Resource=@recurso, @LockMode='Exclusive', @LockOwner='Transaction', @LockTimeout=10000; SELECT @r AS resultado;");
        if (lock.recordset[0].resultado < 0) throw new FacturacionError('La solicitud está en proceso. Reintente con la misma clave.', 409);
        const result = await request().input('usuario', sql.Int, usuarioId).input('clave', sql.UniqueIdentifier, clave)
          .query('SELECT IdVenta AS idVenta, Huella AS huella FROM ADMIN.SolicitudFacturacion WHERE IdUsuario=@usuario AND Clave=@clave');
        return result.recordset[0];
      },
      async guardar(solicitud, factura) {
        await request().input('usuario', sql.Int, solicitud.usuarioId).input('clave', sql.UniqueIdentifier, solicitud.clave)
          .input('venta', sql.BigInt, factura.idVenta).input('huella', sql.Char(64), factura.huella)
          .query('INSERT INTO ADMIN.SolicitudFacturacion (IdUsuario,Clave,IdVenta,Huella) VALUES (@usuario,@clave,@venta,@huella)');
      },
    },
    inventario: {
      async validarDisponibilidad(s: SolicitudFactura) {
        const bodegas = await request().input('sucursal', sql.Int, s.idSucursal).query(`
          SELECT b.IdBodega FROM INVENTARIO.Bodega b WITH (HOLDLOCK)
          JOIN CATALOGOS.Sucursal s ON s.IdSucursal=b.IdSucursal
          WHERE b.IdSucursal=@sucursal AND b.EsPrincipal=1 AND b.Activo=1 AND b.Eliminado=0
            AND s.Activo=1 AND s.Eliminado=0`);
        if (bodegas.recordset.length !== 1) throw new FacturacionError('La sucursal debe tener una única bodega principal activa.');
        for (const d of s.detalles) {
          const existencias = await request().input('bodega', sql.Int, bodegas.recordset[0].IdBodega)
            .input('producto', sql.Int, d.idProducto).query(`
            SELECT e.Stock FROM INVENTARIO.Existencia e WITH (UPDLOCK,HOLDLOCK)
            JOIN INVENTARIO.Producto p ON p.IdProducto=e.IdProducto
            WHERE e.IdBodega=@bodega AND e.IdProducto=@producto AND e.Eliminado=0 AND p.Eliminado=0`);
          if (!existencias.recordset[0] || Number(existencias.recordset[0].Stock) < d.cantidad) {
            throw new FacturacionError(`Existencia insuficiente para el producto ${d.idProducto}.`);
          }
        }
      },
    },
    facturas: {
      async registrar(s) {
        const tvp = new sql.Table('VENTAS.TipoVentaDetalle');
        tvp.columns.add('IdProducto', sql.Int); tvp.columns.add('Cantidad', sql.Decimal(18, 4));
        tvp.columns.add('PrecioUnitario', sql.Decimal(18, 4)); tvp.columns.add('Descuento', sql.Decimal(18, 4));
        for (const d of s.detalles) tvp.rows.add(d.idProducto, d.cantidad, d.precioUnitario, d.descuento);
        // Existing procedure performs invoice + details + stock + Kardex, within our outer transaction.
        const result = await request().input('IdCliente', sql.Int, s.idCliente).input('IdEmpleado', sql.Int, s.idEmpleado)
          .input('IdSucursal', sql.Int, s.idSucursal).input('Fecha', sql.DateTime2, new Date(s.fecha))
          .input('IdTermino', sql.SmallInt, s.idTermino).input('UsuarioId', sql.Int, s.usuarioId)
          .input('Observacion', sql.NVarChar(250), '').input('Detalles', tvp).execute('VENTAS.sp_Venta_Insertar_Optimizado');
        const id = result.recordset[0]?.IdVenta;
        if (id === undefined || id === null) throw new Error('The procedure did not return an invoice ID');
        return String(id);
      },
      async consultar(id) {
        const result = await request().input('IdVenta', sql.BigInt, id).execute('REPORTES.sp_Reporte_Venta');
        if (!result.recordset[0]) throw new Error('The invoice report is unavailable');
        return result.recordset[0];
      },
    },
  };
}

export class SqlTransaccionesFacturacion implements TransaccionesFacturacion {
  async ejecutar<T>(operacion: (unidad: UnidadFacturacion) => Promise<T>): Promise<T> {
    const tx = new sql.Transaction(await getMSSQLPool());
    let revertida = false;
    tx.on('rollback', () => { revertida = true; });
    await tx.begin(sql.ISOLATION_LEVEL.READ_COMMITTED);
    try {
      const result = await operacion(crearUnidad(tx));
      await tx.commit();
      return result;
    } catch (error) {
      if (!revertida) {
        try { await tx.rollback(); } catch (rollbackError) {
          console.error('No fue posible confirmar la reversión de facturación.', rollbackError);
        }
      }
      throw error;
    }
  }
}
