import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';
import { AppDataSource } from '../../../ormconfig';
import { permisosPara, tienePermiso } from './permission.policy';

export async function authorizationMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ success: false, message: 'Sesión requerida.' });
  try {
    const rows = await AppDataSource.query(`SELECT p.Codigo FROM SEGURIDAD.UsuarioPermiso up
      JOIN SEGURIDAD.Permiso p ON p.IdPermiso=up.IdPermiso
      WHERE up.IdUsuario=@0 AND up.Permitido=1 AND up.Activo=1 AND up.Eliminado=0 AND p.Activo=1 AND p.Eliminado=0`, [req.user.id]);
    if (!tienePermiso(rows.map((r: any) => r.Codigo), permisosPara(req.method, req.path))) {
      return res.status(403).json({ success: false, message: 'No tiene permiso para realizar esta operación.' });
    }
    next();
  } catch (error) { next(error); }
}
