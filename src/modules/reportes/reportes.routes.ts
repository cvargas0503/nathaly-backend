import { Router } from 'express';
import {
    reporteVentas,
    exportarReporteVentas,
    reporteCompras,
    reporteInventarioValorizado,
    reporteCierreDiario,
} from './reportes.controller';
import { authMiddleware } from '../auth/auth.middleware';

const router = Router();

router.use(authMiddleware as any);

// GET /api/v1/reportes/ventas?desde={fecha}&hasta={fecha}&idSucursal={id}
router.get('/ventas', reporteVentas as any);

// GET /api/v1/reportes/ventas/exportar?formato=pdf&desde={fecha}&hasta={fecha}
router.get('/ventas/exportar', exportarReporteVentas as any);

// GET /api/v1/reportes/compras?desde={fecha}&hasta={fecha}
router.get('/compras', reporteCompras as any);

// GET /api/v1/reportes/inventario/valorizado
router.get('/inventario/valorizado', reporteInventarioValorizado as any);

// GET /api/v1/reportes/caja/cierre-diario?fecha={fecha}&idSucursal={id}
router.get('/caja/cierre-diario', reporteCierreDiario as any);

export default router;
