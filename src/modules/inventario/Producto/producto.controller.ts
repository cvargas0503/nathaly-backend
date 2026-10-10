import { Response } from "express";
import { AppDataSource } from "../../../../ormconfig";
import { AuthenticatedRequest } from "../../auth/auth.middleware";
import { Producto } from "../entities/Producto";
import { ProductoPrecio } from "../entities/ProductoPrecio";
import { ProductoImagen } from "../entities/ProductoImagen";
import { QueryFailedError } from "typeorm";
import { normalizar } from "../../../helpers";
import { Marca } from "../../catalogos/entities/Marca";
import { Proveedor } from "../../catalogos/entities/Proveedor";
import { Categoria } from "../../catalogos/entities/Categoria";
import { Linea } from "../../catalogos/entities/Linea";

export const createProducto = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const {
      codigo,
      descripcion,
      costo,
      existenciaMin,
      existenciaMax,
      idMarca,
      idCategoria,
      idProveedor,
      idLinea,
      referencia,
      precios,
    } = req.body;

    const userId = req.user?.id;
    // Validaciones básicas
    if (!codigo || !descripcion || !costo || !idMarca || !idCategoria || !idProveedor || !idLinea || !referencia || !precios) {
      return res.status(400).json({
        message: "Faltan campos obligatorios",
        success: false,
        requiredFields: ["codigo", "descripcion", "costo", "idMarca", "idCategoria", "idProveedor", "idLinea", "referencia"],
      });
    }

    const preciosConvertidos = JSON.parse(precios)

    const normalizedCodigo = normalizar(codigo);
    const normalizedReferencia = normalizar(referencia);

    const existing = await queryRunner.query(`
    SELECT TOP 1 *
    FROM INVENTARIO.Producto
    WHERE
        LOWER(REPLACE(REPLACE(Codigo, '-', ''), ' ', '')) = @0
        OR LOWER(REPLACE(REPLACE(Referencia, '-', ''), ' ', '')) = @1
    `, [normalizedCodigo, normalizedReferencia]);

    if (existing.length > 0) {
        return res.status(409).json({
            message: "Ya existe un producto con código o referencia similar.",
            success: false,
        });
    }
    // Insertar producto principal
    const nuevoProducto = queryRunner.manager.create(Producto, {
      codigo: codigo.toUpperCase(),
      descripcion,
      costo: parseFloat(costo),
      existenciaMin: existenciaMin || 0,
      existenciaMax: existenciaMax || 0,
      idMarca,
      idCategoria,
      idProveedor,
      idLinea,
      referencia,
      creadoPor: userId,
      fechaCreacion: new Date()
    });

    const productoGuardado = await queryRunner.manager.save(Producto, nuevoProducto);

    // Insertar precios
    const preciosData: ProductoPrecio[] = Object.entries(preciosConvertidos).map(([idListaPrecio, precio]: any) =>
      queryRunner.manager.create(ProductoPrecio, {
        idProducto: productoGuardado.idProducto,
        idListaPrecio: parseInt(idListaPrecio),
        precio: parseFloat(precio),
        fechaDesde: new Date(),
        creadoPor: userId,
        fechaCreacion: new Date(),
      })
    );
    await queryRunner.manager.save(ProductoPrecio, preciosData);
    const file = req.file;
    if (file && !['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
    return res.status(400).json({
        message: 'Tipo de archivo no permitido',
        success: false
    });
}
    const urlImagen = file?.filename ? `/uploads/productos/${file.filename}` : '';
    if (urlImagen) {
    const nuevaImagen = queryRunner.manager.create(ProductoImagen, {
        idProducto: productoGuardado,
        urlArchivo: urlImagen,
        orden: 1,
        creadoPor: userId,
        fechaCreacion: new Date()
    });
    await queryRunner.manager.save(ProductoImagen, nuevaImagen);
    }else {
        throw new Error("ERROR IMAGEN NO DADA")
    }
    await queryRunner.commitTransaction();
    return res.status(201).json({
      message: "Producto creado exitosamente",
      data: productoGuardado,
      success: true
    });

  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error(error)
    if (error instanceof QueryFailedError) {
      const msg = (error as any).driverError?.message || error.message;
      if (msg.includes("UNIQUE") && msg.includes("Codigo")) {
        return res.status(409).json({
          message: "Ya existe un producto con ese código.",
          field: "codigo",
          success: false,
        });
      }
    }

    return res.status(500).json({ message: "Error interno al crear el producto", success: false });
  } finally {
    await queryRunner.release();
  }
};

