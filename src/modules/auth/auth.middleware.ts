import { sesionRevocada } from './session.service';
import { environment } from '../../config/environment';
import { Request, Response, NextFunction } from 'express';
import jwt, { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { AppDataSource } from '../../../ormconfig';
import { Usuario } from './entities/Usuario';

export const validateLoginInput = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.body.login || !req.body.password) {
    res.status(400).json({ message: 'Usuario y contraseña requeridos' });
    return;
  }
  next();
};


export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Error interno del servidor.' });
};
export interface AuthenticatedRequest extends Request {
  user?: { id: number; login: string };
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if ((req as AuthenticatedRequest).user) return next();
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: 'No autenticado. Token requerido.', success: false });
    }

    const decoded = jwt.verify(token, environment.jwtSecret) as {
      idUsuario: number;
      login: string;
    };

    if (await sesionRevocada(token)) return res.status(401).json({ message: 'Sesi�n cerrada.', success: false });

    const repo = AppDataSource.getRepository(Usuario);
    const usuario = await repo.findOne({ where: { idUsuario: decoded.idUsuario } });

    if (!usuario || usuario.eliminado || !usuario.activo) {
      return res.status(401).json({ message: 'Usuario no válido o inactivo', success: false });
    }

    (req as AuthenticatedRequest).user = {
      id: usuario.idUsuario,
      login: usuario.login,
    };

    next();
  } catch (error) {
    console.error('Error de autenticación:', error);
    if (error instanceof TokenExpiredError) {
      return res.status(401).json({ message: 'Token expirado. Por favor, inicie sesión de nuevo.', success: false });
    } else if (error instanceof JsonWebTokenError) {
      return res.status(401).json({ message: 'Token inválido. Acceso denegado.', success: false });
    }
    res.status(401).json({ message: 'Error de autenticación inesperado.', success: false });
  }
};
