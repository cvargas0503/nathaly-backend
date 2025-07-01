import { Request, Response } from 'express';
import {In, QueryFailedError } from 'typeorm';
import { Proveedor } from '../entities/Proveedor';
import { ProveedorDTO } from '../dto/ProveedorDTO';
import { AuthenticatedRequest } from '../../auth/auth.middleware';
import { AppDataSource } from '../../../../ormconfig';

function getPaginationParams(req: Request): { page: number; limit: number; skip: number } {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 10));
    const skip = (page - 1) * limit;
    return { page, limit, skip };
}
export const getProveedores = async (req: Request, res: Response) => {
        try {
            const { page, limit, skip } = getPaginationParams(req);
            const proveedorRepo = AppDataSource.getRepository(Proveedor);

            const [proveedores, total] = await proveedorRepo.findAndCount({
                where: { eliminado: false },
                skip,
                take: limit,
                order: { idProveedor: 'ASC' },
            });

            res.json({
                data: proveedores,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                },
                success: true,
                message: 'Proveedores obtenidas exitosamente',
            });
        } catch (error) {
            console.error('Error al obtener las proveedores:', error);
            res.status(500).json({ message: 'Error al obtener las proveedores', success: false });
        }
    };

export const getProveedor = async (req: Request, res: Response)  : Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            const proveedorRepo = AppDataSource.getRepository(Proveedor);
            const proveedor = await proveedorRepo.findOne({ where: { idProveedor: id } });

            if (!proveedor) {
                res.status(404).json({ message: 'Proveedor no encontrada' });
                return
            }

            res.json(proveedor);
        } catch (error) {
            res.status(500).json({ message: 'Error al obtener la proveedor', error });
            return;
        }
    };

export const createProveedor = async (
    req: AuthenticatedRequest,
    res: Response
) : Promise<Response> =>{
    try {
        const proveedorRepo = AppDataSource.getRepository(Proveedor);
        const data = Object.assign(new ProveedorDTO(), req.body);

        const existingProveedor = await proveedorRepo.findOne({ where: { nombre: data.nombre } });
        if (existingProveedor) {
            return res.status(400).json({ message: 'Ya existe una proveedor con ese nombre', success: false });
        }

        data.nombre = data.nombre.toUpperCase();
        data.fechaCreacion = new Date();
        data.creadoPor = req.user?.id;

        const nuevaProveedor = proveedorRepo.create(data);
        const savedProveedor = await proveedorRepo.save(nuevaProveedor);
        console.log('Proveedor creada:', savedProveedor);

        return res.status(201).json({ message: 'Proveedor creada exitosamente', success: true, data: savedProveedor });
    } catch (error) {
        if (error instanceof QueryFailedError) {
        const errorMessage = (error as any).driverError?.originalError?.info?.message || error.message;
        if (errorMessage.includes('conflicted with the CHECK constraint "CK__Proveedor__Nombre__')) {
            return res.status(409).json({
            message: 'El nombre de la proveedor no cumple con el formato requerido.',
            field: 'nombre', 
            code: 'DUPLICATE_PROVEEDOR_NAME_OR_INVALID_FORMAT' 
            });
        } else if (errorMessage.includes('conflicted with the UNIQUE constraint "UQ_Proveedor_Nombre"')) {
            return res.status(409).json({
                message: 'Ya existe una proveedor con ese nombre.',
                field: 'nombre',
                code: 'DUPLICATE_PROVEEDOR_NAME'
            });
        }
    }
        return res.status(500).json({ message: 'Error al crear la proveedor', error });
    }
};


export const updateProveedor = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const id = parseInt(req.params.id);
            const proveedorRepo = AppDataSource.getRepository(Proveedor);
            let proveedor = await proveedorRepo.findOne({ where: { idProveedor: id } });

            if (!proveedor) {
                return res.status(404).json({ message: 'Proveedor no encontrada' });
            }
            const data = Object.assign(new ProveedorDTO(), req.body);
            data.modificadoPor = req.user?.id;
            data.fechaModificacion = new Date();
            proveedorRepo.merge(proveedor, data);
            const updatedProveedor = await proveedorRepo.save(proveedor);
            res.status(200).json({message: 'Proveedor actualizada exitosamente', success: true, data: updatedProveedor});
        } catch (error) {
            if (error instanceof QueryFailedError) {
        const errorMessage = (error as any).driverError?.originalError?.info?.message || error.message;
        if (errorMessage.includes('conflicted with the CHECK constraint "CK__Proveedor__Nombre__')) {
            return res.status(409).json({
            message: 'El nombre de la proveedor no cumple con el formato requerido.',
            field: 'nombre', 
            code: 'DUPLICATE_PROVEEDOR_NAME_OR_INVALID_FORMAT' 
            });
        } else if (errorMessage.includes('conflicted with the UNIQUE constraint "UQ_Proveedor_Nombre"')) {
            return res.status(409).json({
                message: 'Ya existe una proveedor con ese nombre.',
                field: 'nombre',
                code: 'DUPLICATE_PROVEEDOR_NAME'
            });
        }
        }
    };
}

export const deleteProveedores = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    console.log(req)
    console.log("Eliminando proveedores:", req.body);
    const { ids } = req.body;
    console.log("IDs de proveedores a eliminar:", ids);
    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ message: 'Debes seleccionar al menos una proveedor', success: false });
      return;
    }

    const proveedorRepo = AppDataSource.getRepository(Proveedor);
    const proveedores = await proveedorRepo.findBy({idProveedor: In(ids), eliminado: false});
    console.log("Proveedores encontradas:", proveedores);

    if (proveedores.length === 0) {
      res.status(404).json({ message: 'No se encontraron las proveedores proporcionadas', success: false });
      return;
    }

    const usuarioId = req.user?.id ?? null;
    const fecha = new Date();

    const proveedoresActualizadas = proveedores.map(proveedor => {
      proveedor.eliminado = true;
      proveedor.eliminadoPor = usuarioId;
      proveedor.fechaEliminacion = fecha;
      return proveedor;
    });

    await proveedorRepo.save(proveedoresActualizadas);

    res.status(200).json({
      message: 'Proveedores eliminadas exitosamente',
      count: proveedoresActualizadas.length,
      success: true
    });
  } catch (error: unknown) {
    console.error("Error al eliminar proveedores:", error);
    res.status(400).json({
      message: 'Error al eliminar las proveedores',
      error: error instanceof Error ? error.message : String(error),
      success: false
    });
  }
};
