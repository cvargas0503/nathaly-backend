import { Response } from 'express';
import { AppDataSource } from '../../../ormconfig';
import { AuthenticatedRequest } from '../auth/auth.middleware';
import { toCamelCase } from '../../helpers';
import { dates, fail, HttpError, integer, pagination } from '../../utils/feature';
export function auditFilters(q: any) {
  const p = pagination(q), range = dates(q);
  if (q.entidad !== undefined && (typeof q.entidad !== 'string' || !/^[a-z_]{1,50}$/.test(q.entidad))) throw new HttpError(400, 'Entidad inválida');
  if (q.accion !== undefined && !['CREAR', 'MODIFICAR', 'ELIMINAR'].includes(q.accion)) throw new HttpError(400, 'Acción inválida');
  if (q.incluirDatos !== undefined && !['true', 'false'].includes(q.incluirDatos)) throw new HttpError(400, 'incluirDatos inválido');
  return { ...p, ...range, entidad: q.entidad ?? null, accion: q.accion ?? null,
    usuarioId: q.usuarioId === undefined ? null : integer(q.usuarioId, 'usuarioId'), incluirDatos: q.incluirDatos === 'true' };
}
export const obtenerAuditoria = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const f = auditFilters(req.query);
    const args = [f.entidad, f.accion, f.usuarioId, f.desde, f.hasta];
    const where = 'WHERE (@0 IS NULL OR Entidad=@0) AND (@1 IS NULL OR Accion=@1) AND (@2 IS NULL OR UsuarioId=@2) AND (@3 IS NULL OR Fecha>=@3) AND (@4 IS NULL OR Fecha<=@4)';
    const result = await AppDataSource.transaction('REPEATABLE READ', async m => {
      const [count] = await m.query(`SELECT COUNT(*) AS total FROM ADMIN.Auditoria ${where}`, args);
      const rows = await m.query(`SELECT CONVERT(varchar(30),IdAuditoria) AS IdAuditoria,Entidad,Accion,
        CONVERT(varchar(30),EntidadId) AS EntidadId,Descripcion,UsuarioId,UsuarioLogin,Fecha,IpAddress
        ${f.incluirDatos ? ',DatosAnterior,DatosNuevo' : ''} FROM ADMIN.Auditoria ${where}
        ORDER BY Fecha DESC,IdAuditoria DESC OFFSET @5 ROWS FETCH NEXT @6 ROWS ONLY`, [...args, f.skip, f.limit]);
      return { total: count.total, rows };
    });
    return res.json({ success: true, message: 'Auditoría obtenida correctamente', data: result.rows.map((r: any) => ({ ...toCamelCase(r), fuente: 'persistida',
      ...(f.incluirDatos ? { datosAnterior: r.DatosAnterior ? JSON.parse(r.DatosAnterior) : null, datosNuevo: r.DatosNuevo ? JSON.parse(r.DatosNuevo) : null } : {}) })),
      pagination: { page: f.page, limit: f.limit, total: result.total } });
  } catch (e) { return fail(res, e); }
};