export const getProductos = async (req: Request, res: Response) => {
  try {
    const productos = await AppDataSource
      .createQueryBuilder()
      .select([
        "p.idProducto AS idProducto",
        "p.codigo AS codigo",
        "p.descripcion AS descripcion",
        "p.referencia AS referencia",
        "p.costo AS costo",
        "p.existenciaMin AS existenciaMin",
        "p.existenciaMax AS existenciaMax",
        "p.idMarca AS idMarca",
        "m.nombre AS marca",
        "p.idProveedor AS idProveedor",
        "pr.nombre AS proveedor",
        "p.idCategoria AS idCategoria",
        "c.nombre AS categoria",
        "p.idLinea AS idLinea",
        "l.nombre AS linea",
        "img.urlArchivo AS imagen"
      ])
      .from(Producto, "p")
      .leftJoin(ProductoImagen, "img", "img.idProducto = p.idProducto AND img.orden = 1 AND img.eliminado = 0")
      .leftJoin(Marca, "m", "m.idMarca = p.idMarca")
      .leftJoin(Proveedor, "pr", "pr.idProveedor = p.idProveedor")
      .leftJoin(Categoria, "c", "c.idCategoria = p.idCategoria")
      .leftJoin(Linea, "l", "l.idLinea = p.idLinea")
      .where("p.eliminado = 0")
      .orderBy("p.idProducto", "DESC")
      .limit(10)
      .offset(0)
      .getRawMany();

    // Traer precios de todos los productos que obtuviste
    const idsProductos = productos.map(p => p.idProducto);

    const precios = await AppDataSource
      .getRepository(ProductoPrecio)
      .createQueryBuilder("pp")
      .select([
        "pp.idProducto AS idProducto",
        "pp.idListaPrecio AS idListaPrecio",
        "pp.precio AS precio"
      ])
      .where("pp.idProducto IN (:...ids)", { ids: idsProductos })
      .andWhere("pp.eliminado = 0")
      .andWhere("pp.fechaHasta IS NULL OR pp.fechaHasta >= CAST(GETDATE() AS DATE)") // Precios vigentes
      .getRawMany();

    // Estructurar precios en formato { [idListaPrecio]: precio }
    const preciosPorProducto: { [idProducto: number]: { [idListaPrecio: number]: number } } = {};

    precios.forEach(precio => {
      if (!preciosPorProducto[precio.idProducto]) {
        preciosPorProducto[precio.idProducto] = {};
      }
      preciosPorProducto[precio.idProducto][precio.idListaPrecio] = Number(precio.precio);
    });

    // Unir los precios a cada producto
    const productosConPrecios = productos.map(p => ({
      ...p,
      precios: preciosPorProducto[p.idProducto] || {}
    }));

    return res.json({ success: true, data: productosConPrecios });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Error al obtener productos" });
  }
};

export const deleteProductos = async (req: AuthenticatedRequest, res: Response) => {
  const { ids } = req.body;
  const userId = req.user?.id;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({
      message: "Debe proporcionar una lista de IDs de productos a eliminar.",
      success: false,
    });
  }

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    await queryRunner.manager
      .createQueryBuilder()
      .update(Producto)
      .set({
        eliminado: 1,
        eliminadoPor: userId,
        fechaEliminacion: new Date(),
      })
      .where("idProducto IN (:...ids)", { ids })
      .execute();

    await queryRunner.commitTransaction();
    return res.json({
      message: "Productos eliminados correctamente.",
      success: true,
    });
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error(error);
    return res.status(500).json({
      message: "Error al eliminar productos.",
      success: false,
    });
  } finally {
    await queryRunner.release();
  }
};

