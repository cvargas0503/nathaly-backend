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
    const page = Math.max(1);
    const limit = Math.max(1, 10);
    const skip = (page - 1) * limit;

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
  .leftJoin(Marca, "m", "m.IdMarca = p.IdMarca")
  .leftJoin(Proveedor, "pr", "pr.IdProveedor = p.IdProveedor")
  .leftJoin(Categoria, "c", "c.IdCategoria = p.IdCategoria")
  .leftJoin(Linea, "l", "l.IdLinea = p.IdLinea")
  .where("p.eliminado = 0")
  .orderBy("p.idProducto", "DESC")
  .limit(10)
  .offset(0)
  .getRawMany();

// luego otra consulta para obtener todos los precios de esos productos
const precios = await AppDataSource
  .getRepository(ProductoPrecio)
  .createQueryBuilder("pp")
  .select(["pp.idProducto AS idProducto", "pp.idListaPrecio AS idListaPrecio", "pp.precio as precio"])
  .where("pp.eliminado = 0 AND (pp.fechaHasta IS NULL OR pp.fechaHasta >= GETDATE())")
  .andWhere("pp.idProducto IN (:...ids)", { ids: productos.map(p => p.idProducto) })
  .getRawMany();

// agrupar

// combinar
const productosConPrecios = productos.map(p => ({
  ...p,
  precios: precios.filter(x => x.idProducto === p.idProducto)|| []
}));


 
    return res.json({
      data: productosConPrecios,
      pagination: {
        page,
        limit,
      },
      success: true,
      message: "Productos obtenidos exitosamente"
    });

  } catch (error) {
    console.error("Error al obtener productos:", error);
    return res.status(500).json({ message: "Error al obtener productos", success: false });
  }
};