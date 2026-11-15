/* Fictional demo data only. Never call this module against the business database. */
function dependency(name) {
  try { return require(name); } catch { return require('/app/node_modules/' + name); }
}
const sql = dependency('mssql');
const bcrypt = dependency('bcryptjs');
const permissions = [
  'GESTIONAR_LINEAS','GESTIONAR_MARCAS','GESTIONAR_CATEGORIAS','GESTIONAR_PROVEEDORES',
  'GESTIONAR_PRECIOS','GESTIONAR_CLIENTES','GESTIONAR_PRODUCTOS','GESTIONAR_SUCURSALES',
  'GESTIONAR_EMPLEADOS','GESTIONAR_USUARIOS','GESTIONAR_PERMISOS','NUEVA_VENTA',
  'VER_VENTAS','ANULAR_VENTA','NUEVO_PEDIDO','VER_PEDIDOS','NUEVA_COMPRA','VER_COMPRAS',
  'NUEVO_TRASLADO','VER_TRASLADOS','VER_KARDEX','VER_ARQUEOS','NUEVO_ARQUEO',
  'PAGAR_VENTAS','VER_MOVIMIENTOS_CAJA','NUEVO_MOVIMIENTO_CAJA','VER_AJUSTES',
  'REGISTRAR_AJUSTES','VER_DEVOLUCIONES','REGISTRAR_DEVOLUCIONES','VER_NOTIFICACIONES',
  'VER_AUDITORIA_CATALOGOS','VER_REPOSICION','ver_dashboard'
];
async function seed(pool, adminPassword) {
  const database = (await pool.request().query('SELECT DB_NAME() AS name')).recordset[0].name;
  if (!/^NATHALY_(DEMO|DEPLOY_TEST_[A-Za-z0-9_]+)$/i.test(database)) {
    throw new Error('Demo seed refuses a non-demo database');
  }
  if (typeof adminPassword !== 'string' || adminPassword.length < 12) {
    throw new Error('DEMO_ADMIN_PASSWORD must contain at least 12 characters');
  }
  const tx = new sql.Transaction(pool);
  await tx.begin();
  const request = () => new sql.Request(tx);
  try {
    await request().query('SET XACT_ABORT ON;');
    const passHash = await bcrypt.hash(adminPassword, 12);
    const setup = await request().input('hash', sql.NVarChar(100), passHash).query(`
      IF NOT EXISTS (SELECT 1 FROM SEGURIDAD.Rol WHERE Nombre=N'DEMO_ADMIN')
        INSERT SEGURIDAD.Rol (Nombre,Descripcion,Activo,Eliminado) VALUES (N'DEMO_ADMIN',N'Rol exclusivo de demostración',1,0);
      DECLARE @rol int=(SELECT IdRol FROM SEGURIDAD.Rol WHERE Nombre=N'DEMO_ADMIN');
      IF NOT EXISTS (SELECT 1 FROM SEGURIDAD.Usuario WHERE Login='demo.admin')
        INSERT SEGURIDAD.Usuario (Login,PassHash,Activo,Eliminado) VALUES ('demo.admin',@hash,1,0);
      DECLARE @usuario int=(SELECT IdUsuario FROM SEGURIDAD.Usuario WHERE Login='demo.admin');
      IF COL_LENGTH('SEGURIDAD.Permiso','IdRol') IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM sys.default_constraints d JOIN sys.columns c ON c.object_id=d.parent_object_id AND c.column_id=d.parent_column_id
        WHERE d.parent_object_id=OBJECT_ID('SEGURIDAD.Permiso') AND c.name='IdRol')
      BEGIN
        DECLARE @ddl nvarchar(max)=N'ALTER TABLE SEGURIDAD.Permiso ADD CONSTRAINT DF_Permiso_DemoRol DEFAULT ('+CONVERT(nvarchar(20),@rol)+N') FOR IdRol';
        EXEC sys.sp_executesql @ddl;
      END;
      SELECT @usuario AS usuario,@rol AS rol;
    `);
    const {usuario,rol}=setup.recordset[0];
    const catalogs = [
      ['Estado','IdEstado',[[1,'FACT_PENDIENTE','Factura pendiente'],[2,'FACT_PAGADA','Factura pagada'],[3,'FACT_ANULADA','Factura anulada']]],
      ['EstadoCxc','IdEstadoCxc',[[1,'PENDIENTE','Pendiente'],[2,'PAGADA','Pagada'],[3,'SIN_APLICAR','Sin aplicar']]],
      ['EstadoPedido','IdEstadoPedido',[[1,'PENDIENTE','Pedido pendiente'],[2,'FACTURADO','Pedido facturado'],[3,'ANULADO','Pedido anulado']]],
      ['EstadoNota','IdEstadoNota',[[1,'EMITIDA','Nota emitida'],[2,'ANULADA','Nota anulada']]],
      ['EstadoCaja','IdEstadoCaja',[[1,'ABIERTA','Caja abierta'],[2,'CERRADA','Caja cerrada']]],
      ['FormaPago','IdFormaPago',[[1,'EFECTIVO','Efectivo de demostración']]],
      ['MotivoDevolucion','IdMotivo',[[1,'DEMO','Motivo de demostración']]]
    ];
    for(const [table,key,rows] of catalogs) for(const [id,code,description] of rows) {
      await request().input('usuario',sql.Int,usuario).input('id',sql.SmallInt,id)
        .input('code',sql.VarChar(30),code).input('description',sql.NVarChar(200),description).query(`
          IF NOT EXISTS (SELECT 1 FROM CATALOGOS.[${table}] WHERE [${key}]=@id)
          BEGIN
            SET IDENTITY_INSERT CATALOGOS.[${table}] ON;
            INSERT CATALOGOS.[${table}] ([${key}],Codigo,Descripcion,CreadoPor) VALUES (@id,@code,@description,@usuario);
            SET IDENTITY_INSERT CATALOGOS.[${table}] OFF;
          END;
        `);
    }
    for(const [id,name,sign] of [[1,'COMPRA',1],[2,'TRASLADO_ENTRADA',1],[3,'TRASLADO_SALIDA',-1],[4,'AJUSTE_ENTRADA',1],[5,'DEVOLUCION_VENTA',1],[6,'ANULACION DE VENTA',1],[7,'VENTA',-1]]) {
      await request().input('usuario',sql.Int,usuario).input('id',sql.SmallInt,id)
        .input('name',sql.NVarChar(80),name).input('sign',sql.SmallInt,sign).query(`
          IF NOT EXISTS (SELECT 1 FROM CATALOGOS.TipoMovimientoInventario WHERE IdTipoMov=@id)
          BEGIN
            SET IDENTITY_INSERT CATALOGOS.TipoMovimientoInventario ON;
            INSERT CATALOGOS.TipoMovimientoInventario (IdTipoMov,Nombre,Descripcion,Signo,CreadoPor) VALUES (@id,@name,@name,@sign,@usuario);
            SET IDENTITY_INSERT CATALOGOS.TipoMovimientoInventario OFF;
          END;
        `);
    }
    for(const entity of ['VENTA','COMPRA','PEDIDO','TRASLADO','NOTA_CREDITO']) {
      await request().input('entity',sql.NVarChar(50),entity).query('IF NOT EXISTS (SELECT 1 FROM ADMIN.Consecutivos WHERE Entidad=@entity) INSERT ADMIN.Consecutivos (Entidad,ValorActual) VALUES (@entity,0)');
    }
    for(const code of permissions) {
      await request().input('code',sql.NVarChar(50),code).input('rol',sql.Int,rol).query(`
        IF NOT EXISTS (SELECT 1 FROM SEGURIDAD.Permiso WHERE Codigo=@code)
          INSERT SEGURIDAD.Permiso (Codigo,Nombre,Descripcion,IdRol,Activo,Eliminado)
            VALUES (@code,@code,N'Permiso de demostración',@rol,1,0);
      `);
    }
    await request().input('usuario',sql.Int,usuario).query(`
      INSERT SEGURIDAD.UsuarioPermiso (IdUsuario,IdPermiso,Permitido,Activo,Eliminado,CreadoPor)
        SELECT @usuario,p.IdPermiso,1,1,0,@usuario FROM SEGURIDAD.Permiso p
        WHERE p.Activo=1 AND p.Eliminado=0 AND NOT EXISTS (SELECT 1 FROM SEGURIDAD.UsuarioPermiso up WHERE up.IdUsuario=@usuario AND up.IdPermiso=p.IdPermiso);
      IF NOT EXISTS (SELECT 1 FROM CATALOGOS.Pais WHERE Nombre=N'País de demostración')
        INSERT CATALOGOS.Pais (Nombre,CreadoPor) VALUES (N'País de demostración',@usuario);
      DECLARE @pais int=(SELECT IdPais FROM CATALOGOS.Pais WHERE Nombre=N'País de demostración');
      IF NOT EXISTS (SELECT 1 FROM CATALOGOS.Ciudad WHERE Nombre=N'Ciudad de demostración')
        INSERT CATALOGOS.Ciudad (IdPais,Nombre,CreadoPor) VALUES (@pais,N'Ciudad de demostración',@usuario);
      DECLARE @ciudad int=(SELECT IdCiudad FROM CATALOGOS.Ciudad WHERE Nombre=N'Ciudad de demostración');
      IF NOT EXISTS (SELECT 1 FROM CATALOGOS.Sucursal WHERE CodigoSucursal=N'DEMO')
        INSERT CATALOGOS.Sucursal (CodigoSucursal,Nombre,Direccion,IdCiudad,CreadoPor) VALUES (N'DEMO',N'Sucursal de demostración',N'Dirección ficticia de prueba',@ciudad,@usuario);
      DECLARE @sucursal int=(SELECT IdSucursal FROM CATALOGOS.Sucursal WHERE CodigoSucursal=N'DEMO');
      IF NOT EXISTS (SELECT 1 FROM INVENTARIO.Bodega WHERE CodigoBodega=N'DEMO')
        INSERT INVENTARIO.Bodega (IdSucursal,CodigoBodega,Nombre,EsPrincipal,CreadoPor) VALUES (@sucursal,N'DEMO',N'Bodega de demostración',1,@usuario);
      DECLARE @bodega int=(SELECT IdBodega FROM INVENTARIO.Bodega WHERE CodigoBodega=N'DEMO');
      IF NOT EXISTS (SELECT 1 FROM GENERAL.Persona WHERE NumDoc=N'DEMO-EMP-001')
        INSERT GENERAL.Persona (Nombre1,Apellido1,IdCiudad,TipoDoc,NumDoc,CreadoPor) VALUES (N'Empleado',N'Demo',@ciudad,'CED',N'DEMO-EMP-001',@usuario);
      DECLARE @personaEmpleado int=(SELECT IdPersona FROM GENERAL.Persona WHERE NumDoc=N'DEMO-EMP-001');
      IF NOT EXISTS (SELECT 1 FROM RRHH.Empleado WHERE Codigo='DEMO-EMP')
        INSERT RRHH.Empleado (IdPersona,IdSucursal,Codigo,Puesto,CreadoPor) VALUES (@personaEmpleado,@sucursal,'DEMO-EMP',N'Demostración',@usuario);
      UPDATE SEGURIDAD.Usuario SET IdEmpleado=(SELECT IdEmpleado FROM RRHH.Empleado WHERE Codigo='DEMO-EMP') WHERE IdUsuario=@usuario AND IdEmpleado IS NULL;
      IF NOT EXISTS (SELECT 1 FROM GENERAL.Persona WHERE NumDoc=N'DEMO-CLI-001')
        INSERT GENERAL.Persona (Nombre1,Apellido1,IdCiudad,TipoDoc,NumDoc,CreadoPor) VALUES (N'Cliente',N'Demo',@ciudad,'CED',N'DEMO-CLI-001',@usuario);
      DECLARE @personaCliente int=(SELECT IdPersona FROM GENERAL.Persona WHERE NumDoc=N'DEMO-CLI-001');
      IF NOT EXISTS (SELECT 1 FROM CATALOGOS.Cliente WHERE Codigo='DEMO-CLI')
        INSERT CATALOGOS.Cliente (IdPersona,IdSucursal,Codigo,TieneCredito,LimiteCredito,CreadoPor) VALUES (@personaCliente,@sucursal,'DEMO-CLI',0,NULL,@usuario);
      IF NOT EXISTS (SELECT 1 FROM CATALOGOS.Termino WHERE Codigo='CONTADO')
        INSERT CATALOGOS.Termino (Codigo,DiasPlazo,CreadoPor) VALUES ('CONTADO',0,@usuario);
      IF NOT EXISTS (SELECT 1 FROM CATALOGOS.Categoria WHERE Nombre=N'Categoría de demostración')
        INSERT CATALOGOS.Categoria (Nombre,CreadoPor) VALUES (N'Categoría de demostración',@usuario);
      IF NOT EXISTS (SELECT 1 FROM CATALOGOS.Marca WHERE Nombre=N'Marca de demostración')
        INSERT CATALOGOS.Marca (Nombre,CreadoPor) VALUES (N'Marca de demostración',@usuario);
      IF NOT EXISTS (SELECT 1 FROM CATALOGOS.Linea WHERE Nombre=N'Línea de demostración')
        INSERT CATALOGOS.Linea (Nombre,CreadoPor) VALUES (N'Línea de demostración',@usuario);
      IF NOT EXISTS (SELECT 1 FROM CATALOGOS.Proveedor WHERE RUC=N'DEMO-PROV-001')
        INSERT CATALOGOS.Proveedor (Nombre,RazonSocial,RUC,Direccion,CreadoPor) VALUES (N'Proveedor demo',N'Proveedor ficticio de demostración',N'DEMO-PROV-001',N'Dirección ficticia',@usuario);
      IF NOT EXISTS (SELECT 1 FROM INVENTARIO.ListaPrecio WHERE Nombre=N'Precio de demostración')
        INSERT INVENTARIO.ListaPrecio (Nombre,Descripcion,CreadoPor) VALUES (N'Precio de demostración',N'Lista ficticia de prueba',@usuario);
      IF NOT EXISTS (SELECT 1 FROM INVENTARIO.Producto WHERE Codigo=N'DEMO-001')
        INSERT INVENTARIO.Producto (Codigo,Descripcion,Costo,ExistenciaMin,ExistenciaMax,CreadoPor,IdLinea,IdMarca,IdCategoria,IdProveedor,Referencia)
          SELECT N'DEMO-001',N'Producto de demostración',50,5,50,@usuario,
            (SELECT IdLinea FROM CATALOGOS.Linea WHERE Nombre=N'Línea de demostración'),
            (SELECT IdMarca FROM CATALOGOS.Marca WHERE Nombre=N'Marca de demostración'),
            (SELECT IdCategoria FROM CATALOGOS.Categoria WHERE Nombre=N'Categoría de demostración'),
            (SELECT IdProveedor FROM CATALOGOS.Proveedor WHERE RUC=N'DEMO-PROV-001'),N'DEMO-REF-001';
      DECLARE @producto int=(SELECT IdProducto FROM INVENTARIO.Producto WHERE Codigo=N'DEMO-001');
      IF NOT EXISTS (SELECT 1 FROM INVENTARIO.Existencia WHERE IdBodega=@bodega AND IdProducto=@producto)
        INSERT INVENTARIO.Existencia (IdBodega,IdProducto,Stock,CreadoPor) VALUES (@bodega,@producto,20,@usuario);
      IF NOT EXISTS (SELECT 1 FROM INVENTARIO.ProductoPrecio WHERE IdProducto=@producto)
        INSERT INVENTARIO.ProductoPrecio (IdProducto,Precio,FechaDesde,IdListaPrecio,CreadoPor)
          VALUES (@producto,75,CONVERT(date,SYSUTCDATETIME()),(SELECT IdListaPrecio FROM INVENTARIO.ListaPrecio WHERE Nombre=N'Precio de demostración'),@usuario);
      IF NOT EXISTS (SELECT 1 FROM CAJA.Moneda WHERE Codigo='NIO')
        INSERT CAJA.Moneda (Codigo,Nombre,Simbolo,CreadoPor) VALUES ('NIO',N'Córdoba',N'C$',@usuario);
      IF NOT EXISTS (SELECT 1 FROM CAJA.Moneda WHERE Codigo='USD')
        INSERT CAJA.Moneda (Codigo,Nombre,Simbolo,CreadoPor) VALUES ('USD',N'Dólar estadounidense',N'$',@usuario);
      IF NOT EXISTS (SELECT 1 FROM CAJA.Caja WHERE Nombre=N'Caja de demostración')
        INSERT CAJA.Caja (IdSucursal,Nombre,CreadoPor) VALUES (@sucursal,N'Caja de demostración',@usuario);
      IF NOT EXISTS (SELECT 1 FROM ADMIN.TasaCambio)
        INSERT ADMIN.TasaCambio (Valor,Activa,CreadoPor) VALUES (37,1,@usuario);
    `);
    await tx.commit();
    return {login:'demo.admin',data:'fictional-only'};
  } catch(error) { try { await tx.rollback(); } catch {} throw error; }
}
module.exports = seed;
module.exports.seed = seed;