export const updateProducto = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const {
      idProducto,
      codigo,
      descripcion,
      costo,
      existenciaMin,
      existenciaMax,
      idMarca,
      idCategoria,
      idProveedor,
      idLinea,
      referencia,
      precios,
    } = req.body;

    const userId = req.user?.id;

    if (
      !idProducto ||
      !codigo ||
      !descripcion ||
      !costo ||
      !idMarca ||
      !idCategoria ||
      !idProveedor ||
      !idLinea ||
      !referencia ||
      !precios
    ) {
      return res.status(400).json({
        message: "Faltan campos obligatorios",
        success: false,
        requiredFields: [
          "idProducto",
          "codigo",
          "descripcion",
          "costo",
          "idMarca",
          "idCategoria",
          "idProveedor",
          "idLinea",
          "referencia",
        ],
      });
    }

    const preciosConvertidos = typeof precios === "string" ? JSON.parse(precios) : precios;

    const normalizedCodigo = normalizar(codigo);
    const normalizedReferencia = normalizar(referencia);

    // Verificar si existe otro producto con el mismo código o referencia
    const existing = await queryRunner.query(
      `
      SELECT TOP 1 *
      FROM INVENTARIO.Producto
      WHERE
        (LOWER(REPLACE(REPLACE(Codigo, '-', ''), ' ', '')) = @0
        OR LOWER(REPLACE(REPLACE(Referencia, '-', ''), ' ', '')) = @1)
        AND idProducto <> @2
      `,
      [normalizedCodigo, normalizedReferencia, idProducto]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        message: "Ya existe un producto con código o referencia similar.",
        success: false,
      });
    }

    // Actualizar producto principal
    await queryRunner.manager.update(
      Producto,
      { idProducto },
      {
        codigo: codigo.toUpperCase(),
        descripcion,
        costo: parseFloat(costo),
        existenciaMin: existenciaMin || 0,
        existenciaMax: existenciaMax || 0,
        idMarca,
        idCategoria,
        idProveedor,
        idLinea,
        referencia,
        modificadoPor: userId,
        fechaModificacion: new Date(),
      }
    );

    // Actualizar precios: eliminar los actuales y agregar los nuevos
    await queryRunner.manager
      .createQueryBuilder()
      .update(ProductoPrecio)
      .set({
        eliminado: 1,
        eliminadoPor: userId,
        fechaEliminacion: new Date(),
      })
      .where("idProducto = :idProducto AND eliminado = 0", { idProducto })
      .execute();

    const preciosData: ProductoPrecio[] = Object.entries(preciosConvertidos).map(([idListaPrecio, precio]: any) =>
      queryRunner.manager.create(ProductoPrecio, {
        idProducto,
        idListaPrecio: parseInt(idListaPrecio),
        precio: parseFloat(precio),
        fechaDesde: new Date(),
        creadoPor: userId,
        fechaCreacion: new Date(),
      })
    );
    await queryRunner.manager.save(ProductoPrecio, preciosData);

    // Imagen
    const file = req.file;
    if (file && !['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      return res.status(400).json({
        message: 'Tipo de archivo no permitido',
        success: false,
      });
    }

    if (file?.filename) {
      // Eliminar imagen anterior (marcar como eliminada)
      await queryRunner.manager
        .createQueryBuilder()
        .update(ProductoImagen)
        .set({
          eliminado: 1,
          eliminadoPor: userId,
          fechaEliminacion: new Date(),
        })
        .where("idProducto = :idProducto AND orden = 1 AND eliminado = 0", { idProducto })
        .execute();

      // Guardar nueva imagen
      const urlImagen = `/uploads/productos/${file.filename}`;
      const nuevaImagen = queryRunner.manager.create(ProductoImagen, {
        idProducto,
        urlArchivo: urlImagen,
        orden: 1,
        creadoPor: userId,
        fechaCreacion: new Date(),
      });
      await queryRunner.manager.save(ProductoImagen, nuevaImagen);
    }

    await queryRunner.commitTransaction();
    return res.json({
      message: "Producto actualizado exitosamente",
      success: true,
    });
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error(error);
    if (error instanceof QueryFailedError) {
      const msg = (error as any).driverError?.message || error.message;
      if (msg.includes("UNIQUE") && msg.includes("Codigo")) {
        return res.status(409).json({
          message: "Ya existe un producto con ese código.",
          field: "codigo",
          success: false,
        });
      }
    }
    return res.status(500).json({ message: "Error interno al actualizar el producto", success: false });
  } finally {
    await queryRunner.release();
  }
};
