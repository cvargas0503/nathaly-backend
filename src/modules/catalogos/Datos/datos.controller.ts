import { Request, Response } from 'express';
import { AppDataSource } from '../../../../ormconfig';
import { Marca } from '../entities/Marca';
import { Linea } from '../entities/Linea';
import { Proveedor } from '../entities/Proveedor';
import { ListaPrecio } from '../../inventario/entities/ListaPrecio';
import { Categoria } from '../entities/Categoria';
import { Sucursal } from '../entities/Sucursal';
import { Ciudad } from '../entities/Ciudad';
import { Termino } from '../entities/Termino';
import { toCamelCase } from '../../../helpers';
import { Bodega } from '../../inventario/entities/Bodega';

export const getDatosFormularioProducto = async (_req: Request, res: Response): Promise<Response> => {
  try {
    const marcaRepo = AppDataSource.getRepository(Marca);
    const categoriaRepo = AppDataSource.getRepository(Categoria);
    const lineaRepo = AppDataSource.getRepository(Linea);
    const proveedorRepo = AppDataSource.getRepository(Proveedor);
    const listaPrecioRepo = AppDataSource.getRepository(ListaPrecio);

    const [marcas, categorias, lineas, proveedores, listasPrecio] = await Promise.all([
      marcaRepo.find({ where: { eliminado: false }, order: { nombre: 'ASC' } }),
      categoriaRepo.find({ where: { eliminado: false }, order: { nombre: 'ASC' } }),
      lineaRepo.find({ where: { eliminado: false }, order: { nombre: 'ASC' } }),
      proveedorRepo.find({ where: { eliminado: false }, order: { nombre: 'ASC' } }),
      listaPrecioRepo.find({ where: { eliminado: false }, order: { nombre: 'ASC' } })
    ]);

    return res.json({
      success: true,
      message: 'Datos del formulario obtenidos correctamente',
      data: {
        marcas,
        categorias,
        lineas,
        proveedores,
        listasPrecio
      }
    });
  } catch (error) {
    console.error('Error al obtener datos del formulario de producto:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener datos del formulario de producto',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};


export const getDatosFormularioCliente = async (_req: Request, res: Response): Promise<Response> => {
  try {
    const sucursalRepo = AppDataSource.getRepository(Sucursal);
    const ciudadRepo = AppDataSource.getRepository(Ciudad);

    const [sucursales, ciudades] = await Promise.all([
      sucursalRepo.find({ where: { eliminado: false }, order: { nombre: 'ASC' },  relations: ["sucursalTelefonos", "idCiudad"], }),
      ciudadRepo.find({ where: { eliminado: false }, order: { nombre: 'ASC' } }),
    ]);

    return res.json({
      success: true,
      message: 'Datos del formulario obtenidos correctamente',
      data: {
        sucursales,
        ciudades,
      }
    });
  } catch (error) {
    console.error('Error al obtener datos del formulario de cliente:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener datos del formulario de cliente',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

export const getDatosFormularioFactura = async (_req: Request, res: Response): Promise<Response> => {
  try {
    const sucursalRepo = AppDataSource.getRepository(Sucursal);

    const empleados: any[] = await AppDataSource.query('EXEC REPORTES.sp_ObtenerEmpleados');
    const clientes: any[] = await AppDataSource.query('EXEC REPORTES.sp_ObtenerClientes');
    const terminoRepo = AppDataSource.getRepository(Termino);

    const [sucursales, terminos] = await Promise.all([
      sucursalRepo.find({ where: { eliminado: false }, order: { nombre: 'ASC' } }),
      terminoRepo.find({ where: { eliminado: false }, order: { idTermino: 'ASC' } }),
    ]);

    const data = {
      sucursales,
      terminos,
      empleados,
      clientes
    };

    const dataCamelCase = toCamelCase(data);

    return res.json({
      success: true,
      message: 'Datos del formulario obtenidos correctamente',
      data: dataCamelCase
    });
  } catch (error) {
    console.error('Error al obtener datos del formulario de cliente:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener datos del formulario de cliente',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};
export const getDatosProductoFactura = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { idSucursal } = req.params;

    if (!idSucursal || isNaN(Number(idSucursal))) {
      return res.status(400).json({
        success: false,
        message: 'IdSucursal inválido en la ruta'
      });
    }

    const productos: any[] = await AppDataSource.query(
      'EXEC INVENTARIO.sp_Productos_StockYPrecios @IdSucursal = @0',
      [Number(idSucursal)]
    );

    const productosProcesados = productos.map(p => ({
      ...p,
    Precios: JSON.parse(p.Precios || '{}')
    }));

    const dataCamelCase = toCamelCase(productosProcesados);

    return res.json({
      success: true,
      message: 'Datos de productos obtenidos correctamente',
      data: dataCamelCase
    });
  } catch (error) {
    console.error('Error al obtener datos del formulario de producto:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener datos del formulario de producto',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

export const getDatosFormularioCompra = async (_req: Request, res: Response): Promise<Response> => {
  try {
    const proveedorRepo = AppDataSource.getRepository(Proveedor);
    const sucursalRepo = AppDataSource.getRepository(Sucursal);
    const empleados: any[] = await AppDataSource.query('EXEC REPORTES.sp_ObtenerEmpleados');

    const [proveedores, sucursales] = await Promise.all([
      proveedorRepo.find({ where: { eliminado: false }, order: { nombre: 'ASC' } }),
      sucursalRepo
        .createQueryBuilder('sucursal')
        .leftJoinAndSelect('sucursal.bodegas', 'bodega', 'bodega.eliminado = :eliminado', { eliminado: false })
        .where('sucursal.eliminado = :eliminado', { eliminado: false })
        .orderBy('sucursal.nombre', 'ASC')
        .addOrderBy('bodega.nombre', 'ASC')
        .select([
          'sucursal.idSucursal',
          'sucursal.nombre',
          'bodega.idBodega',
          'bodega.nombre'
        ])
        .getMany(),
    ]);
    const empleadosProcesados = toCamelCase(empleados);
    return res.json({
      success: true,
      message: 'Datos del formulario obtenidos correctamente',
      data: {
        proveedores,
        sucursales,
        empleados: empleadosProcesados
      }
    });
  } catch (error) {
    console.error('Error al obtener datos del formulario de producto:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener datos del formulario de producto',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

export const getDatosFormularioTraslado = async (_req: Request, res: Response): Promise<Response> => {
  try {
    const bodegaRepo = AppDataSource.getRepository(Bodega);
    // const empleados: any[] = await AppDataSource.query('EXEC REPORTES.sp_ObtenerEmpleados');

    const bodegas = await Promise.resolve(
      bodegaRepo
        .createQueryBuilder('bodegas')
        .leftJoinAndSelect('bodegas.sucursal', 'sucursal', 'sucursal.eliminado = :eliminado', { eliminado: false })
        .where('bodegas.eliminado = :eliminado', { eliminado: false })
        .orderBy('bodegas.nombre', 'ASC')
        .addOrderBy('bodegas.nombre', 'ASC')
        .select([
          'bodegas.idBodega',
          'bodegas.nombre',
          'sucursal.idSucursal',
          'sucursal.nombre'
        ])
        .getMany(),
    );
    // const empleadosProcesados = toCamelCase(empleados);
    return res.json({
      success: true,
      message: 'Datos del formulario obtenidos correctamente',
      data: {
        bodegas,
        // empleados: empleadosProcesados
      }
    });
  } catch (error) {
    console.error('Error al obtener datos del formulario de producto:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener datos del formulario de producto',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};
export const getStockBodega = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { idBodega } = req.params;

    if (!idBodega || isNaN(Number(idBodega))) {
      return res.status(400).json({
        success: false,
        message: 'Bodega inválida en la ruta'
      });
    }

    const productos: any[] = await AppDataSource.query(
      'EXEC INVENTARIO.sp_Stock_Bodega @IdBodega = @0',
      [Number(idBodega)]
    );

    const dataCamelCase = toCamelCase(productos);

    return res.json({
      success: true,
      message: 'Datos de productos obtenidos correctamente',
      data: dataCamelCase
    });
  } catch (error) {
    console.error('Error al obtener datos del formulario de producto:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener datos del formulario de producto',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};