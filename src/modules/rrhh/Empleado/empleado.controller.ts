import { Request, Response } from 'express';
import { AppDataSource } from '../../../../ormconfig';
import { AuthenticatedRequest } from '../../auth/auth.middleware';
import { Empleado } from '../entities/Empleado';
import { In } from 'typeorm';
import {toCamelCase} from '../../../helpers';
import { EmpleadoDTO } from '../../catalogos/dto/EmpleadoDTO';
function getPaginationParams(req: Request): { page: number; limit: number; skip: number } {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 10));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export const getEmpleados = async (req: Request, res: Response) => {
  try {
    const { page, limit, skip } = getPaginationParams(req);
    const result = await AppDataSource.query(
      `EXEC CATALOGOS.sp_Empleado_Seleccionar @Nombre = @0, @NumDoc = @1, @IdSucursal = @2`,
      [null, null, null]
    );

    const totalResult = await AppDataSource.query(`SELECT COUNT(1) as total FROM RRHH.Empleado WHERE Eliminado = 0`);
    const total = totalResult[0]?.total || 0;

    res.json({
      data: toCamelCase(result),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      success: true,
      message: 'Empleados obtenidos exitosamente',
    });
  } catch (error) {
    console.error('Error al obtener los empleados:', error);
    res.status(500).json({ message: 'Error al obtener los empleados', success: false });
  }
};

export const getEmpleado = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const result = await AppDataSource.query(`EXEC CATALOGOS.Empleado_OBTENER @IdEmpleado = @0`, [id]);

    if (!result || result.length === 0) {
      return res.status(404).json({ message: 'Empleado no encontrado', success: false });
    }

    res.json({ success: true, data: result[0] });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el empleado', error });
  }
};

