import { Response } from "express";
import { AppDataSource } from "../../../../ormconfig";
import { Sucursal } from "../entities/Sucursal";
import { SucursalTelefono } from "../entities/SucursalTelefono";
import { Ciudad } from "../entities/Ciudad";
import { AuthenticatedRequest } from "../../auth/auth.middleware";

export const crearSucursal = async (req: AuthenticatedRequest, res: Response) => {
  const { codigoSucursal, nombre, direccion, idCiudad, telefonos } = req.body;
  const idUsuario = req.user?.id;

  if (!codigoSucursal || !nombre || !idCiudad || !Array.isArray(telefonos) || telefonos.length === 0) {
    return res.status(400).json({ success: false, message: "Datos incompletos" });
  }

  const file = req.file;
  if (!file || !['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
    return res.status(400).json({ success: false, message: "Debe proporcionar una imagen válida (jpg, png, webp)" });
  }

  const urlImagen = `/uploads/sucursales/${file.filename}`;
  const queryRunner = AppDataSource.createQueryRunner();

  try {
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const ciudadRepo = queryRunner.manager.getRepository(Ciudad);
    const sucursalRepo = queryRunner.manager.getRepository(Sucursal);
    const telefonoRepo = queryRunner.manager.getRepository(SucursalTelefono);

    const ciudad = await ciudadRepo.findOneBy({ idCiudad });
    if (!ciudad) {
      await queryRunner.rollbackTransaction();
      return res.status(400).json({ success: false, message: "Ciudad no encontrada" });
    }

    const existeCodigo = await sucursalRepo.findOneBy({ codigoSucursal });
    if (existeCodigo) {
      await queryRunner.rollbackTransaction();
      return res.status(400).json({ success: false, message: "Código de sucursal ya existe" });
    }

    const nuevaSucursal = new Sucursal({
      codigoSucursal,
      nombre,
      direccion,
      logo: urlImagen,
      activo: true,
      eliminado: false,
      fechaCreacion: new Date(),
      creadoPor: idUsuario,
      idCiudad: ciudad,
    });

    const sucursalGuardada = await sucursalRepo.save(nuevaSucursal);

    const telefonosParaGuardar = telefonos.map((numero: string) =>
      new SucursalTelefono({
        numero,
        idSucursal: sucursalGuardada,
        activo: true,
        eliminado: false,
        fechaCreacion: new Date(),
        creadoPor: idUsuario,
      })
    );

    await telefonoRepo.save(telefonosParaGuardar);

    await queryRunner.commitTransaction();

    return res.status(201).json({
      success: true,
      message: "Sucursal creada correctamente",
      idSucursal: sucursalGuardada.idSucursal,
    });
  } catch (error) {
    console.error("Error al crear sucursal:", error);
    await queryRunner.rollbackTransaction();
    return res.status(500).json({ success: false, message: "Error interno del servidor" });
  } finally {
    await queryRunner.release();
  }
};

export const actualizarSucursal = async (req: AuthenticatedRequest, res: Response) => {
  const idSucursal = parseInt(req.params.idSucursal);
  const { codigoSucursal, nombre, direccion, idCiudad, telefonos } = req.body;
  const idUsuario = req.user?.id || 1;

  if (!idSucursal || !codigoSucursal || !nombre || !idCiudad || !Array.isArray(telefonos) || telefonos.length === 0) {
    return res.status(400).json({ success: false, message: "Datos incompletos" });
  }

  const file = req.file;
  const queryRunner = AppDataSource.createQueryRunner();

  try {
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const sucursalRepo = queryRunner.manager.getRepository(Sucursal);
    const ciudadRepo = queryRunner.manager.getRepository(Ciudad);
    const telefonoRepo = queryRunner.manager.getRepository(SucursalTelefono);

    const sucursal = await sucursalRepo.findOne({
      where: { idSucursal, eliminado: false },
      relations: { idCiudad: true },
    });

    if (!sucursal) {
      await queryRunner.rollbackTransaction();
      return res.status(404).json({ success: false, message: "Sucursal no encontrada" });
    }

    const ciudad = await ciudadRepo.findOneBy({ idCiudad });
    if (!ciudad) {
      await queryRunner.rollbackTransaction();
      return res.status(400).json({ success: false, message: "Ciudad no encontrada" });
    }

    // Validar código duplicado si se modificó
    if (codigoSucursal !== sucursal.codigoSucursal) {
      const existeCodigo = await sucursalRepo.findOneBy({ codigoSucursal });
      if (existeCodigo) {
        await queryRunner.rollbackTransaction();
        return res.status(400).json({ success: false, message: "Código de sucursal ya existe" });
      }
    }

    // Si hay nueva imagen, actualizarla
    console.log("Archivo recibido:", file);
    if (file) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
        await queryRunner.rollbackTransaction();
        return res.status(400).json({ success: false, message: "Debe proporcionar una imagen válida" });
      }
      sucursal.logo = `/uploads/sucursales/${file.filename}`;
    }

    sucursal.codigoSucursal = codigoSucursal;
    sucursal.nombre = nombre;
    sucursal.direccion = direccion;
    sucursal.idCiudad = ciudad;
    sucursal.modificadoPor = idUsuario;
    sucursal.fechaModificacion = new Date();

    await sucursalRepo.save(sucursal);

    // Eliminar teléfonos antiguos y guardar nuevos
    await telefonoRepo.delete({ idSucursal: { idSucursal } });

    const nuevosTelefonos = telefonos.map((numero: string) =>
      new SucursalTelefono({
        numero,
        idSucursal: sucursal,
        activo: true,
        eliminado: false,
        fechaCreacion: new Date(),
        creadoPor: idUsuario,
      })
    );

    await telefonoRepo.save(nuevosTelefonos);

    await queryRunner.commitTransaction();

    return res.json({ success: true, message: "Sucursal actualizada correctamente" });
  } catch (error) {
    console.error("Error al actualizar sucursal:", error);
    await queryRunner.rollbackTransaction();
    return res.status(500).json({ success: false, message: "Error interno del servidor" });
  } finally {
    await queryRunner.release();
  }
};

