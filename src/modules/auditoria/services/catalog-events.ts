import { EntityManager, EntityTarget, ObjectLiteral } from 'typeorm';
import { Response } from 'express';
import { AppDataSource } from '../../../../ormconfig';
import { AuthenticatedRequest } from '../../auth/auth.middleware';
import { HttpError, fail, integer, lock } from '../../../utils/feature';
const allowed = ['nombre', 'eliminado', 'creadoPor', 'fechaCreacion', 'modificadoPor', 'fechaModificacion', 'eliminadoPor', 'fechaEliminacion'];
export function snapshot(row: any, primary: string) {
  return row ? Object.fromEntries([primary, ...allowed].map(k => [k, row[k] ?? null])) : null;
}
export async function recordEvent(m: EntityManager, entity: string, primary: string, before: any, after: any, user: { id: number; login: string }, action: string) {
  await m.query(`INSERT INTO ADMIN.Auditoria (Entidad,Accion,EntidadId,Descripcion,DatosAnterior,DatosNuevo,UsuarioId,UsuarioLogin,Fecha)
    VALUES (@0,@1,@2,@3,@4,@5,@6,@7,SYSUTCDATETIME())`, [entity, action, after[primary], `${action} ${entity} ${after[primary]}`,
    before ? JSON.stringify(snapshot(before, primary)) : null, JSON.stringify(snapshot(after, primary)), user.id, user.login]);
}
export function catalogHandlers(target: EntityTarget<ObjectLiteral>, primary: string, entity: string, label: string, maxLength: number) {
  const write = (action: string) => async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) throw new HttpError(401, 'Sesión requerida');
      const value = action === 'ELIMINAR' ? null : (() => {
        if (typeof req.body?.nombre !== 'string' || !req.body.nombre.trim() || req.body.nombre.trim().length > maxLength) throw new HttpError(400, 'Nombre inválido');
        return req.body.nombre.trim().toUpperCase();
      })();
      const keys: number[] = action === 'CREAR' ? [] : action === 'MODIFICAR' ? [integer(req.params.id, 'id')] : (() => {
        if (!Array.isArray(req.body?.ids) || !req.body.ids.length || req.body.ids.length > 100) throw new HttpError(400, 'Seleccione 1 a 100 IDs');
        return [...new Set<number>(req.body.ids.map((v: unknown) => integer(v, 'id')))].sort((a, b) => a - b);
      })();
      const result = await AppDataSource.transaction(async m => {
        const repo = m.getRepository(target);
        await lock(m, `catalogo:${entity}`);
        if (action === 'CREAR') {
          if (await repo.findOneBy({ nombre: value })) throw new HttpError(400, `Ya existe ${label} con ese nombre`);
          const after = await repo.save(repo.create({ nombre: value, eliminado: false, creadoPor: req.user!.id, fechaCreacion: new Date() }));
          await recordEvent(m, entity, primary, null, after, req.user!, action);
          return after;
        }
        let count = 0, result: any;
        for (const key of keys) {
          const before = await repo.findOneBy({ [primary]: key, eliminado: false });
          if (!before) continue;
          if (action === 'MODIFICAR' && before.nombre === value) { result = before; continue; }
          const after = { ...before, ...(action === 'MODIFICAR' ? { nombre: value, modificadoPor: req.user!.id, fechaModificacion: new Date() }
            : { eliminado: true, eliminadoPor: req.user!.id, fechaEliminacion: new Date() }) };
          result = await repo.save(after);
          await recordEvent(m, entity, primary, before, result, req.user!, action);
          count++;
        }
        if (action === 'MODIFICAR' && !result) throw new HttpError(404, `${label} no encontrada`);
        return action === 'ELIMINAR' ? { count } : result;
      });
      return res.status(action === 'CREAR' ? 201 : 200).json({ success: true, message: `${label} ${action === 'CREAR' ? 'creada' : action === 'MODIFICAR' ? 'actualizada' : 'eliminadas'} exitosamente`,
        ...(action === 'ELIMINAR' ? result : { data: result }) });
    } catch (e: any) {
      const number = e?.driverError?.number ?? e?.driverError?.originalError?.info?.number;
      if ([2601, 2627, 547].includes(number)) return res.status(409).json({ success: false, message: 'Nombre duplicado o formato inválido', field: 'nombre' });
      return fail(res, e);
    }
  };
  return { create: write('CREAR'), update: write('MODIFICAR'), delete: write('ELIMINAR') };
}
