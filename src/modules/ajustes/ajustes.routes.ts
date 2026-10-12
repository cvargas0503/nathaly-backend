import { Router } from 'express';
import { AppDataSource } from '../../../ormconfig';
import { AuthenticatedRequest } from '../auth/auth.middleware';
import { dates, fail, id, integer, pagination, HttpError } from '../../utils/feature';
import { applyAdjustment, validateAdjustment } from './ajustes.service';
import { toCamelCase } from '../../helpers';
const router = Router();
router.post('/', (async (req: AuthenticatedRequest, res: any) => {
  try {
    if (!req.user) throw new HttpError(401, 'Sesión requerida');
    const input = validateAdjustment(req.body);
    const data = await AppDataSource.transaction(m => applyAdjustment(m, input, req.user!.id));
    res.status(201).json({ success: true, data });
  } catch (e) { fail(res, e); }
}) as any);
router.get('/', (async (req: any, res: any) => {
  try {
    const { page, limit, skip } = pagination(req.query), { desde, hasta } = dates(req.query);
    const bodega = req.query.idBodega === undefined ? null : integer(req.query.idBodega, 'idBodega');
    const data = await AppDataSource.query(`SELECT CONVERT(varchar(30),IdAjuste) AS IdAjuste,IdBodega,Fecha,Observacion,CreadoPor,
      COUNT(*) OVER() AS Total FROM INVENTARIO.Ajuste WHERE Eliminado=0 AND (@0 IS NULL OR IdBodega=@0)
      AND (@1 IS NULL OR Fecha>=@1) AND (@2 IS NULL OR Fecha<=@2)
      ORDER BY Fecha DESC,IdAjuste DESC OFFSET @3 ROWS FETCH NEXT @4 ROWS ONLY`, [bodega, desde, hasta, skip, limit]);
    const [count] = await AppDataSource.query(`SELECT COUNT(*) AS Total FROM INVENTARIO.Ajuste WHERE Eliminado=0 AND (@0 IS NULL OR IdBodega=@0) AND (@1 IS NULL OR Fecha>=@1) AND (@2 IS NULL OR Fecha<=@2)`, [bodega, desde, hasta]);
    res.json({ success: true, data: data.map(({ Total, ...r }: any) => toCamelCase(r)), pagination: { page, limit, total: count.Total } });
  } catch (e) { fail(res, e); }
}) as any);
router.get('/:id', (async (req: any, res: any) => {
  try {
    const key = id(req.params.id);
    const [header] = await AppDataSource.query('SELECT *,CONVERT(varchar(30),IdAjuste) AS AjusteId FROM INVENTARIO.Ajuste WHERE IdAjuste=@0 AND Eliminado=0', [key]);
    if (!header) throw new HttpError(404, 'Ajuste no encontrado');
    header.IdAjuste = header.AjusteId; delete header.AjusteId;
    const detalles = await AppDataSource.query('SELECT IdProducto,CONVERT(varchar(40),Cantidad) AS Cantidad,CONVERT(varchar(40),CostoUnit) AS CostoUnit,IdTipoMov FROM INVENTARIO.AjusteDetalle WHERE IdAjuste=@0 AND Eliminado=0 ORDER BY IdDetalle', [key]);
    res.json({ success: true, data: { ...toCamelCase(header), detalles: detalles.map(toCamelCase) } });
  } catch (e) { fail(res, e); }
}) as any);
export default router;
