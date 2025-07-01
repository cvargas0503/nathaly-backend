import { Request, Response } from 'express';
import { AppDataSource } from '../../../../ormconfig';
import { AuthenticatedRequest } from '../../auth/auth.middleware';
import { toCamelCase } from '../../../helpers';
import bcrypt from 'bcryptjs';
export const getUsuariosEmpleado = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await AppDataSource.query(`EXEC SEGURIDAD.sp_ObtenerUsuarios`);

    if (!result || result.length === 0) {
      return res.status(404).json({ message: 'Usuarios no encontrados', success: false });
    }
    const usuarios = toCamelCase(result)
    res.status(200).json({ success: true, data: usuarios });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el empleado', error });
  }
};

export const getEmpleadosSinUsuario = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await AppDataSource.query(`EXEC SEGURIDAD.sp_ObtenerEmpleadosSinUsuario`);

    if (!result || result.length === 0) {
      return res.status(404).json({ message: 'Empleados no encontrados', success: false });
    }
    const usuarios = toCamelCase(result)
    res.status(200).json({ success: true, data: usuarios });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el empleado', error });
  }
};
export const crearUsuario = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { usuario, idEmpleado, password } = req.body;
        const idUsuario = req.user?.id || null;// ID del usuario autenticado

        // Validaciones básicas
        if (!usuario || typeof usuario !== 'string' || usuario.trim() === '') {
            return res.status(400).json({ message: 'El nombre de usuario es requerido', success: false });
        }
        if (!idEmpleado || typeof idEmpleado !== 'number') {
            return res.status(400).json({ message: 'El idEmpleado es requerido y debe ser numérico', success: false });
        }
        if (!password || typeof password !== 'string' || password.length < 6) {
            return res.status(400).json({ message: 'La contraseña es requerida y debe tener al menos 6 caracteres', success: false });
        }

        // Verificar si el usuario ya existe
        const existeUsuario = await AppDataSource.query(
            `SELECT 1 FROM SEGURIDAD.Usuario WHERE Login = @0 AND Activo = 1 AND Eliminado = 0`, [usuario]
        );
        if (existeUsuario.length > 0) {
            return res.status(409).json({ message: 'El usuario ya existe', success: false });
        }

        // Hashear la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Crear el usuario
        await AppDataSource.query(
            `INSERT INTO SEGURIDAD.Usuario (Login, PassHash, CreadoPor, IdEmpleado) VALUES (@0, @1, @2, @3)`,
            [usuario, hashedPassword, idUsuario, idEmpleado]
        );

        res.status(201).json({ success: true, message: 'Usuario creado exitosamente' });
    } catch (error) {
        console.error('Error al crear el usuario:', error);
        res.status(500).json({ message: 'Error al crear el usuario', success: false });
    }
};

export const modificarUsuario = async (req: AuthenticatedRequest, res: Response) => {
    try {
        console.log('Modificando usuario');
        const idUsuarioModificar = parseInt(req.params.idUsuario);
        const {password } = req.body;
        const idUsuario = req.user?.id || null;// ID del usuario autenticado


        if (!idUsuario || typeof idUsuario !== 'number') {
            return res.status(400).json({ message: 'El ID del usuario es requerido y debe ser numérico', success: false });
        }
        if (!password || typeof password !== 'string' || password.length < 6) {
            return res.status(400).json({ message: 'La contraseña es requerida y debe tener al menos 6 caracteres', success: false });
        }

        // Hashear la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Crear el usuario
        await AppDataSource.query(
            `UPDATE SEGURIDAD.Usuario 
            SET ModificadoPor = @0,
            FechaModificacion = GETDATE(),
            PassHash = @1
            WHERE IdUsuario = @2 AND Eliminado = 0`,
            [idUsuario, hashedPassword, idUsuarioModificar]
        );

        return res.status(201).json({ success: true, message: 'Usuario modificado exitosamente' });
    } catch (error) {
        console.error('Error al crear el usuario:', error);
        res.status(500).json({ message: 'Error al crear el usuario', success: false });
    }
};

export const eliminarUsuario = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const idUsuario = parseInt(req.params.idUsuario);
        const idUsuarioEliminador = req.user?.id || null; // ID del usuario autenticado

        if (!idUsuario || typeof idUsuario !== 'number') {
            return res.status(400).json({ message: 'El ID del usuario es requerido y debe ser numérico', success: false });
        }

        // Marcar el usuario como eliminado
        await AppDataSource.query(
            `UPDATE SEGURIDAD.Usuario 
            SET Activo = 0, ModificadoPor = @0, FechaModificacion = GETDATE() 
            WHERE IdUsuario = @1 AND Eliminado = 0`,
            [idUsuarioEliminador, idUsuario]
        );

        res.status(200).json({ success: true, message: 'Usuario eliminado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar el usuario:', error);
        res.status(500).json({ message: 'Error al eliminar el usuario', success: false });
    }
}