import { Router } from 'express';
import { getDatosFormularioProducto, getDatosFormularioCliente, getDatosFormularioFactura, getDatosProductoFactura, getDatosFormularioCompra, getDatosFormularioTraslado, getStockBodega } from './datos.controller';
const router = Router()
router.get('/datos-formulario-producto', getDatosFormularioProducto as any);
router.get('/datos-formulario-compra', getDatosFormularioCompra as any);
router.get('/datos-formulario-cliente', getDatosFormularioCliente as any);
router.get('/datos-formulario-factura', getDatosFormularioFactura as any);
router.get('/datos-productos-factura/:idSucursal', getDatosProductoFactura as any);
router.get('/datos-formulario-traslado', getDatosFormularioTraslado as any);
router.get('/datos-stock-bodega/:idBodega', getStockBodega as any);



export default router