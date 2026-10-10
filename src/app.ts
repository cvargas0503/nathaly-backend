import express from 'express'
import cors from 'cors'
import authRoutes from './modules/auth/auth.routes'
import { errorHandler } from './modules/auth/auth.middleware'
import linea from './modules/catalogos/Linea/linea.routes'
import marca from './modules/catalogos/Marca/marca.routes'
import categoria from './modules/catalogos/Categoria/categoria.routes'
import proveedor from './modules/catalogos/Proveedor/proveedor.routes'
import precio from './modules/inventario/Precio/precio.routes'
import datos from './modules/catalogos/Datos/datos.routes'
import clientes from './modules/catalogos/Cliente/cliente.routes'
import productos from './modules/inventario/Producto/producto.routes'
import ventas from './modules/ventas/Venta/venta.routes'
import compras from './modules/compras/compra/compra.routes'
import kardex from './modules/inventario/Kardex/kardex.routes';
import traslados from './modules/inventario/Traslado/traslado.routes';
import pedidos from './modules/ventas/Pedido/pedido.routes';
import empleados from './modules/rrhh/Empleado/empleado.routes';
import usuarios from './modules/seguridad/Usuario/usuario.routes'
import sucursales from './modules/catalogos/Sucursal/sucursal.routes';
import permisos from './modules/seguridad/Permiso/permiso.routes';
import arqueos from './modules/caja/Arqueo/arqueo.routes';
import movimientosCajas from './modules/caja/MovimientoCaja/movimientoCaja.routes';
import dashboard from './modules/dashboard/dashboard.routes';
import reportes from './modules/reportes/reportes.routes';
import configuracion from './modules/configuracion/configuracion.routes';
import busqueda from './modules/busqueda/busqueda.routes';
import notificaciones from './modules/notificaciones/notificaciones.routes';
import devoluciones from './modules/devoluciones/devoluciones.routes';
import cookieParser from 'cookie-parser';
import { environment } from './config/environment'
const app = express()
const allowedOrigins = environment.allowedOrigins
app.use(cors({
  origin: allowedOrigins,
  credentials: true, // permite enviar cookies o tokens
}));
app.use(cookieParser())
app.use(express.json())
app.use('/uploads', express.static(environment.uploadsDirectory));
app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/lineas', linea)
app.use('/api/v1/marcas', marca)
app.use('/api/v1/categorias', categoria)
app.use('/api/v1/proveedores', proveedor)
app.use('/api/v1/datos', datos)
app.use('/api/v1/precios', precio)
app.use('/api/v1/clientes', clientes)
app.use('/api/v1/productos', productos)
app.use('/api/v1/ventas', ventas)
app.use('/api/v1/compras', compras)
app.use('/api/v1/kardex', kardex)
app.use('/api/v1/traslados', traslados)
app.use('/api/v1/pedidos', pedidos)
app.use('/api/v1/sucursales', sucursales)
app.use('/api/v1/empleados', empleados)
app.use('/api/v1/usuarios', usuarios)
app.use('/api/v1/permisos', permisos)
app.use('/api/v1/arqueos', arqueos)
app.use('/api/v1/caja', movimientosCajas)

app.use('/api/v1/dashboard', dashboard)
app.use('/api/v1/reportes', reportes)
app.use('/api/v1/configuracion', configuracion)
app.use('/api/v1/busqueda', busqueda)
app.use('/api/v1/notificaciones', notificaciones)
app.use('/api/v1/devoluciones', devoluciones)
app.use(errorHandler);
export default app
