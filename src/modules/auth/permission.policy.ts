const catalogos: Record<string, string> = {
  lineas: 'GESTIONAR_LINEAS', marcas: 'GESTIONAR_MARCAS', categorias: 'GESTIONAR_CATEGORIAS',
  proveedores: 'GESTIONAR_PROVEEDORES', precios: 'GESTIONAR_PRECIOS', clientes: 'GESTIONAR_CLIENTES',
  productos: 'GESTIONAR_PRODUCTOS', sucursales: 'GESTIONAR_SUCURSALES', empleados: 'GESTIONAR_EMPLEADOS',
  usuarios: 'GESTIONAR_USUARIOS', permisos: 'GESTIONAR_PERMISOS',
};
const operativos = ['NUEVA_VENTA', 'NUEVO_PEDIDO', 'NUEVA_COMPRA', 'NUEVO_TRASLADO'];
/** Explicit server-side policy. An unknown resource has no implicit permission. */
export function permisosPara(method: string, path: string): string[] {
  const [recurso, accion = '', extra = ''] = path.split('/').filter(Boolean);
  const lectura = method === 'GET' || method === 'HEAD';
  if (catalogos[recurso]) {
    return lectura && !['usuarios', 'permisos'].includes(recurso)
      ? [catalogos[recurso], ...operativos] : [catalogos[recurso]];
  }
  switch (recurso) {
    case 'reposicion': return ['VER_REPOSICION'];
    case 'ventas': return lectura ? (accion === 'ventas-pendientes' ? ['PAGAR_VENTAS', 'VER_VENTAS'] : ['VER_VENTAS'])
      : method === 'POST' ? ['NUEVA_VENTA'] : ['ANULAR_VENTA'];
    case 'pedidos': return lectura ? ['VER_PEDIDOS'] : method === 'PATCH' ? ['NUEVA_VENTA'] : ['NUEVO_PEDIDO'];
    case 'compras': return [lectura ? 'VER_COMPRAS' : 'NUEVA_COMPRA'];
    case 'traslados': return [lectura ? 'VER_TRASLADOS' : 'NUEVO_TRASLADO'];
    case 'kardex': return ['VER_KARDEX'];
    case 'arqueos': return lectura ? ['VER_ARQUEOS', 'NUEVO_ARQUEO'] : ['NUEVO_ARQUEO'];
    case 'caja': return [lectura ? 'VER_MOVIMIENTOS_CAJA' : extra === 'pago' ? 'PAGAR_VENTAS' : 'NUEVO_MOVIMIENTO_CAJA'];
    case 'datos': {
      const formularios: Record<string, string[]> = {
        'datos-formulario-producto': ['GESTIONAR_PRODUCTOS'],
        'datos-formulario-cliente': ['GESTIONAR_CLIENTES'],
        'datos-formulario-compra': ['NUEVA_COMPRA'],
        'datos-formulario-factura': ['NUEVA_VENTA', 'NUEVO_PEDIDO'],
        'datos-productos-factura': ['NUEVA_VENTA', 'NUEVO_PEDIDO'],
        'datos-formulario-traslado': ['NUEVO_TRASLADO'],
        'datos-stock-bodega': ['NUEVO_TRASLADO', 'NUEVA_COMPRA', 'VER_KARDEX'],
      };
      return lectura ? formularios[accion] ?? [] : [];
    }
    case 'reportes': return [accion === 'compras' ? 'VER_COMPRAS' : accion === 'inventario' ? 'VER_KARDEX'
      : accion === 'caja' ? 'VER_MOVIMIENTOS_CAJA' : 'VER_VENTAS'];
    case 'devoluciones': return [lectura ? 'VER_VENTAS' : 'ANULAR_VENTA'];
    case 'auditoria': case 'busqueda': case 'dashboard': return ['GESTIONAR_USUARIOS'];
    case 'configuracion': return lectura ? operativos : ['GESTIONAR_PERMISOS'];
    case 'notificaciones': return ['VER_KARDEX', 'GESTIONAR_PRODUCTOS'];
    default: return [];
  }
}
export function tienePermiso(concedidos: string[], requeridos: string[]): boolean {
  return requeridos.some(p => concedidos.includes(p));
}