export const createEmpleado = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  const queryRunner = AppDataSource.createQueryRunner();

  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'No autorizado', success: false });
    }

    // 2. Validar estructura del body
    const body = req.body;
    if (typeof body !== 'object' || Array.isArray(body) || body === null) {
      return res.status(400).json({
        message: 'El cuerpo de la solicitud debe ser un objeto válido',
        success: false,
      });
    }

    // 3. Construir DTO con saneamiento
    const dto: EmpleadoDTO = {
      nombres: body.nombres?.trim(),
      apellidos: body.apellidos?.trim(),
      direccion: body.direccion?.trim(),
      telefono: body.telefono,
      celular: body.celular,
      email: body.email?.trim().toLowerCase(),
      tipoDoc: body.tipoDoc,
      numDoc: body.numDoc?.trim().toUpperCase(),
      idCiudad: body.idCiudad,
      idSucursal: body.idSucursal,
      puesto: body.puesto?.trim(),
    };

    // 4. Validación de campos requeridos
    const requiredFields: (keyof EmpleadoDTO)[] = [
      'nombres', 'apellidos', 'tipoDoc', 'numDoc',
      'idCiudad', 'idSucursal'
    ];
    const missingFields = requiredFields.filter(f => dto[f] === undefined || dto[f] === '' || dto[f] === null);
    if (missingFields.length > 0) {
      return res.status(400).json({
        message: 'Campos requeridos faltantes',
        missingFields,
        success: false,
      });
    }

    // 5. Validar formato de email
    if (dto.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dto.email)) {
      return res.status(400).json({ message: 'Formato de email inválido', success: false });
    }

    // 7. Verificar duplicados
    const checkDuplicate = async (column: string, value: string, alias: string) => {
      const result = await queryRunner.manager.query(`
        SELECT TOP 1 c.IdEmpleado
        FROM RRHH.Empleado c
        JOIN GENERAL.Persona p ON p.IdPersona = c.IdPersona
        WHERE LOWER(REPLACE(REPLACE(p.${column}, ' ', ''), '-', '')) = LOWER(REPLACE(REPLACE(@0, ' ', ''), '-', ''))
      `, [value]);
      if (result.length > 0) {
        throw { code: 'DUPLICATE', field: alias };
      }
    };

    await checkDuplicate('NumDoc', dto.numDoc, 'documento');
    if (dto.email) await checkDuplicate('Email', dto.email, 'email');
    if (dto.celular) await checkDuplicate('Celular', dto.celular, 'celular');

    // 8. Insertar usando stored procedure
    const result = await queryRunner.query(`
      EXEC CATALOGOS.sp_InsertarEmpleado 
        @Nombres = @0, @Apellidos = @1, @Direccion = @2, @Telefono = @3, @Celular = @4,
        @Email = @5, @TipoDoc = @6, @NumDoc = @7, @IdCiudad = @8, @IdSucursal = @9, @CreadoPor = @10, @Puesto = @11
    `, [
      dto.nombres, dto.apellidos, dto.direccion, dto.telefono,
      dto.celular, dto.email, dto.tipoDoc, dto.numDoc,
      dto.idCiudad, dto.idSucursal, req.user.id, dto.puesto
    ]);
    console.log(result)
    if (!result?.[0]) throw new Error('Error interno. Resultado vacío del procedimiento almacenado.');

    await queryRunner.commitTransaction();

    return res.status(201).json({
      message: 'Empleado creado exitosamente',
      success: true,
      data: toCamelCase(result[0]),
    });

  } catch (err: any) {
    await queryRunner.rollbackTransaction();

    if (err.code === 'DUPLICATE') {
      return res.status(409).json({
        message: `El ${err.field} ya está registrado`,
        success: false,
      });
    }

    console.error('Error al crear empleado:', err);
    return res.status(500).json({
      message: 'Error interno del servidor',
      success: false,
    });
  } finally {
    await queryRunner.release();
  }
};
export const updateEmpleado = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const dto = req.body;
    const usuarioId = req.user?.id || null;
    console.log(dto)
    console.log("usuarioId", usuarioId )

    const resultado = await AppDataSource.query(
      `EXEC CATALOGOS.Empleado_ACTUALIZAR 
        @IdEmpleado = @0, @Nombres = @1, @Apellidos = @2, @Direccion = @3, @Telefono = @4, @Celular = @5, 
        @Email = @6, @TipoDoc = @7, @NumDoc = @8, @IdCiudad = @9, @IdSucursal = @10, @ModificadoPor = @11, @Puesto = @12`,
      [
        id,
        dto.nombres,
        dto.apellidos,
        dto.direccion,
        dto.telefono,
        dto.celular,
        dto.email,
        dto.tipoDoc,
        dto.numDoc,
        dto.idCiudad,
        dto.idSucursal,
        usuarioId,
        dto.puesto
      ]
    );

    if (!resultado?.[0]) throw new Error('Error interno. Resultado vacío del procedimiento almacenado.');
    const formattedResultado = toCamelCase(resultado[0]);
    res.status(200).json({
      success: true,
      message: 'Empleado actualizado con éxito',
      data: formattedResultado,
    });
  } catch (error) {
    console.log(error)
    res.status(500).json({
      success: false,
      message: 'Error de transacción al actualizar',
      error
    });
  }
};

export const deleteEmpleados = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ message: 'Debes seleccionar al menos un empleado', success: false });
      return;
    }

    const empleadoRepo = AppDataSource.getRepository(Empleado);
    const empleados = await empleadoRepo.findBy({ idEmpleado: In(ids), eliminado: false });
    if (empleados.length === 0) {
      res.status(404).json({ message: 'No se encontraron los empleados proporcionados', success: false });
      return;
    }

    const usuarioId = req.user?.id ?? null;
    const fecha = new Date();

    const actualizados = empleados.map(empleado => {
      empleado.eliminado = true;
      empleado.eliminadoPor = usuarioId;
      empleado.fechaEliminacion = fecha;
      return empleado;
    });

    await empleadoRepo.save(actualizados);

    res.status(200).json({
      message: 'Empleados eliminados exitosamente',
      count: actualizados.length,
      success: true
    });
  } catch (error) {
    console.error(error)
    res.status(500).json({
      message: 'Error al eliminar los empleados',
      error: error instanceof Error ? error.message : String(error),
      success: false
    });
  }
};