export const eliminarSucursal = async (req: AuthenticatedRequest, res: Response) => {
  const { idSucursal } = req.params;
  const idUsuario = req.user?.id || 1; // Ajusta según autenticación real

  if (!idSucursal) {
    return res.status(400).json({ success: false, message: "ID de sucursal es requerido" });
  }

  const queryRunner = AppDataSource.createQueryRunner();

  try {
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const sucursalRepo = queryRunner.manager.getRepository(Sucursal);
    const telefonoRepo = queryRunner.manager.getRepository(SucursalTelefono);


    const sucursal = await sucursalRepo.findOne({
      where: { idSucursal: Number(idSucursal), eliminado: false },
      relations: ["bodegas", "clientes", "sucursalTelefonos"],
    });

    if (!sucursal) {
      await queryRunner.rollbackTransaction();
      return res.status(404).json({ success: false, message: "Sucursal no encontrada o ya eliminada" });
    }

    // Validación opcional: Si tiene dependencias, evitar eliminación
    if (sucursal.sucursalTelefonos?.length > 0) {
      await Promise.all(
        sucursal.sucursalTelefonos.map(async (tel) => {
          tel.eliminado = true;
          tel.eliminadoPor = idUsuario;
          tel.fechaEliminacion = new Date();
          await telefonoRepo.save(tel);
        })
      );
    }

    if (sucursal.bodegas?.length > 0) {
      await Promise.all(
        sucursal.bodegas.map(async (bodega) => {
          bodega.eliminado = true;
          bodega.eliminadoPor = idUsuario;
          bodega.fechaEliminacion = new Date();
          await queryRunner.manager.save(bodega);
        })
      );
    }

    if (sucursal.clientes?.length > 0) {
      await Promise.all(
        sucursal.clientes.map(async (cliente) => {
          cliente.eliminado = true;
          cliente.eliminadoPor = idUsuario;
          cliente.fechaEliminacion = new Date();
          await queryRunner.manager.save(cliente);
        })
      );
    }


    // Soft Delete de la sucur


    // Soft delete
    sucursal.eliminado = true;
    sucursal.eliminadoPor = idUsuario;
    sucursal.fechaEliminacion = new Date();

    await sucursalRepo.save(sucursal);

    await queryRunner.commitTransaction();

    return res.json({ success: true, message: "Sucursal eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar sucursal:", error);
    await queryRunner.rollbackTransaction();
    return res.status(500).json({ success: false, message: "Error interno del servidor" });
  } finally {
    await queryRunner.release();
  }
};
