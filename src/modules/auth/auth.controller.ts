import { randomUUID } from 'node:crypto';
import { revocarSesion } from './session.service';
import { AuthenticatedRequest } from './auth.middleware';
import { environment } from '../../config/environment';
import { Request, Response, NextFunction } from 'express'
import { AppDataSource } from '../../../ormconfig'
import { Usuario } from './entities/Usuario'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { ILike } from 'typeorm'
import { UsuarioPermiso } from './entities/UsuarioPermiso'

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.cookies?.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, environment.jwtSecret) as jwt.JwtPayload;
        if (decoded.exp) await revocarSesion(token, decoded.exp);
      } catch (error) {
        if (!(error instanceof jwt.JsonWebTokenError)) throw error;
      }
    }
    res.clearCookie('token', { httpOnly: true, secure: environment.production, sameSite: 'strict' });
    res.status(200).json({ success: true, message: 'Sesi�n cerrada' });
  } catch (error) { next(error); }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { login, password } = req.body

  if (!login || !password) {
    res.status(400).json({ message: 'Usuario y contraseña requeridos' })
    return
  }

  try {
    const repo = AppDataSource.getRepository(Usuario)
    const usuario = await repo.findOne({ where: { login:ILike(login) } })
    const permisosRepo = AppDataSource.getRepository(UsuarioPermiso)

    if (!usuario || usuario.eliminado || !usuario.activo) {
      res.status(401).json({ message: 'Usuario no encontrado. Verifique sus credenciales.' })
      return
    }

    const isMatch = await bcrypt.compare(password, usuario.passHash)
    if (!isMatch) {
      res.status(401).json({ message: 'Credenciales inválidas' })
      return
    }

    const token = jwt.sign(
      { idUsuario: usuario.idUsuario, login: usuario.login },
      environment.jwtSecret,
      { expiresIn: '8h', jwtid: randomUUID() }
    )
    // res.setHeader('Set-Cookie', `token=${token}; HttpOnly; Path=/; Max-Age=28800; SameSite=Strict`) // Configurar las cookies
    res.cookie('token', token, { httpOnly: true, secure: environment.production, maxAge: 8 * 60 * 60 * 1000, sameSite: 'strict' }) // Configurar las cookies

    const permisos = await permisosRepo.find({ where: { idUsuario: usuario.idUsuario, permitido: true, activo: true, eliminado: false }, relations: ['permiso'] })

    res.status(200).json({
      message: 'Login exitoso',
      usuario: {
        idUsuario: usuario.idUsuario,
        login: usuario.login,
        permisos: permisos.filter(p => p.permiso.activo && !p.permiso.eliminado).map(p => p.permiso.codigo)
      },
      success: true
    })
  } catch (err) {
    console.error('Login error:', err)
    next(err)
  }
}
export const profile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const decoded = { idUsuario: (req as AuthenticatedRequest).user?.id };
    const repo = AppDataSource.getRepository(Usuario)
    const permisosRepo = AppDataSource.getRepository(UsuarioPermiso)

    const usuario = await repo.findOne({ where: { idUsuario: decoded.idUsuario, activo: true, eliminado: false } })

    if (!usuario || usuario.eliminado || !usuario.activo) {
      res.status(401).json({ message: 'Usuario no encontrado o inactivo' })
      return
    }

    const permisos = await permisosRepo.find({ where: { idUsuario: usuario.idUsuario, permitido: true, activo: true, eliminado: false }, relations: ['permiso'] })

    res.status(200).json({
      usuario: {
        idUsuario: usuario.idUsuario,
        login: usuario.login,
        permisos: permisos.filter(p => p.permiso.activo && !p.permiso.eliminado).map(p => p.permiso.codigo),
      },
      success: true
    })
  } catch (err) {
    console.error('Profile error:', err)
    next(err)
  }
}
