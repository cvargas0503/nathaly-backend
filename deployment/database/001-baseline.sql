-- Schema-only baseline extracted from system catalogs. No business rows or existing accounts.

-- Apply to an EMPTY database. Connection selects its target; no USE or server-level statements.

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

IF SCHEMA_ID(N'ADMIN') IS NULL EXEC(N'CREATE SCHEMA [ADMIN]');
GO

IF SCHEMA_ID(N'AUDITORIA') IS NULL EXEC(N'CREATE SCHEMA [AUDITORIA]');
GO

IF SCHEMA_ID(N'CAJA') IS NULL EXEC(N'CREATE SCHEMA [CAJA]');
GO

IF SCHEMA_ID(N'CATALOGOS') IS NULL EXEC(N'CREATE SCHEMA [CATALOGOS]');
GO

IF SCHEMA_ID(N'COMPRAS') IS NULL EXEC(N'CREATE SCHEMA [COMPRAS]');
GO

IF SCHEMA_ID(N'CXC') IS NULL EXEC(N'CREATE SCHEMA [CXC]');
GO

IF SCHEMA_ID(N'GENERAL') IS NULL EXEC(N'CREATE SCHEMA [GENERAL]');
GO

IF SCHEMA_ID(N'INVENTARIO') IS NULL EXEC(N'CREATE SCHEMA [INVENTARIO]');
GO

IF SCHEMA_ID(N'REPORTES') IS NULL EXEC(N'CREATE SCHEMA [REPORTES]');
GO

IF SCHEMA_ID(N'RRHH') IS NULL EXEC(N'CREATE SCHEMA [RRHH]');
GO

IF SCHEMA_ID(N'SEGURIDAD') IS NULL EXEC(N'CREATE SCHEMA [SEGURIDAD]');
GO

IF SCHEMA_ID(N'VENTAS') IS NULL EXEC(N'CREATE SCHEMA [VENTAS]');
GO

CREATE TYPE [COMPRAS].[TipoCompraDetalle] AS TABLE (
  [IdProducto] int NULL,
  [Cantidad] decimal(18,2) NULL,
  [CostoUnit] decimal(18,4) NULL
);
GO

CREATE TYPE [INVENTARIO].[TipoTrasladoDetalle] AS TABLE (
  [IdProducto] int NULL,
  [Cantidad] decimal(18,2) NULL
);
GO

CREATE TYPE [VENTAS].[TipoVentaDetalle] AS TABLE (
  [IdProducto] int NULL,
  [Cantidad] decimal(18,2) NULL,
  [PrecioUnitario] decimal(18,4) NULL,
  [Descuento] decimal(18,4) NULL
);
GO

CREATE TABLE [ADMIN].[Auditoria] (
  [IdAuditoria] bigint IDENTITY(1,1) NOT NULL,
  [Entidad] nvarchar(50) NOT NULL,
  [Accion] nvarchar(20) NOT NULL,
  [EntidadId] bigint NULL,
  [Descripcion] nvarchar(500) NULL,
  [DatosAnterior] nvarchar(max) NULL,
  [DatosNuevo] nvarchar(max) NULL,
  [UsuarioId] int NOT NULL,
  [UsuarioLogin] nvarchar(50) NULL,
  [Fecha] datetime2(7) NULL CONSTRAINT [DF__Auditoria__Fecha__15C52FC4] DEFAULT (sysdatetime()),
  [IpAddress] nvarchar(45) NULL
);
GO

CREATE TABLE [ADMIN].[Consecutivos] (
  [Entidad] nvarchar(50) NOT NULL,
  [ValorActual] bigint NOT NULL
);
GO

CREATE TABLE [ADMIN].[Notificacion] (
  [IdNotificacion] bigint IDENTITY(1,1) NOT NULL,
  [Tipo] nvarchar(30) NOT NULL,
  [Titulo] nvarchar(150) NOT NULL,
  [Descripcion] nvarchar(500) NULL,
  [Entidad] nvarchar(50) NULL,
  [EntidadId] bigint NULL,
  [UsuarioId] int NULL,
  [Leida] bit NULL CONSTRAINT [DF__Notificac__Leida__18A19C6F] DEFAULT ((0)),
  [Fecha] datetime2(7) NULL CONSTRAINT [DF__Notificac__Fecha__1995C0A8] DEFAULT (sysdatetime())
);
GO

CREATE TABLE [ADMIN].[SolicitudFacturacion] (
  [IdUsuario] int NOT NULL,
  [Clave] uniqueidentifier NOT NULL,
  [IdVenta] bigint NOT NULL,
  [Huella] char(64) NOT NULL,
  [FechaCreacion] datetime2(7) NOT NULL CONSTRAINT [DF__Solicitud__Fecha__24134F1B] DEFAULT (sysutcdatetime())
);
GO

CREATE TABLE [ADMIN].[TasaCambio] (
  [IdTasa] int IDENTITY(1,1) NOT NULL,
  [Valor] decimal(18,4) NOT NULL,
  [FechaVigencia] datetime2(7) NULL CONSTRAINT [DF__TasaCambi__Fecha__11007AA7] DEFAULT (sysdatetime()),
  [Activa] bit NULL CONSTRAINT [DF__TasaCambi__Activ__11F49EE0] DEFAULT ((1)),
  [CreadoPor] int NOT NULL,
  [FechaCreacion] datetime2(7) NULL CONSTRAINT [DF__TasaCambi__Fecha__12E8C319] DEFAULT (sysdatetime())
);
GO

CREATE TABLE [AUDITORIA].[LogCambio] (
  [IdLog] bigint IDENTITY(1,1) NOT NULL,
  [Esquema] nvarchar(50) NOT NULL,
  [Tabla] nvarchar(100) NOT NULL,
  [IdRegistro] nvarchar(100) NOT NULL,
  [Operacion] nvarchar(10) NOT NULL,
  [Fecha] datetime2(7) NULL CONSTRAINT [DF__LogCambio__Fecha__668030F6] DEFAULT (sysdatetime()),
  [Usuario] int NULL,
  [IP] nvarchar(45) NULL,
  [ValoresAntes] nvarchar(max) NULL,
  [ValoresDespues] nvarchar(max) NULL
);
GO

CREATE TABLE [AUDITORIA].[OperacionCritica] (
  [IdOperacion] bigint IDENTITY(1,1) NOT NULL,
  [Modulo] nvarchar(50) NULL,
  [Operacion] nvarchar(100) NULL,
  [Parametros] nvarchar(max) NULL,
  [Fecha] datetime2(7) NULL CONSTRAINT [DF__Operacion__Fecha__6A50C1DA] DEFAULT (sysdatetime()),
  [Usuario] int NULL
);
GO

CREATE TABLE [CAJA].[AperturaCierreCaja] (
  [IdApertura] bigint IDENTITY(1,1) NOT NULL,
  [IdCaja] int NOT NULL,
  [IdEmpleado] int NOT NULL,
  [FechaApertura] datetime2(7) NULL CONSTRAINT [DF__AperturaC__Fecha__48EFCE0F] DEFAULT (sysdatetime()),
  [TasaCambio] decimal(18,4) NULL,
  [FechaCierre] datetime2(7) NULL,
  [IdEstadoCaja] smallint NOT NULL,
  [Observaciones] nvarchar(250) NULL,
  [Responsable] int NOT NULL,
  [Eliminado] bit NULL CONSTRAINT [DF__AperturaC__Elimi__4CC05EF3] DEFAULT ((0)),
  [CreadoPor] int NULL,
  [FechaCreacion] datetime2(7) NULL CONSTRAINT [DF__AperturaC__Fecha__4EA8A765] DEFAULT (sysdatetime()),
  [ModificadoPor] int NULL,
  [FechaModificacion] datetime2(7) NULL,
  [EliminadoPor] int NULL,
  [FechaEliminacion] datetime2(7) NULL,
  [IdSucursal] int NOT NULL
);
GO

CREATE TABLE [CAJA].[ArqueoAperturaDetalle] (
  [IdDetalle] bigint IDENTITY(1,1) NOT NULL,
  [IdApertura] bigint NOT NULL,
  [IdDenominacion] int NOT NULL,
  [Valor] decimal(18,4) NOT NULL,
  [Cantidad] int NOT NULL,
  [Total] AS ([Cantidad]*[Valor]) PERSISTED,
  [Eliminado] bit NULL CONSTRAINT [DF__ArqueoApe__Elimi__5555A4F4] DEFAULT ((0)),
  [CreadoPor] int NULL,
  [FechaCreacion] datetime2(7) NULL CONSTRAINT [DF__ArqueoApe__Fecha__573DED66] DEFAULT (sysdatetime()),
  [ModificadoPor] int NULL,
  [FechaModificacion] datetime2(7) NULL,
  [EliminadoPor] int NULL,
  [FechaEliminacion] datetime2(7) NULL
);
GO

CREATE TABLE [CAJA].[ArqueoCierreDetalle] (
  [IdDetalle] bigint IDENTITY(1,1) NOT NULL,
  [IdApertura] bigint NOT NULL,
  [IdDenominacion] int NOT NULL,
  [Valor] decimal(18,4) NOT NULL,
  [Cantidad] int NOT NULL,
  [Eliminado] bit NULL CONSTRAINT [DF__ArqueoCie__Elimi__5DEAEAF5] DEFAULT ((0)),
  [CreadoPor] int NULL,
  [FechaCreacion] datetime2(7) NULL CONSTRAINT [DF__ArqueoCie__Fecha__5FD33367] DEFAULT (sysdatetime()),
  [ModificadoPor] int NULL,
  [FechaModificacion] datetime2(7) NULL,
  [EliminadoPor] int NULL,
  [FechaEliminacion] datetime2(7) NULL,
  [Total] AS ([Cantidad]*[Valor]) PERSISTED
);
GO

CREATE TABLE [CAJA].[Caja] (
  [IdCaja] int IDENTITY(1,1) NOT NULL,
  [IdSucursal] int NOT NULL,
  [Nombre] nvarchar(50) NOT NULL,
  [CreadoPor] int NOT NULL,
  [FechaCreacion] datetime2(7) NULL CONSTRAINT [DF__Caja__FechaCreac__52AE4273] DEFAULT (sysdatetime()),
  [ModificadoPor] int NULL,
  [FechaModificacion] datetime2(7) NULL,
  [Eliminado] bit NULL CONSTRAINT [DF__Caja__Eliminado__54968AE5] DEFAULT ((0)),
  [EliminadoPor] int NULL,
  [FechaEliminacion] datetime2(7) NULL
);
GO

CREATE TABLE [CAJA].[Denominacion] (
  [IdDenominacion] int IDENTITY(1,1) NOT NULL,
  [CodigoMoneda] char(3) NOT NULL,
  [Valor] decimal(18,4) NOT NULL,
  [IdTipo] int NOT NULL,
  [Eliminado] bit NULL CONSTRAINT [DF__Denominac__Elimi__38B96646] DEFAULT ((0)),
  [CreadoPor] int NULL,
  [FechaCreacion] datetime2(7) NULL CONSTRAINT [DF__Denominac__Fecha__3AA1AEB8] DEFAULT (sysdatetime()),
  [ModificadoPor] int NULL,
  [FechaModificacion] datetime2(7) NULL,
  [EliminadoPor] int NULL,
  [FechaEliminacion] datetime2(7) NULL
);
GO

CREATE TABLE [CAJA].[Moneda] (
  [Codigo] char(3) NOT NULL,
  [Nombre] nvarchar(50) NOT NULL,
  [Simbolo] nvarchar(5) NULL,
  [Eliminado] bit NULL CONSTRAINT [DF__Moneda__Eliminad__2882FE7D] DEFAULT ((0)),
  [CreadoPor] int NULL,
  [FechaCreacion] datetime2(7) NULL CONSTRAINT [DF__Moneda__FechaCre__2A6B46EF] DEFAULT (sysdatetime()),
  [ModificadoPor] int NULL,
  [FechaModificacion] datetime2(7) NULL,
  [EliminadoPor] int NULL,
  [FechaEliminacion] datetime2(7) NULL
);
GO

CREATE TABLE [CAJA].[MovimientoCaja] (
  [IdMovimiento] bigint IDENTITY(1,1) NOT NULL,
  [IdCaja] int NOT NULL,
  [IdVenta] bigint NULL,
  [IdNotaCredito] bigint NULL,
  [EsIngreso] bit NOT NULL,
  [Concepto] nvarchar(150) NOT NULL,
  [Fecha] datetime2(7) NULL CONSTRAINT [DF__Movimient__Fecha__5C37ACAD] DEFAULT (sysdatetime()),
  [CreadoPor] int NOT NULL,
  [FechaCreacion] datetime2(7) NULL CONSTRAINT [DF__Movimient__Fecha__5E1FF51F] DEFAULT (sysdatetime()),
  [ModificadoPor] int NULL,
  [FechaModificacion] datetime2(7) NULL,
  [Eliminado] bit NULL CONSTRAINT [DF__Movimient__Elimi__60083D91] DEFAULT ((0)),
  [EliminadoPor] int NULL,
  [FechaEliminacion] datetime2(7) NULL,
  [IdAperturaCaja] bigint NOT NULL,
  [NumeroMovimiento] nvarchar(20) NULL
);
GO

CREATE TABLE [CAJA].[MovimientoCajaDetalle] (
  [IdMovimientoDetalle] bigint IDENTITY(1,1) NOT NULL,
  [IdMovimientoCaja] bigint NOT NULL,
  [IdFormaPago] smallint NOT NULL,
  [Monto] decimal(18,4) NOT NULL,
  [FechaRegistro] datetime2(7) NULL CONSTRAINT [DF__Movimient__Fecha__7FD5EEA5] DEFAULT (sysutcdatetime()),
  [CodigoMoneda] char(3) NOT NULL,
  [NumeroReferencia] nvarchar(15) NULL
);
GO

CREATE TABLE [CAJA].[TipoDenominacion] (
  [IdTipo] int IDENTITY(1,1) NOT NULL,
  [Nombre] nvarchar(20) NOT NULL,
  [Eliminado] bit NULL CONSTRAINT [DF__TipoDenom__Elimi__30242045] DEFAULT ((0)),
  [CreadoPor] int NULL,
  [FechaCreacion] datetime2(7) NULL CONSTRAINT [DF__TipoDenom__Fecha__320C68B7] DEFAULT (sysdatetime()),
  [ModificadoPor] int NULL,
  [FechaModificacion] datetime2(7) NULL,
  [EliminadoPor] int NULL,
  [FechaEliminacion] datetime2(7) NULL
);
GO

CREATE TABLE [CATALOGOS].[Categoria] (
  [IdCategoria] int IDENTITY(1,1) NOT NULL,
  [Nombre] nvarchar(50) NOT NULL,
  [Eliminado] bit NULL CONSTRAINT [DF__Categoria__Elimi__05F8DC4F] DEFAULT ((0)),
  [CreadoPor] int NULL,
  [FechaCreacion] datetime2(7) NULL CONSTRAINT [DF__Categoria__Fecha__07E124C1] DEFAULT (sysdatetime()),
  [EliminadoPor] int NULL,
  [FechaEliminacion] datetime2(7) NULL,
  [ModificadoPor] int NULL,
  [FechaModificacion] datetime2(7) NULL
);
GO

CREATE TABLE [CATALOGOS].[Ciudad] (
  [IdCiudad] int IDENTITY(1,1) NOT NULL,
  [IdPais] int NOT NULL,
  [Nombre] nvarchar(100) NOT NULL,
  [Activo] bit NULL CONSTRAINT [DF__Ciudad__Activo__5AEE82B9] DEFAULT ((1)),
  [Eliminado] bit NULL CONSTRAINT [DF__Ciudad__Eliminad__5BE2A6F2] DEFAULT ((0)),
  [FechaCreacion] datetime2(7) NULL CONSTRAINT [DF__Ciudad__FechaCre__5CD6CB2B] DEFAULT (sysdatetime()),
  [CreadoPor] int NULL,
  [ModificadoPor] int NULL,
  [FechaModificacion] datetime2(7) NULL,
  [EliminadoPor] int NULL,
  [FechaEliminacion] datetime2(7) NULL
);
GO

CREATE TABLE [CATALOGOS].[Cliente] (
  [IdCliente] int IDENTITY(1,1) NOT NULL,
  [IdPersona] int NOT NULL,
  [IdSucursal] int NOT NULL,
  [Codigo] varchar(20) NOT NULL,
  [TieneCredito] bit NULL CONSTRAINT [DF__Cliente__TieneCr__04E4BC85] DEFAULT ((0)),
  [LimiteCredito] decimal(18,2) NULL,
  [CreadoPor] int NOT NULL,
  [FechaCreacion] datetime2(7) NULL CONSTRAINT [DF__Cliente__FechaCr__05D8E0BE] DEFAULT (sysdatetime()),
  [ModificadoPor] int NULL,
  [FechaModificacion] datetime2(7) NULL,
  [Activo] bit NULL CONSTRAINT [DF__Cliente__Activo__06CD04F7] DEFAULT ((1)),
  [EliminadoPor] int NULL,
  [FechaEliminacion] datetime2(7) NULL,
  [Eliminado] bit NULL CONSTRAINT [DF__Cliente__Elimina__07C12930] DEFAULT ((0))
);
GO

CREATE TABLE [CATALOGOS].[Estado] (
  [IdEstado] smallint IDENTITY(1,1) NOT NULL,
  [Codigo] varchar(40) NOT NULL,
  [Descripcion] nvarchar(80) NOT NULL,
  [Eliminado] bit NULL CONSTRAINT [DF__Estado__Eliminad__634EBE90] DEFAULT ((0)),
  [CreadoPor] int NOT NULL,
  [FechaCreacion] datetime2(7) NULL CONSTRAINT [DF__Estado__FechaCre__65370702] DEFAULT (sysdatetime()),
  [ModificadoPor] int NULL,
  [FechaModificacion] datetime2(7) NULL,
  [EliminadoPor] int NULL,
  [FechaEliminacion] datetime2(7) NULL
);
GO

CREATE TABLE [CATALOGOS].[EstadoCaja] (
  [IdEstadoCaja] smallint IDENTITY(1,1) NOT NULL,
  [Codigo] varchar(15) NOT NULL,
  [Descripcion] nvarchar(80) NOT NULL,
  [Eliminado] bit NULL CONSTRAINT [DF__EstadoCaj__Elimi__405A880E] DEFAULT ((0)),
  [CreadoPor] int NOT NULL,
  [FechaCreacion] datetime2(7) NULL CONSTRAINT [DF__EstadoCaj__Fecha__4242D080] DEFAULT (sysdatetime()),
  [ModificadoPor] int NULL,
  [FechaModificacion] datetime2(7) NULL,
  [EliminadoPor] int NULL,
  [FechaEliminacion] datetime2(7) NULL
);
GO

CREATE TABLE [CATALOGOS].[EstadoCxc] (
  [IdEstadoCxc] smallint IDENTITY(1,1) NOT NULL,
  [Codigo] varchar(15) NOT NULL,
  [Descripcion] nvarchar(80) NOT NULL,
  [CreadoPor] int NOT NULL,
  [FechaCreacion] datetime2(7) NULL CONSTRAINT [DF__EstadoCxc__Fecha__3EDC53F0] DEFAULT (sysdatetime()),
  [ModificadoPor] int NULL,
  [FechaModificacion] datetime2(7) NULL,
  [Eliminado] bit NULL CONSTRAINT [DF__EstadoCxc__Elimi__40C49C62] DEFAULT ((0)),
  [EliminadoPor] int NULL,
  [FechaEliminacion] datetime2(7) NULL
);
GO

CREATE TABLE [CATALOGOS].[EstadoNota] (
  [IdEstadoNota] smallint IDENTITY(1,1) NOT NULL,
  [Codigo] varchar(15) NOT NULL,
  [Descripcion] nvarchar(80) NOT NULL,
  [CreadoPor] int NOT NULL,
  [FechaCreacion] datetime2(7) NULL CONSTRAINT [DF__EstadoNot__Fecha__725BF7F6] DEFAULT (sysdatetime()),
  [ModificadoPor] int NULL,
  [FechaModificacion] datetime2(7) NULL,
  [Eliminado] bit NULL CONSTRAINT [DF__EstadoNot__Elimi__74444068] DEFAULT ((0)),
  [EliminadoPor] int NULL,
  [FechaEliminacion] datetime2(7) NULL
);
GO

CREATE TABLE [CATALOGOS].[EstadoPedido] (
  [IdEstadoPedido] smallint IDENTITY(1,1) NOT NULL,
  [Codigo] varchar(15) NOT NULL,
  [Descripcion] nvarchar(80) NOT NULL,
  [CreadoPor] int NOT NULL,
  [FechaCreacion] datetime2(7) NULL CONSTRAINT [DF__EstadoPed__Fecha__467D75B8] DEFAULT (sysdatetime()),
  [ModificadoPor] int NULL,
  [FechaModificacion] datetime2(7) NULL,
  [Eliminado] bit NULL CONSTRAINT [DF__EstadoPed__Elimi__4865BE2A] DEFAULT ((0)),
  [EliminadoPor] int NULL,
  [FechaEliminacion] datetime2(7) NULL
);
GO

CREATE TABLE [CATALOGOS].[FormaPago] (
  [IdFormaPago] smallint IDENTITY(1,1) NOT NULL,
  [Codigo] varchar(20) NOT NULL,
  [Descripcion] nvarchar(80) NOT NULL,
  [Imagen] nvarchar(255) NULL,
  [Eliminado] bit NULL CONSTRAINT [DF__FormaPago__Elimi__6AEFE058] DEFAULT ((0)),
  [CreadoPor] int NOT NULL,
  [FechaCreacion] datetime2(7) NULL CONSTRAINT [DF__FormaPago__Fecha__6CD828CA] DEFAULT (sysdatetime()),
  [ModificadoPor] int NULL,
  [FechaModificacion] datetime2(7) NULL,
  [EliminadoPor] int NULL,
  [FechaEliminacion] datetime2(7) NULL
);
GO

CREATE TABLE [CATALOGOS].[Linea] (
  [IdLinea] int IDENTITY(1,1) NOT NULL,
  [Nombre] nvarchar(50) NOT NULL,
  [Eliminado] bit NULL CONSTRAINT [DF__Linea__Eliminado__162F4418] DEFAULT ((0)),
  [CreadoPor] int NULL,
  [FechaCreacion] datetime2(7) NULL CONSTRAINT [DF__Linea__FechaCrea__18178C8A] DEFAULT (sysdatetime()),
  [EliminadoPor] int NULL,
  [FechaEliminacion] datetime2(7) NULL,
  [ModificadoPor] int NULL,
  [FechaModificacion] datetime2(7) NULL
);
GO

CREATE TABLE [CATALOGOS].[Marca] (
  [IdMarca] int IDENTITY(1,1) NOT NULL,
  [Nombre] nvarchar(50) NOT NULL,
  [Eliminado] bit NULL CONSTRAINT [DF__Marca__Eliminado__0D99FE17] DEFAULT ((0)),
  [CreadoPor] int NULL,
  [FechaCreacion] datetime2(7) NULL CONSTRAINT [DF__Marca__FechaCrea__0F824689] DEFAULT (sysdatetime()),
  [EliminadoPor] int NULL,
  [FechaEliminacion] datetime2(7) NULL,
  [ModificadoPor] int NULL,
  [FechaModificacion] datetime2(7) NULL
);
GO

CREATE TABLE [CATALOGOS].[MotivoDevolucion] (
  [IdMotivo] smallint IDENTITY(1,1) NOT NULL,
  [Codigo] varchar(15) NOT NULL,
  [Descripcion] nvarchar(120) NOT NULL,
  [CreadoPor] int NOT NULL,
  [FechaCreacion] datetime2(7) NULL CONSTRAINT [DF__MotivoDev__Fecha__6ABAD62E] DEFAULT (sysdatetime()),
  [ModificadoPor] int NULL,
  [FechaModificacion] datetime2(7) NULL,
  [Eliminado] bit NULL CONSTRAINT [DF__MotivoDev__Elimi__6CA31EA0] DEFAULT ((0)),
  [EliminadoPor] int NULL,
  [FechaEliminacion] datetime2(7) NULL
);
GO

CREATE TABLE [CATALOGOS].[Pais] (
  [IdPais] int IDENTITY(1,1) NOT NULL,
  [Nombre] nvarchar(100) NOT NULL,
  [Activo] bit NULL CONSTRAINT [DF__Pais__Activo__5165187F] DEFAULT ((1)),
  [Eliminado] bit NULL CONSTRAINT [DF__Pais__Eliminado__52593CB8] DEFAULT ((0)),
  [FechaCreacion] datetime2(7) NULL CONSTRAINT [DF__Pais__FechaCreac__534D60F1] DEFAULT (sysdatetime()),
  [CreadoPor] int NULL,
  [ModificadoPor] int NULL,
  [FechaModificacion] datetime2(7) NULL,
  [EliminadoPor] int NULL,
  [FechaEliminacion] datetime2(7) NULL
);
GO

CREATE TABLE [CATALOGOS].[Proveedor] (
  [IdProveedor] int IDENTITY(1,1) NOT NULL,
  [RazonSocial] nvarchar(150) NOT NULL,
  [RUC] nvarchar(30) NOT NULL,
  [Direccion] nvarchar(250) NULL,
  [Telefono] varchar(20) NULL,
  [Email] nvarchar(100) NULL,
  [CreadoPor] int NOT NULL,
  [FechaCreacion] datetime2(7) NULL CONSTRAINT [DF__Proveedor__Fecha__65C116E7] DEFAULT (sysdatetime()),
  [ModificadoPor] int NULL,
  [FechaModificacion] datetime2(7) NULL,
  [Eliminado] bit NULL CONSTRAINT [DF__Proveedor__Elimi__67A95F59] DEFAULT ((0)),
  [EliminadoPor] int NULL,
  [FechaEliminacion] datetime2(7) NULL,
  [Nombre] nvarchar(100) NOT NULL
);
GO

CREATE TABLE [CATALOGOS].[Sucursal] (
  [IdSucursal] int IDENTITY(1,1) NOT NULL,
  [CodigoSucursal] nvarchar(15) NOT NULL,
  [Nombre] nvarchar(100) NOT NULL,
  [Direccion] nvarchar(250) NULL,
  [IdCiudad] int NULL,
  [Logo] nvarchar(250) NULL,
  [Activo] bit NULL CONSTRAINT [DF__Sucursal__Activo__6EF57B66] DEFAULT ((1)),
  [Eliminado] bit NULL CONSTRAINT [DF__Sucursal__Elimin__6FE99F9F] DEFAULT ((0)),
  [FechaCreacion] datetime2(7) NULL CONSTRAINT [DF__Sucursal__FechaC__70DDC3D8] DEFAULT (sysdatetime()),
  [CreadoPor] int NULL,
  [ModificadoPor] int NULL,
  [FechaModificacion] datetime2(7) NULL,
  [EliminadoPor] int NULL,
  [FechaEliminacion] datetime2(7) NULL
);
GO

CREATE TABLE [CATALOGOS].[SucursalTelefono] (
  [IdTelefono] int IDENTITY(1,1) NOT NULL,
  [IdSucursal] int NOT NULL,
  [Numero] varchar(20) NOT NULL,
  [Operadora] nvarchar(50) NULL,
  [CodigoOperadora] char(2) NULL,
  [EsPrincipal] bit NULL CONSTRAINT [DF__SucursalT__EsPri__778AC167] DEFAULT ((0)),
  [Comentario] nvarchar(100) NULL,
  [Activo] bit NULL CONSTRAINT [DF__SucursalT__Activ__787EE5A0] DEFAULT ((1)),
  [Eliminado] bit NULL CONSTRAINT [DF__SucursalT__Elimi__797309D9] DEFAULT ((0)),
  [FechaCreacion] datetime2(7) NULL CONSTRAINT [DF__SucursalT__Fecha__7A672E12] DEFAULT (sysdatetime()),
  [CreadoPor] int NULL,
  [ModificadoPor] int NULL,
  [FechaModificacion] datetime2(7) NULL,
  [EliminadoPor] int NULL,
  [FechaEliminacion] datetime2(7) NULL
);
GO

CREATE TABLE [CATALOGOS].[Termino] (
  [IdTermino] smallint IDENTITY(1,1) NOT NULL,
  [Codigo] varchar(15) NOT NULL,
  [DiasPlazo] smallint NOT NULL,
  [CreadoPor] int NOT NULL,
  [FechaCreacion] datetime2(7) NULL CONSTRAINT [DF__Termino__FechaCr__373B3228] DEFAULT (sysdatetime()),
  [ModificadoPor] int NULL,
  [FechaModificacion] datetime2(7) NULL,
  [Eliminado] bit NULL CONSTRAINT [DF__Termino__Elimina__39237A9A] DEFAULT ((0)),
  [EliminadoPor] int NULL,
  [FechaEliminacion] datetime2(7) NULL
);
GO

CREATE TABLE [CATALOGOS].[TipoMovimientoInventario] (
  [IdTipoMov] smallint IDENTITY(1,1) NOT NULL,
  [Descripcion] nvarchar(80) NOT NULL,
  [Signo] smallint NOT NULL,
  [Eliminado] bit NULL CONSTRAINT [DF__TipoMovim__Elimi__73852659] DEFAULT ((0)),
  [CreadoPor] int NOT NULL,
  [FechaCreacion] datetime2(7) NULL CONSTRAINT [DF__TipoMovim__Fecha__756D6ECB] DEFAULT (sysdatetime()),
  [ModificadoPor] int NULL,
  [FechaModificacion] datetime2(7) NULL,
  [EliminadoPor] int NULL,
  [FechaEliminacion] datetime2(7) NULL,
  [Nombre] nvarchar(80) NOT NULL
);
GO

CREATE TABLE [COMPRAS].[Compra] (
  [IdCompra] bigint IDENTITY(1,1) NOT NULL,
  [IdProveedor] int NOT NULL,
  [IdEmpleado] int NOT NULL,
  [IdBodega] int NOT NULL,
  [IdCiudad] int NOT NULL,
  [Numero] nvarchar(25) NOT NULL,
  [Fecha] datetime2(7) NULL CONSTRAINT [DF__Compra__Fecha__703EA55A] DEFAULT (sysdatetime()),
  [Subtotal] decimal(18,4) NOT NULL,
  [Descuento] decimal(18,4) NULL CONSTRAINT [DF__Compra__Descuent__7132C993] DEFAULT ((0)),
  [Impuestos] decimal(18,4) NULL CONSTRAINT [DF__Compra__Impuesto__7226EDCC] DEFAULT ((0)),
  [Total] AS (([Subtotal]-[Descuento])+[Impuestos]) PERSISTED,
  [CreadoPor] int NOT NULL,
  [FechaCreacion] datetime2(7) NULL CONSTRAINT [DF__Compra__FechaCre__740F363E] DEFAULT (sysdatetime()),
  [ModificadoPor] int NULL,
  [FechaModificacion] datetime2(7) NULL,
  [Eliminado] bit NULL CONSTRAINT [DF__Compra__Eliminad__75F77EB0] DEFAULT ((0)),
  [EliminadoPor] int NULL,
  [FechaEliminacion] datetime2(7) NULL
);
GO

CREATE TABLE [COMPRAS].[CompraDetalle] (
  [IdDetalle] bigint IDENTITY(1,1) NOT NULL,
  [IdCompra] bigint NOT NULL,
  [IdProducto] int NOT NULL,
  [Cantidad] decimal(18,2) NOT NULL,
  [CostoUnit] decimal(18,4) NOT NULL,
  [Subtotal] AS ([Cantidad]*[CostoUnit]) PERSISTED,
  [CreadoPor] int NOT NULL,
  [FechaCreacion] datetime2(7) NULL CONSTRAINT [DF__CompraDet__Fecha__7D98A078] DEFAULT (sysdatetime()),
  [ModificadoPor] int NULL,
  [FechaModificacion] datetime2(7) NULL,
  [Eliminado] bit NULL CONSTRAINT [DF__CompraDet__Elimi__7F80E8EA] DEFAULT ((0)),
  [EliminadoPor] int NULL,
  [FechaEliminacion] datetime2(7) NULL
);
GO

CREATE TABLE [CXC].[Documento] (
  [IdDocumentoCxc] bigint IDENTITY(1,1) NOT NULL,
  [IdVenta] bigint NOT NULL,
  [IdCliente] int NOT NULL,
  [FechaEmision] date NOT NULL,
  [FechaVenc] date NOT NULL,
  [MontoOriginal] decimal(18,4) NOT NULL,
  [SaldoActual] decimal(18,4) NOT NULL,
  [IdEstadoCxc] smallint NOT NULL,
  [Eliminado] bit NULL CONSTRAINT [DF__Documento__Elimi__1D4655FB] DEFAULT ((0)),
  [EliminadoPor] int NULL,
  [FechaEliminacion] datetime2(7) NULL CONSTRAINT [DF__Documento__Fecha__1F2E9E6D] DEFAULT (sysdatetime()),
  [CreadoPor] int NOT NULL,
  [FechaCreacion] datetime2(7) NULL CONSTRAINT [DF__Documento__Fecha__2116E6DF] DEFAULT (sysdatetime()),
  [ModificadoPor] int NULL,
  [FechaModificacion] datetime2(7) NULL
);
GO

CREATE TABLE [CXC].[Pago] (
  [IdPago] bigint IDENTITY(1,1) NOT NULL,
  [IdCliente] int NOT NULL,
  [NumeroRecibo] nvarchar(25) NOT NULL,
  [Observacion] nvarchar(250) NULL,
  [FechaPago] date NOT NULL,
  [IdFormaPago] smallint NOT NULL,
  [MontoTotal] decimal(18,4) NOT NULL,
  [CreadoPor] int NOT NULL,
  [FechaCreacion] datetime2(7) NULL CONSTRAINT [DF__Pago__FechaCreac__28B808A7] DEFAULT (sysdatetime()),
  [ModificadoPor] int NULL,
  [FechaModificacion] datetime2(7) NULL,
  [Eliminado] bit NULL CONSTRAINT [DF__Pago__Eliminado__2AA05119] DEFAULT ((0)),
  [EliminadoPor] int NULL,
  [FechaEliminacion] datetime2(7) NULL
);
GO

CREATE TABLE [CXC].[PagoDetalle] (
  [IdPagoDetalle] bigint IDENTITY(1,1) NOT NULL,
  [IdPago] bigint NOT NULL,
  [IdDocumentoCxc] bigint NOT NULL,
  [MontoAplicado] decimal(18,4) NOT NULL,
  [CreadoPor] int NOT NULL,
  [FechaCreacion] datetime2(7) NULL CONSTRAINT [DF__PagoDetal__Fecha__324172E1] DEFAULT (sysdatetime()),
  [ModificadoPor] int NULL,
  [FechaModificacion] datetime2(7) NULL,
  [Eliminado] bit NULL CONSTRAINT [DF__PagoDetal__Elimi__3429BB53] DEFAULT ((0)),
  [EliminadoPor] int NULL,
  [FechaEliminacion] datetime2(7) NULL
);
GO

CREATE TABLE [GENERAL].[Persona] (
  [IdPersona] int IDENTITY(1,1) NOT NULL,
  [Nombre1] nvarchar(10) NOT NULL,
  [Nombre2] nvarchar(10) NULL,
  [Apellido1] nvarchar(10) NOT NULL,
  [Apellido2] nvarchar(10) NULL,
  [Direccion] nvarchar(250) NULL,
  [Telefono] varchar(20) NULL,
  [Celular] varchar(20) NULL,
  [Email] nvarchar(50) NULL,
  [IdCiudad] int NOT NULL,
  [TipoDoc] char(3) NOT NULL,
  [NumDoc] nvarchar(30) NOT NULL,
  [CreadoPor] int NOT NULL,
  [FechaCreacion] datetime2(7) NULL CONSTRAINT [DF__Persona__FechaCr__656C112C] DEFAULT (sysdatetime()),
  [ModificadoPor] int NULL,
  [FechaModificacion] datetime2(7) NULL,
  [Activo] bit NULL CONSTRAINT [DF__Persona__Activo__66603565] DEFAULT ((1)),
  [EliminadoPor] int NULL,
  [FechaEliminacion] datetime2(7) NULL,
  [Eliminado] bit NULL CONSTRAINT [DF__Persona__Elimina__6754599E] DEFAULT ((0))
);
GO

CREATE TABLE [INVENTARIO].[Ajuste] (
  [IdAjuste] bigint IDENTITY(1,1) NOT NULL,
  [IdBodega] int NOT NULL,
  [Fecha] datetime2(7) NULL CONSTRAINT [DF__Ajuste__Fecha__1758727B] DEFAULT (sysdatetime()),
  [Observacion] nvarchar(250) NULL,
  [CreadoPor] int NOT NULL,
  [FechaCreacion] datetime2(7) NULL CONSTRAINT [DF__Ajuste__FechaCre__1940BAED] DEFAULT (sysdatetime()),
  [ModificadoPor] int NULL,
  [FechaModificacion] datetime2(7) NULL,
  [Eliminado] bit NULL CONSTRAINT [DF__Ajuste__Eliminad__1B29035F] DEFAULT ((0)),
  [EliminadoPor] int NULL,
  [FechaEliminacion] datetime2(7) NULL
);
GO

CREATE TABLE [INVENTARIO].[AjusteDetalle] (
  [IdDetalle] bigint IDENTITY(1,1) NOT NULL,
  [IdAjuste] bigint NOT NULL,
  [IdProducto] int NOT NULL,
  [Cantidad] decimal(18,2) NOT NULL,
  [CostoUnit] decimal(18,4) NOT NULL,
  [IdTipoMov] smallint NOT NULL,
  [CreadoPor] int NOT NULL,
  [FechaCreacion] datetime2(7) NULL CONSTRAINT [DF__AjusteDet__Fecha__22CA2527] DEFAULT (sysdatetime()),
  [ModificadoPor] int NULL,
  [FechaModificacion] datetime2(7) NULL,
  [Eliminado] bit NULL CONSTRAINT [DF__AjusteDet__Elimi__24B26D99] DEFAULT ((0)),
  [EliminadoPor] int NULL,
  [FechaEliminacion] datetime2(7) NULL
);
GO

CREATE TABLE [INVENTARIO].[Bodega] (
  [IdBodega] int IDENTITY(1,1) NOT NULL,
  [IdSucursal] int NOT NULL,
  [CodigoBodega] nvarchar(15) NOT NULL,
  [Nombre] nvarchar(100) NOT NULL,
  [Descripcion] nvarchar(250) NULL,
  [Activo] bit NULL CONSTRAINT [DF__Bodega__Activo__19DFD96B] DEFAULT ((1)),
  [Eliminado] bit NULL CONSTRAINT [DF__Bodega__Eliminad__1AD3FDA4] DEFAULT ((0)),
  [FechaCreacion] datetime2(7) NULL CONSTRAINT [DF__Bodega__FechaCre__1BC821DD] DEFAULT (sysdatetime()),
  [CreadoPor] int NULL,
  [ModificadoPor] int NULL,
  [FechaModificacion] datetime2(7) NULL,
  [EliminadoPor] int NULL,
  [FechaEliminacion] datetime2(7) NULL,
  [EsPrincipal] bit NULL CONSTRAINT [DF__Bodega__EsPrinci__420DC656] DEFAULT ((0))
);
GO

CREATE TABLE [INVENTARIO].[Existencia] (
  [IdBodega] int NOT NULL,
  [IdProducto] int NOT NULL,
  [Stock] decimal(18,2) NOT NULL CONSTRAINT [DF__Existenci__Stock__214BF109] DEFAULT ((0)),
  [Eliminado] bit NULL CONSTRAINT [DF__Existenci__Elimi__2334397B] DEFAULT ((0)),
  [CreadoPor] int NOT NULL,
  [FechaCreacion] datetime2(7) NULL CONSTRAINT [DF__Existenci__Fecha__251C81ED] DEFAULT (sysdatetime()),
  [ModificadoPor] int NULL,
  [FechaModificacion] datetime2(7) NULL,
  [EliminadoPor] int NULL,
  [FechaEliminacion] datetime2(7) NULL
);
GO

CREATE TABLE [INVENTARIO].[Kardex] (
  [IdKardex] bigint IDENTITY(1,1) NOT NULL,
  [IdBodega] int NOT NULL,
  [IdProducto] int NOT NULL,
  [IdTipoMov] smallint NOT NULL,
  [ReferenciaId] bigint NULL,
  [Fecha] datetime2(7) NOT NULL CONSTRAINT [DF__Kardex__Fecha__2CBDA3B5] DEFAULT (sysdatetime()),
  [Cantidad] decimal(18,2) NOT NULL,
  [CostoUnit] decimal(18,4) NOT NULL,
  [Observacion] nvarchar(250) NULL,
  [CreadoPor] int NOT NULL,
  [FechaCreacion] datetime2(7) NULL CONSTRAINT [DF__Kardex__FechaCre__2F9A1060] DEFAULT (sysdatetime()),
  [ModificadoPor] int NULL,
  [FechaModificacion] datetime2(7) NULL,
  [Eliminado] bit NULL CONSTRAINT [DF__Kardex__Eliminad__318258D2] DEFAULT ((0)),
  [EliminadoPor] int NULL,
  [FechaEliminacion] datetime2(7) NULL
);
GO

CREATE TABLE [INVENTARIO].[ListaPrecio] (
  [IdListaPrecio] smallint IDENTITY(1,1) NOT NULL,
  [Nombre] nvarchar(30) NOT NULL,
  [Descripcion] nvarchar(100) NULL,
  [Eliminado] bit NULL CONSTRAINT [DF__ListaPrec__Elimi__0E391C95] DEFAULT ((0)),
  [CreadoPor] int NOT NULL,
  [FechaCreacion] datetime2(7) NULL CONSTRAINT [DF__ListaPrec__Fecha__10216507] DEFAULT (sysdatetime()),
  [ModificadoPor] int NULL,
  [FechaModificacion] datetime2(7) NULL,
  [EliminadoPor] int NULL,
  [FechaEliminacion] datetime2(7) NULL
);
GO

CREATE TABLE [INVENTARIO].[Producto] (
  [IdProducto] int IDENTITY(1,1) NOT NULL,
  [Codigo] nvarchar(30) NOT NULL,
  [Descripcion] nvarchar(150) NOT NULL,
  [Costo] decimal(18,4) NOT NULL,
  [ExistenciaMin] decimal(18,2) NOT NULL CONSTRAINT [DF__Producto__Existe__7C1A6C5A] DEFAULT ((0)),
  [ExistenciaMax] decimal(18,2) NOT NULL CONSTRAINT [DF__Producto__Existe__7D0E9093] DEFAULT ((0)),
  [Eliminado] bit NULL CONSTRAINT [DF__Producto__Elimin__7E02B4CC] DEFAULT ((0)),
  [CreadoPor] int NOT NULL,
  [FechaCreacion] datetime2(7) NULL CONSTRAINT [DF__Producto__FechaC__7FEAFD3E] DEFAULT (sysdatetime()),
  [ModificadoPor] int NULL,
  [FechaModificacion] datetime2(7) NULL,
  [EliminadoPor] int NULL,
  [FechaEliminacion] datetime2(7) NULL,
  [IdLinea] int NOT NULL,
  [IdMarca] int NOT NULL,
  [IdCategoria] int NOT NULL,
  [IdProveedor] int NOT NULL,
  [Referencia] nvarchar(50) NOT NULL
);
GO

CREATE TABLE [INVENTARIO].[ProductoImagen] (
  [IdImagen] int IDENTITY(1,1) NOT NULL,
  [IdProducto] int NOT NULL,
  [UrlArchivo] nvarchar(300) NOT NULL,
  [Orden] tinyint NOT NULL CONSTRAINT [DF__ProductoI__Orden__05A3D694] DEFAULT ((1)),
  [Eliminado] bit NULL CONSTRAINT [DF__ProductoI__Elimi__0697FACD] DEFAULT ((0)),
  [CreadoPor] int NOT NULL,
  [FechaCreacion] datetime2(7) NULL CONSTRAINT [DF__ProductoI__Fecha__0880433F] DEFAULT (sysdatetime()),
  [ModificadoPor] int NULL,
  [FechaModificacion] datetime2(7) NULL,
  [EliminadoPor] int NULL,
  [FechaEliminacion] datetime2(7) NULL
);
GO

CREATE TABLE [INVENTARIO].[ProductoPrecio] (
  [IdPrecio] int IDENTITY(1,1) NOT NULL,
  [IdProducto] int NOT NULL,
  [Precio] decimal(18,4) NOT NULL,
  [FechaDesde] date NOT NULL,
  [FechaHasta] date NULL,
  [IdListaPrecio] smallint NOT NULL,
  [Eliminado] bit NULL CONSTRAINT [DF__ProductoP__Elimi__18B6AB08] DEFAULT ((0)),
  [CreadoPor] int NOT NULL,
  [FechaCreacion] datetime2(7) NULL CONSTRAINT [DF__ProductoP__Fecha__1A9EF37A] DEFAULT (sysdatetime()),
  [ModificadoPor] int NULL,
  [FechaModificacion] datetime2(7) NULL,
  [EliminadoPor] int NULL,
  [FechaEliminacion] datetime2(7) NULL
);
GO

CREATE TABLE [INVENTARIO].[Traslado] (
  [IdTraslado] bigint IDENTITY(1,1) NOT NULL,
  [IdBodegaOrigen] int NOT NULL,
  [IdBodegaDestino] int NOT NULL,
  [Fecha] datetime2(7) NULL CONSTRAINT [DF__Traslado__Fecha__0539C240] DEFAULT (sysdatetime()),
  [Observacion] nvarchar(250) NULL,
  [CreadoPor] int NOT NULL,
  [FechaCreacion] datetime2(7) NULL CONSTRAINT [DF__Traslado__FechaC__07220AB2] DEFAULT (sysdatetime()),
  [ModificadoPor] int NULL,
  [FechaModificacion] datetime2(7) NULL,
  [Eliminado] bit NULL CONSTRAINT [DF__Traslado__Elimin__090A5324] DEFAULT ((0)),
  [EliminadoPor] int NULL,
  [FechaEliminacion] datetime2(7) NULL,
  [NumeroTraslado] nvarchar(20) NOT NULL CONSTRAINT [DF__Traslado__Numero__42CCE065] DEFAULT ('N01-000000001')
);
GO

CREATE TABLE [INVENTARIO].[TrasladoDetalle] (
  [IdDetalle] bigint IDENTITY(1,1) NOT NULL,
  [IdTraslado] bigint NOT NULL,
  [IdProducto] int NOT NULL,
  [Cantidad] decimal(18,2) NOT NULL,
  [CreadoPor] int NOT NULL,
  [FechaCreacion] datetime2(7) NULL CONSTRAINT [DF__TrasladoD__Fecha__10AB74EC] DEFAULT (sysdatetime()),
  [ModificadoPor] int NULL,
  [FechaModificacion] datetime2(7) NULL,
  [Eliminado] bit NULL CONSTRAINT [DF__TrasladoD__Elimi__1293BD5E] DEFAULT ((0)),
  [EliminadoPor] int NULL,
  [FechaEliminacion] datetime2(7) NULL
);
GO

CREATE TABLE [RRHH].[Empleado] (
  [IdEmpleado] int IDENTITY(1,1) NOT NULL,
  [IdPersona] int NOT NULL,
  [IdSucursal] int NOT NULL,
  [Codigo] varchar(20) NOT NULL,
  [Puesto] nvarchar(80) NULL,
  [FechaIngreso] date NULL,
  [CreadoPor] int NOT NULL,
  [FechaCreacion] datetime2(7) NULL CONSTRAINT [DF__Empleado__FechaC__123EB7A3] DEFAULT (sysdatetime()),
  [ModificadoPor] int NULL,
  [FechaModificacion] datetime2(7) NULL,
  [EliminadoPor] int NULL,
  [FechaEliminacion] datetime2(7) NULL,
  [Activo] bit NULL CONSTRAINT [DF__Empleado__Activo__1332DBDC] DEFAULT ((1)),
  [Eliminado] bit NULL CONSTRAINT [DF__Empleado__Elimin__14270015] DEFAULT ((0))
);
GO

CREATE TABLE [SEGURIDAD].[Permiso] (
  [IdPermiso] int IDENTITY(1,1) NOT NULL,
  [Nombre] nvarchar(80) NOT NULL,
  [Descripcion] nvarchar(250) NULL,
  [Activo] bit NOT NULL CONSTRAINT [DF__Permiso__Activo__2BFE89A6] DEFAULT ((1)),
  [Eliminado] bit NOT NULL CONSTRAINT [DF__Permiso__Elimina__2CF2ADDF] DEFAULT ((0)),
  [CreadoPor] int NULL,
  [FechaCreacion] datetime2(7) NULL CONSTRAINT [DF__Permiso__FechaCr__2EDAF651] DEFAULT (sysdatetime()),
  [ModificadoPor] int NULL,
  [FechaModificacion] datetime2(7) NULL,
  [EliminadoPor] int NULL,
  [FechaEliminacion] datetime2(7) NULL,
  [Codigo] nvarchar(50) NOT NULL,
  [IdRol] int NOT NULL
);
GO

CREATE TABLE [SEGURIDAD].[Rol] (
  [IdRol] int IDENTITY(1,1) NOT NULL,
  [Nombre] nvarchar(80) NOT NULL,
  [Descripcion] nvarchar(250) NULL,
  [Activo] bit NOT NULL CONSTRAINT [DF__Rol__Activo__236943A5] DEFAULT ((1)),
  [Eliminado] bit NOT NULL CONSTRAINT [DF__Rol__Eliminado__245D67DE] DEFAULT ((0)),
  [CreadoPor] int NULL,
  [FechaCreacion] datetime2(7) NULL CONSTRAINT [DF__Rol__FechaCreaci__2645B050] DEFAULT (sysdatetime()),
  [ModificadoPor] int NULL,
  [FechaModificacion] datetime2(7) NULL,
  [EliminadoPor] int NULL,
  [FechaEliminacion] datetime2(7) NULL
);
GO

CREATE TABLE [SEGURIDAD].[RolPermiso] (
  [IdRol] int NOT NULL,
  [IdPermiso] int NOT NULL,
  [Activo] bit NOT NULL CONSTRAINT [DF__RolPermis__Activ__3587F3E0] DEFAULT ((1)),
  [Eliminado] bit NOT NULL CONSTRAINT [DF__RolPermis__Elimi__367C1819] DEFAULT ((0)),
  [CreadoPor] int NULL,
  [FechaCreacion] datetime2(7) NULL CONSTRAINT [DF__RolPermis__Fecha__3864608B] DEFAULT (sysdatetime()),
  [ModificadoPor] int NULL,
  [FechaModificacion] datetime2(7) NULL,
  [EliminadoPor] int NULL,
  [FechaEliminacion] datetime2(7) NULL
);
GO

CREATE TABLE [SEGURIDAD].[SesionRevocada] (
  [Huella] char(64) NOT NULL,
  [Expira] datetime2(7) NOT NULL,
  [FechaRevocacion] datetime2(7) NOT NULL CONSTRAINT [DF__SesionRev__Fecha__28D80438] DEFAULT (sysutcdatetime())
);
GO

CREATE TABLE [SEGURIDAD].[Usuario] (
  [IdUsuario] int IDENTITY(1,1) NOT NULL,
  [IdEmpleado] int NULL,
  [Login] varchar(50) NOT NULL,
  [PassHash] nvarchar(100) NOT NULL,
  [Activo] bit NULL CONSTRAINT [DF__Usuario__Activo__4AB81AF0] DEFAULT ((1)),
  [Eliminado] bit NULL CONSTRAINT [DF__Usuario__Elimina__4BAC3F29] DEFAULT ((0)),
  [FechaCreacion] datetime2(7) NULL CONSTRAINT [DF__Usuario__FechaCr__4CA06362] DEFAULT (sysdatetime()),
  [FechaModificacion] datetime2(7) NULL,
  [FechaEliminacion] datetime2(7) NULL,
  [CreadoPor] int NULL,
  [ModificadoPor] int NULL,
  [EliminadoPor] int NULL
);
GO

CREATE TABLE [SEGURIDAD].[UsuarioPermiso] (
  [IdUsuario] int NOT NULL,
  [IdPermiso] int NOT NULL,
  [Permitido] bit NOT NULL,
  [Activo] bit NOT NULL CONSTRAINT [DF__UsuarioPe__Activ__489AC854] DEFAULT ((1)),
  [Eliminado] bit NOT NULL CONSTRAINT [DF__UsuarioPe__Elimi__498EEC8D] DEFAULT ((0)),
  [CreadoPor] int NULL,
  [FechaCreacion] datetime2(7) NULL CONSTRAINT [DF__UsuarioPe__Fecha__4B7734FF] DEFAULT (sysdatetime()),
  [ModificadoPor] int NULL,
  [FechaModificacion] datetime2(7) NULL,
  [EliminadoPor] int NULL,
  [FechaEliminacion] datetime2(7) NULL
);
GO

CREATE TABLE [SEGURIDAD].[UsuarioRol] (
  [IdUsuario] int NOT NULL,
  [IdRol] int NOT NULL,
  [Activo] bit NOT NULL CONSTRAINT [DF__UsuarioRo__Activ__3F115E1A] DEFAULT ((1)),
  [Eliminado] bit NOT NULL CONSTRAINT [DF__UsuarioRo__Elimi__40058253] DEFAULT ((0)),
  [CreadoPor] int NULL,
  [FechaCreacion] datetime2(7) NULL CONSTRAINT [DF__UsuarioRo__Fecha__41EDCAC5] DEFAULT (sysdatetime()),
  [ModificadoPor] int NULL,
  [FechaModificacion] datetime2(7) NULL,
  [EliminadoPor] int NULL,
  [FechaEliminacion] datetime2(7) NULL
);
GO

CREATE TABLE [VENTAS].[Cambio] (
  [IdCambio] bigint IDENTITY(1,1) NOT NULL,
  [IdNotaCredito] bigint NOT NULL,
  [IdVentaNueva] bigint NOT NULL,
  [IdCliente] int NOT NULL,
  [IdEmpleado] int NOT NULL,
  [Diferencia] decimal(18,4) NOT NULL,
  [Fecha] datetime2(7) NULL CONSTRAINT [DF__Cambio__Fecha__11D4A34F] DEFAULT (sysdatetime()),
  [CreadoPor] int NOT NULL,
  [FechaCreacion] datetime2(7) NULL CONSTRAINT [DF__Cambio__FechaCre__13BCEBC1] DEFAULT (sysdatetime()),
  [ModificadoPor] int NULL,
  [FechaModificacion] datetime2(7) NULL,
  [Eliminado] bit NULL CONSTRAINT [DF__Cambio__Eliminad__15A53433] DEFAULT ((0)),
  [EliminadoPor] int NULL,
  [FechaEliminacion] datetime2(7) NULL
);
GO

CREATE TABLE [VENTAS].[NotaCredito] (
  [IdNotaCredito] bigint IDENTITY(1,1) NOT NULL,
  [NumeroNC] nvarchar(25) NOT NULL,
  [IdVenta] bigint NOT NULL,
  [Fecha] datetime2(7) NULL CONSTRAINT [DF__NotaCredi__Fecha__79FD19BE] DEFAULT (sysdatetime()),
  [IdEstadoNota] smallint NOT NULL CONSTRAINT [DF__NotaCredi__IdEst__7AF13DF7] DEFAULT ((1)),
  [Motivo] nvarchar(250) NULL,
  [Total] decimal(18,4) NOT NULL,
  [AprobadoPor] int NULL,
  [FechaAprobacion] datetime2(7) NULL,
  [CreadoPor] int NOT NULL,
  [FechaCreacion] datetime2(7) NULL CONSTRAINT [DF__NotaCredi__Fecha__7EC1CEDB] DEFAULT (sysdatetime()),
  [ModificadoPor] int NULL,
  [FechaModificacion] datetime2(7) NULL,
  [Eliminado] bit NULL CONSTRAINT [DF__NotaCredi__Elimi__00AA174D] DEFAULT ((0)),
  [EliminadoPor] int NULL,
  [FechaEliminacion] datetime2(7) NULL
);
GO

CREATE TABLE [VENTAS].[NotaCreditoDetalle] (
  [IdNotaDetalle] bigint IDENTITY(1,1) NOT NULL,
  [IdNotaCredito] bigint NOT NULL,
  [IdVentaDetalle] bigint NOT NULL,
  [Cantidad] decimal(18,2) NOT NULL,
  [Monto] decimal(18,4) NOT NULL,
  [IdMotivoDevol] smallint NOT NULL,
  [CreadoPor] int NOT NULL,
  [FechaCreacion] datetime2(7) NULL CONSTRAINT [DF__NotaCredi__Fecha__084B3915] DEFAULT (sysdatetime()),
  [ModificadoPor] int NULL,
  [FechaModificacion] datetime2(7) NULL,
  [Eliminado] bit NULL CONSTRAINT [DF__NotaCredi__Elimi__0A338187] DEFAULT ((0)),
  [EliminadoPor] int NULL,
  [FechaEliminacion] datetime2(7) NULL
);
GO

CREATE TABLE [VENTAS].[Pedido] (
  [IdPedido] bigint IDENTITY(1,1) NOT NULL,
  [IdCliente] int NOT NULL,
  [IdEmpleado] int NOT NULL,
  [FechaPedido] datetime2(7) NULL CONSTRAINT [DF__Pedido__FechaPed__3AD6B8E2] DEFAULT (sysdatetime()),
  [IdEstadoPedido] smallint NOT NULL,
  [Observaciones] nvarchar(250) NULL,
  [Subtotal] decimal(18,4) NOT NULL,
  [Descuento] decimal(18,4) NOT NULL CONSTRAINT [DF__Pedido__Descuent__3CBF0154] DEFAULT ((0)),
  [Impuestos] decimal(18,4) NOT NULL CONSTRAINT [DF__Pedido__Impuesto__3DB3258D] DEFAULT ((0)),
  [Total] AS (([Subtotal]-[Descuento])+[Impuestos]) PERSISTED,
  [CreadoPor] int NOT NULL,
  [FechaCreacion] datetime2(7) NULL CONSTRAINT [DF__Pedido__FechaCre__3F9B6DFF] DEFAULT (sysdatetime()),
  [ModificadoPor] int NULL,
  [FechaModificacion] datetime2(7) NULL,
  [Eliminado] bit NULL CONSTRAINT [DF__Pedido__Eliminad__4183B671] DEFAULT ((0)),
  [EliminadoPor] int NULL,
  [FechaEliminacion] datetime2(7) NULL,
  [IdTermino] smallint NOT NULL,
  [Observacion] nvarchar(50) NULL,
  [IdBodega] int NOT NULL,
  [NumeroPedido] nvarchar(20) NOT NULL
);
GO

CREATE TABLE [VENTAS].[PedidoDetalle] (
  [IdPedidoDetalle] bigint IDENTITY(1,1) NOT NULL,
  [IdPedido] bigint NOT NULL,
  [IdProducto] int NOT NULL,
  [Cantidad] decimal(18,2) NOT NULL,
  [PrecioUnitario] decimal(18,4) NOT NULL,
  [Descuento] decimal(18,4) NOT NULL CONSTRAINT [DF__PedidoDet__Descu__4830B400] DEFAULT ((0)),
  [Subtotal] AS ([Cantidad]*[PrecioUnitario]-[Descuento]) PERSISTED,
  [CreadoPor] int NOT NULL,
  [FechaCreacion] datetime2(7) NULL CONSTRAINT [DF__PedidoDet__Fecha__4A18FC72] DEFAULT (sysdatetime()),
  [ModificadoPor] int NULL,
  [FechaModificacion] datetime2(7) NULL,
  [Eliminado] bit NULL CONSTRAINT [DF__PedidoDet__Elimi__4C0144E4] DEFAULT ((0)),
  [EliminadoPor] int NULL,
  [FechaEliminacion] datetime2(7) NULL
);
GO

CREATE TABLE [VENTAS].[Venta] (
  [IdVenta] bigint IDENTITY(1,1) NOT NULL,
  [NumeroVenta] nvarchar(25) NOT NULL,
  [IdCliente] int NOT NULL,
  [IdEmpleado] int NOT NULL,
  [IdBodega] int NOT NULL,
  [IdEstado] smallint NOT NULL,
  [Fecha] datetime2(7) NOT NULL,
  [Subtotal] decimal(18,4) NOT NULL,
  [Descuento] decimal(18,4) NOT NULL CONSTRAINT [DF__Venta__Descuento__50FB042B] DEFAULT ((0)),
  [Impuestos] decimal(18,4) NOT NULL CONSTRAINT [DF__Venta__Impuestos__51EF2864] DEFAULT ((0)),
  [Total] AS (([Subtotal]-[Descuento])+[Impuestos]) PERSISTED,
  [IdTermino] smallint NOT NULL,
  [IdEstadoCxc] smallint NOT NULL CONSTRAINT [DF__Venta__IdEstadoC__53D770D6] DEFAULT ((1)),
  [CreadoPor] int NOT NULL,
  [FechaCreacion] datetime2(7) NULL CONSTRAINT [DF__Venta__FechaCrea__56B3DD81] DEFAULT (sysdatetime()),
  [ModificadoPor] int NULL,
  [FechaModificacion] datetime2(7) NULL,
  [Eliminado] bit NULL CONSTRAINT [DF__Venta__Eliminado__589C25F3] DEFAULT ((0)),
  [EliminadoPor] int NULL,
  [FechaEliminacion] datetime2(7) NULL,
  [IdPedidoOrigen] bigint NULL,
  [Observacion] nvarchar(50) NULL
);
GO

CREATE TABLE [VENTAS].[VentaDetalle] (
  [IdVentaDetalle] bigint IDENTITY(1,1) NOT NULL,
  [IdVenta] bigint NOT NULL,
  [IdProducto] int NOT NULL,
  [Cantidad] decimal(18,2) NOT NULL,
  [PrecioUnitario] decimal(18,4) NOT NULL,
  [Descuento] decimal(18,4) NOT NULL CONSTRAINT [DF__VentaDeta__Descu__603D47BB] DEFAULT ((0)),
  [Subtotal] AS ([Cantidad]*[PrecioUnitario]-[Descuento]) PERSISTED,
  [ModificadoPor] int NULL,
  [FechaModificacion] datetime2(7) NULL CONSTRAINT [DF__VentaDeta__Fecha__6225902D] DEFAULT (sysdatetime()),
  [Eliminado] bit NULL CONSTRAINT [DF__VentaDeta__Elimi__6319B466] DEFAULT ((0)),
  [EliminadoPor] int NULL,
  [FechaEliminacion] datetime2(7) NULL,
  [CreadoPor] int NOT NULL,
  [FechaCreacion] datetime2(7) NULL CONSTRAINT [DF__VentaDeta__Fecha__65F62111] DEFAULT (sysdatetime())
);
GO

ALTER TABLE [ADMIN].[Auditoria] ADD CONSTRAINT [PK__Auditori__7FD13FA0F7C9940A] PRIMARY KEY CLUSTERED ([IdAuditoria] ASC);
GO

ALTER TABLE [ADMIN].[Consecutivos] ADD CONSTRAINT [PK__Consecut__EB0C54CDEA7F6A20] PRIMARY KEY CLUSTERED ([Entidad] ASC);
GO

ALTER TABLE [ADMIN].[Notificacion] ADD CONSTRAINT [PK__Notifica__F6CA0A8565C424FF] PRIMARY KEY CLUSTERED ([IdNotificacion] ASC);
GO

ALTER TABLE [ADMIN].[SolicitudFacturacion] ADD CONSTRAINT [PK_SolicitudFacturacion] PRIMARY KEY CLUSTERED ([IdUsuario] ASC, [Clave] ASC);
GO

ALTER TABLE [ADMIN].[TasaCambio] ADD CONSTRAINT [PK__TasaCamb__9FCAD1CF7504BF8A] PRIMARY KEY CLUSTERED ([IdTasa] ASC);
GO

ALTER TABLE [AUDITORIA].[LogCambio] ADD CONSTRAINT [PK__LogCambi__0C54DBC65C2ECDDA] PRIMARY KEY CLUSTERED ([IdLog] ASC);
GO

ALTER TABLE [AUDITORIA].[OperacionCritica] ADD CONSTRAINT [PK__Operacio__7778456B1B800249] PRIMARY KEY CLUSTERED ([IdOperacion] ASC);
GO

ALTER TABLE [CAJA].[AperturaCierreCaja] ADD CONSTRAINT [PK__Apertura__11116E2EED6E5CE4] PRIMARY KEY CLUSTERED ([IdApertura] ASC);
GO

ALTER TABLE [CAJA].[ArqueoAperturaDetalle] ADD CONSTRAINT [PK__ArqueoAp__E43646A57E8078FA] PRIMARY KEY CLUSTERED ([IdDetalle] ASC);
GO

ALTER TABLE [CAJA].[ArqueoCierreDetalle] ADD CONSTRAINT [PK__ArqueoCi__E43646A5E46446B1] PRIMARY KEY CLUSTERED ([IdDetalle] ASC);
GO

ALTER TABLE [CAJA].[Caja] ADD CONSTRAINT [PK__Caja__3B7BF2C51DB72882] PRIMARY KEY CLUSTERED ([IdCaja] ASC);
GO

ALTER TABLE [CAJA].[Caja] ADD CONSTRAINT [UQ__Caja__75E3EFCFDC5BE199] UNIQUE NONCLUSTERED ([Nombre] ASC);
GO

ALTER TABLE [CAJA].[Denominacion] ADD CONSTRAINT [PK__Denomina__32C0B914E463DB52] PRIMARY KEY CLUSTERED ([IdDenominacion] ASC);
GO

ALTER TABLE [CAJA].[Moneda] ADD CONSTRAINT [PK__Moneda__06370DAD3055D74D] PRIMARY KEY CLUSTERED ([Codigo] ASC);
GO

ALTER TABLE [CAJA].[MovimientoCaja] ADD CONSTRAINT [PK__Movimien__881A6AE076F90590] PRIMARY KEY CLUSTERED ([IdMovimiento] ASC);
GO

ALTER TABLE [CAJA].[MovimientoCajaDetalle] ADD CONSTRAINT [PK__Movimien__917707028B184E7E] PRIMARY KEY CLUSTERED ([IdMovimientoDetalle] ASC);
GO

ALTER TABLE [CAJA].[TipoDenominacion] ADD CONSTRAINT [PK__TipoDeno__9E3A29A5EFCDE110] PRIMARY KEY CLUSTERED ([IdTipo] ASC);
GO

ALTER TABLE [CAJA].[TipoDenominacion] ADD CONSTRAINT [UQ__TipoDeno__75E3EFCFF2AEF292] UNIQUE NONCLUSTERED ([Nombre] ASC);
GO

ALTER TABLE [CATALOGOS].[Categoria] ADD CONSTRAINT [PK__Categori__A3C02A10F83C9F63] PRIMARY KEY CLUSTERED ([IdCategoria] ASC);
GO

ALTER TABLE [CATALOGOS].[Ciudad] ADD CONSTRAINT [PK__Ciudad__D4D3CCB0E97E4190] PRIMARY KEY CLUSTERED ([IdCiudad] ASC);
GO

ALTER TABLE [CATALOGOS].[Ciudad] ADD CONSTRAINT [UQ__Ciudad__0BDB3486324BF509] UNIQUE NONCLUSTERED ([IdPais] ASC, [Nombre] ASC);
GO

ALTER TABLE [CATALOGOS].[Cliente] ADD CONSTRAINT [PK__Cliente__D59466426C039801] PRIMARY KEY CLUSTERED ([IdCliente] ASC);
GO

ALTER TABLE [CATALOGOS].[Cliente] ADD CONSTRAINT [UQ__Cliente__06370DAC19619832] UNIQUE NONCLUSTERED ([Codigo] ASC);
GO

ALTER TABLE [CATALOGOS].[Cliente] ADD CONSTRAINT [UQ__Cliente__2EC8D2ADBC7EC750] UNIQUE NONCLUSTERED ([IdPersona] ASC);
GO

ALTER TABLE [CATALOGOS].[Estado] ADD CONSTRAINT [PK__Estado__FBB0EDC14DB6BECB] PRIMARY KEY CLUSTERED ([IdEstado] ASC);
GO

ALTER TABLE [CATALOGOS].[Estado] ADD CONSTRAINT [UQ__Estado__06370DAC16BDE299] UNIQUE NONCLUSTERED ([Codigo] ASC);
GO

ALTER TABLE [CATALOGOS].[EstadoCaja] ADD CONSTRAINT [PK__EstadoCa__D80D5A5D4865B61E] PRIMARY KEY CLUSTERED ([IdEstadoCaja] ASC);
GO

ALTER TABLE [CATALOGOS].[EstadoCaja] ADD CONSTRAINT [UQ__EstadoCa__06370DAC4414AED0] UNIQUE NONCLUSTERED ([Codigo] ASC);
GO

ALTER TABLE [CATALOGOS].[EstadoCxc] ADD CONSTRAINT [PK__EstadoCx__B847F5420D89B1C4] PRIMARY KEY CLUSTERED ([IdEstadoCxc] ASC);
GO

ALTER TABLE [CATALOGOS].[EstadoCxc] ADD CONSTRAINT [UQ__EstadoCx__06370DACF0A8BA3D] UNIQUE NONCLUSTERED ([Codigo] ASC);
GO

ALTER TABLE [CATALOGOS].[EstadoNota] ADD CONSTRAINT [PK__EstadoNo__41C71EE4D826D7E3] PRIMARY KEY CLUSTERED ([IdEstadoNota] ASC);
GO

ALTER TABLE [CATALOGOS].[EstadoNota] ADD CONSTRAINT [UQ__EstadoNo__06370DAC88175D2C] UNIQUE NONCLUSTERED ([Codigo] ASC);
GO

ALTER TABLE [CATALOGOS].[EstadoPedido] ADD CONSTRAINT [PK__EstadoPe__86B983713FC161A0] PRIMARY KEY CLUSTERED ([IdEstadoPedido] ASC);
GO

ALTER TABLE [CATALOGOS].[EstadoPedido] ADD CONSTRAINT [UQ__EstadoPe__06370DAC9477DFD9] UNIQUE NONCLUSTERED ([Codigo] ASC);
GO

ALTER TABLE [CATALOGOS].[FormaPago] ADD CONSTRAINT [PK__FormaPag__C777CA682E79C4B8] PRIMARY KEY CLUSTERED ([IdFormaPago] ASC);
GO

ALTER TABLE [CATALOGOS].[FormaPago] ADD CONSTRAINT [UQ__FormaPag__06370DAC7D67AEFE] UNIQUE NONCLUSTERED ([Codigo] ASC);
GO

ALTER TABLE [CATALOGOS].[Linea] ADD CONSTRAINT [PK__Linea__3D1A3EAE66C4A585] PRIMARY KEY CLUSTERED ([IdLinea] ASC);
GO

ALTER TABLE [CATALOGOS].[Linea] ADD CONSTRAINT [UQ_Linea_Nombre] UNIQUE NONCLUSTERED ([Nombre] ASC);
GO

ALTER TABLE [CATALOGOS].[Marca] ADD CONSTRAINT [PK__Marca__4076A88783FD7B07] PRIMARY KEY CLUSTERED ([IdMarca] ASC);
GO

ALTER TABLE [CATALOGOS].[Marca] ADD CONSTRAINT [UQ_Categoria_Nombre] UNIQUE NONCLUSTERED ([Nombre] ASC);
GO

ALTER TABLE [CATALOGOS].[MotivoDevolucion] ADD CONSTRAINT [PK__MotivoDe__69F27F3DC55560C6] PRIMARY KEY CLUSTERED ([IdMotivo] ASC);
GO

ALTER TABLE [CATALOGOS].[MotivoDevolucion] ADD CONSTRAINT [UQ__MotivoDe__06370DAC839C03F1] UNIQUE NONCLUSTERED ([Codigo] ASC);
GO

ALTER TABLE [CATALOGOS].[Pais] ADD CONSTRAINT [PK__Pais__FC850A7B1C57D956] PRIMARY KEY CLUSTERED ([IdPais] ASC);
GO

ALTER TABLE [CATALOGOS].[Pais] ADD CONSTRAINT [UQ__Pais__75E3EFCF0BC353FE] UNIQUE NONCLUSTERED ([Nombre] ASC);
GO

ALTER TABLE [CATALOGOS].[Proveedor] ADD CONSTRAINT [PK__Proveedo__E8B631AF75115FC6] PRIMARY KEY CLUSTERED ([IdProveedor] ASC);
GO

ALTER TABLE [CATALOGOS].[Proveedor] ADD CONSTRAINT [UQ__Proveedo__CAF3326B8ADA0C00] UNIQUE NONCLUSTERED ([RUC] ASC);
GO

ALTER TABLE [CATALOGOS].[Sucursal] ADD CONSTRAINT [PK__Sucursal__BFB6CD99FEBFC544] PRIMARY KEY CLUSTERED ([IdSucursal] ASC);
GO

ALTER TABLE [CATALOGOS].[Sucursal] ADD CONSTRAINT [UQ_Sucursal_Nombre] UNIQUE NONCLUSTERED ([IdSucursal] ASC, [Nombre] ASC);
GO

ALTER TABLE [CATALOGOS].[Sucursal] ADD CONSTRAINT [UQ_Sucursal_Codigo] UNIQUE NONCLUSTERED ([CodigoSucursal] ASC);
GO

ALTER TABLE [CATALOGOS].[SucursalTelefono] ADD CONSTRAINT [PK__Sucursal__9B8AC7533A66359E] PRIMARY KEY CLUSTERED ([IdTelefono] ASC);
GO

ALTER TABLE [CATALOGOS].[Termino] ADD CONSTRAINT [PK__Termino__4C003F3CA57DB17B] PRIMARY KEY CLUSTERED ([IdTermino] ASC);
GO

ALTER TABLE [CATALOGOS].[Termino] ADD CONSTRAINT [UQ__Termino__06370DAC1F916204] UNIQUE NONCLUSTERED ([Codigo] ASC);
GO

ALTER TABLE [CATALOGOS].[TipoMovimientoInventario] ADD CONSTRAINT [PK__TipoMovi__3D71C086BCD113CE] PRIMARY KEY CLUSTERED ([IdTipoMov] ASC);
GO

ALTER TABLE [COMPRAS].[Compra] ADD CONSTRAINT [PK__Compra__0A5CDB5C8AC2578A] PRIMARY KEY CLUSTERED ([IdCompra] ASC);
GO

ALTER TABLE [COMPRAS].[Compra] ADD CONSTRAINT [UQ__Compra__7E532BC690B70B0C] UNIQUE NONCLUSTERED ([Numero] ASC);
GO

ALTER TABLE [COMPRAS].[CompraDetalle] ADD CONSTRAINT [PK__CompraDe__E43646A521E754E3] PRIMARY KEY CLUSTERED ([IdDetalle] ASC);
GO

ALTER TABLE [CXC].[Documento] ADD CONSTRAINT [PK__Document__59D44C19736CF1D0] PRIMARY KEY CLUSTERED ([IdDocumentoCxc] ASC);
GO

ALTER TABLE [CXC].[Documento] ADD CONSTRAINT [UQ__Document__BC1240BC6C84DEF0] UNIQUE NONCLUSTERED ([IdVenta] ASC);
GO

ALTER TABLE [CXC].[Pago] ADD CONSTRAINT [PK__Pago__FC851A3A0AE530BF] PRIMARY KEY CLUSTERED ([IdPago] ASC);
GO

ALTER TABLE [CXC].[Pago] ADD CONSTRAINT [UQ__Pago__F83E3F29D66689EA] UNIQUE NONCLUSTERED ([NumeroRecibo] ASC);
GO

ALTER TABLE [CXC].[PagoDetalle] ADD CONSTRAINT [PK__PagoDeta__08F2D0D7F3D2983E] PRIMARY KEY CLUSTERED ([IdPagoDetalle] ASC);
GO

ALTER TABLE [GENERAL].[Persona] ADD CONSTRAINT [PK__Persona__2EC8D2AC24912229] PRIMARY KEY CLUSTERED ([IdPersona] ASC);
GO

ALTER TABLE [GENERAL].[Persona] ADD CONSTRAINT [UQ__Persona__F2CD115376532525] UNIQUE NONCLUSTERED ([TipoDoc] ASC, [NumDoc] ASC);
GO

ALTER TABLE [INVENTARIO].[Ajuste] ADD CONSTRAINT [PK__Ajuste__138C2758946A89ED] PRIMARY KEY CLUSTERED ([IdAjuste] ASC);
GO

ALTER TABLE [INVENTARIO].[AjusteDetalle] ADD CONSTRAINT [PK__AjusteDe__E43646A5BD8FB464] PRIMARY KEY CLUSTERED ([IdDetalle] ASC);
GO

ALTER TABLE [INVENTARIO].[Bodega] ADD CONSTRAINT [PK__Bodega__42B66742B0B0F3D5] PRIMARY KEY CLUSTERED ([IdBodega] ASC);
GO

ALTER TABLE [INVENTARIO].[Bodega] ADD CONSTRAINT [UQ_Bodega_Nombre] UNIQUE NONCLUSTERED ([IdBodega] ASC, [Nombre] ASC);
GO

ALTER TABLE [INVENTARIO].[Bodega] ADD CONSTRAINT [UQ__Bodega__9B96DC5FA49AF6F2] UNIQUE NONCLUSTERED ([CodigoBodega] ASC);
GO

CREATE UNIQUE NONCLUSTERED INDEX [UX_Bodega_Sucursal_Principal] ON [INVENTARIO].[Bodega] ([IdSucursal] ASC) WHERE ([EsPrincipal]=(1));
GO

ALTER TABLE [INVENTARIO].[Existencia] ADD CONSTRAINT [PK__Existenc__522EEE63B1158289] PRIMARY KEY CLUSTERED ([IdBodega] ASC, [IdProducto] ASC);
GO

ALTER TABLE [INVENTARIO].[Kardex] ADD CONSTRAINT [PK__Kardex__BC1BA400FE2D22B5] PRIMARY KEY CLUSTERED ([IdKardex] ASC);
GO

ALTER TABLE [INVENTARIO].[ListaPrecio] ADD CONSTRAINT [PK__ListaPre__422318681BBC0D74] PRIMARY KEY CLUSTERED ([IdListaPrecio] ASC);
GO

ALTER TABLE [INVENTARIO].[ListaPrecio] ADD CONSTRAINT [UQ__ListaPre__75E3EFCF234C04E7] UNIQUE NONCLUSTERED ([Nombre] ASC);
GO

ALTER TABLE [INVENTARIO].[Producto] ADD CONSTRAINT [PK__Producto__098892105E00D6D4] PRIMARY KEY CLUSTERED ([IdProducto] ASC);
GO

ALTER TABLE [INVENTARIO].[Producto] ADD CONSTRAINT [UQ__Producto__06370DACE827E9A9] UNIQUE NONCLUSTERED ([Codigo] ASC);
GO

ALTER TABLE [INVENTARIO].[ProductoImagen] ADD CONSTRAINT [PK__Producto__B42D8F2A802D1AE5] PRIMARY KEY CLUSTERED ([IdImagen] ASC);
GO

ALTER TABLE [INVENTARIO].[ProductoPrecio] ADD CONSTRAINT [PK__Producto__2450584B1427499B] PRIMARY KEY CLUSTERED ([IdPrecio] ASC);
GO

ALTER TABLE [INVENTARIO].[ProductoPrecio] ADD CONSTRAINT [UQ__Producto__76C8A9A0A586141E] UNIQUE NONCLUSTERED ([IdProducto] ASC, [IdListaPrecio] ASC, [FechaDesde] ASC);
GO

ALTER TABLE [INVENTARIO].[Traslado] ADD CONSTRAINT [PK__Traslado__9FEFD23C6DDF1FA0] PRIMARY KEY CLUSTERED ([IdTraslado] ASC);
GO

ALTER TABLE [INVENTARIO].[TrasladoDetalle] ADD CONSTRAINT [PK__Traslado__E43646A5C4974C61] PRIMARY KEY CLUSTERED ([IdDetalle] ASC);
GO

ALTER TABLE [RRHH].[Empleado] ADD CONSTRAINT [PK__Empleado__CE6D8B9E29969E62] PRIMARY KEY CLUSTERED ([IdEmpleado] ASC);
GO

ALTER TABLE [RRHH].[Empleado] ADD CONSTRAINT [UQ__Empleado__06370DACC2EBBB0D] UNIQUE NONCLUSTERED ([Codigo] ASC);
GO

ALTER TABLE [RRHH].[Empleado] ADD CONSTRAINT [UQ__Empleado__2EC8D2AD2CF645CD] UNIQUE NONCLUSTERED ([IdPersona] ASC);
GO

ALTER TABLE [SEGURIDAD].[Permiso] ADD CONSTRAINT [PK__Permiso__0D626EC8BAEDD7A9] PRIMARY KEY CLUSTERED ([IdPermiso] ASC);
GO

ALTER TABLE [SEGURIDAD].[Permiso] ADD CONSTRAINT [UQ__Permiso__75E3EFCF220970DD] UNIQUE NONCLUSTERED ([Nombre] ASC);
GO

ALTER TABLE [SEGURIDAD].[Permiso] ADD CONSTRAINT [UQ_Permiso_Codigo] UNIQUE NONCLUSTERED ([Codigo] ASC);
GO

ALTER TABLE [SEGURIDAD].[Rol] ADD CONSTRAINT [PK__Rol__2A49584CF0E852AA] PRIMARY KEY CLUSTERED ([IdRol] ASC);
GO

ALTER TABLE [SEGURIDAD].[Rol] ADD CONSTRAINT [UQ__Rol__75E3EFCFA0784E61] UNIQUE NONCLUSTERED ([Nombre] ASC);
GO

ALTER TABLE [SEGURIDAD].[RolPermiso] ADD CONSTRAINT [PK__RolPermi__BA9F7EA0A9AB71F5] PRIMARY KEY CLUSTERED ([IdRol] ASC, [IdPermiso] ASC);
GO

ALTER TABLE [SEGURIDAD].[SesionRevocada] ADD CONSTRAINT [PK_SesionRevocada] PRIMARY KEY CLUSTERED ([Huella] ASC);
GO

CREATE NONCLUSTERED INDEX [IX_SesionRevocada_Expira] ON [SEGURIDAD].[SesionRevocada] ([Expira] ASC);
GO

ALTER TABLE [SEGURIDAD].[Usuario] ADD CONSTRAINT [PK__Usuario__5B65BF97FC740DBC] PRIMARY KEY CLUSTERED ([IdUsuario] ASC);
GO

ALTER TABLE [SEGURIDAD].[Usuario] ADD CONSTRAINT [UQ__Usuario__5E55825B1864390C] UNIQUE NONCLUSTERED ([Login] ASC);
GO

ALTER TABLE [SEGURIDAD].[Usuario] ADD CONSTRAINT [UQ_Usuario_IdEmpleado] UNIQUE NONCLUSTERED ([IdEmpleado] ASC);
GO

ALTER TABLE [SEGURIDAD].[UsuarioPermiso] ADD CONSTRAINT [PK__UsuarioP__CBB3997B0E21370C] PRIMARY KEY CLUSTERED ([IdUsuario] ASC, [IdPermiso] ASC);
GO

ALTER TABLE [SEGURIDAD].[UsuarioRol] ADD CONSTRAINT [PK__UsuarioR__89C12A1388F7D5E9] PRIMARY KEY CLUSTERED ([IdUsuario] ASC, [IdRol] ASC);
GO

ALTER TABLE [VENTAS].[Cambio] ADD CONSTRAINT [PK__Cambio__B4BBA86E92BF411B] PRIMARY KEY CLUSTERED ([IdCambio] ASC);
GO

ALTER TABLE [VENTAS].[NotaCredito] ADD CONSTRAINT [PK__NotaCred__B2E9DEB753269518] PRIMARY KEY CLUSTERED ([IdNotaCredito] ASC);
GO

ALTER TABLE [VENTAS].[NotaCredito] ADD CONSTRAINT [UQ__NotaCred__C664FD485164566D] UNIQUE NONCLUSTERED ([NumeroNC] ASC);
GO

ALTER TABLE [VENTAS].[NotaCreditoDetalle] ADD CONSTRAINT [PK__NotaCred__1A67FFFE4EC76035] PRIMARY KEY CLUSTERED ([IdNotaDetalle] ASC);
GO

ALTER TABLE [VENTAS].[Pedido] ADD CONSTRAINT [PK__Pedido__9D335DC376E870C5] PRIMARY KEY CLUSTERED ([IdPedido] ASC);
GO

ALTER TABLE [VENTAS].[Pedido] ADD CONSTRAINT [UQ_Numero_Pedido] UNIQUE NONCLUSTERED ([NumeroPedido] ASC);
GO

ALTER TABLE [VENTAS].[PedidoDetalle] ADD CONSTRAINT [PK__PedidoDe__968E515BBD314E95] PRIMARY KEY CLUSTERED ([IdPedidoDetalle] ASC);
GO

ALTER TABLE [VENTAS].[Venta] ADD CONSTRAINT [PK__Venta__BC1240BD5832B65B] PRIMARY KEY CLUSTERED ([IdVenta] ASC);
GO

ALTER TABLE [VENTAS].[Venta] ADD CONSTRAINT [UQ__Venta__EBD2D7F1302D53CE] UNIQUE NONCLUSTERED ([NumeroVenta] ASC);
GO

ALTER TABLE [VENTAS].[VentaDetalle] ADD CONSTRAINT [PK__VentaDet__2787211D81A8C74F] PRIMARY KEY CLUSTERED ([IdVentaDetalle] ASC);
GO

ALTER TABLE [CATALOGOS].[Cliente] ADD CONSTRAINT [CK_Cliente_LimiteCredito] CHECK ([TieneCredito]=(1) AND [LimiteCredito] IS NOT NULL OR [TieneCredito]=(0) AND [LimiteCredito] IS NULL);
GO

ALTER TABLE [INVENTARIO].[TrasladoDetalle] ADD CONSTRAINT [CK__TrasladoD__Canti__0EC32C7A] CHECK ([Cantidad]>(0));
GO

ALTER TABLE [INVENTARIO].[ProductoPrecio] ADD CONSTRAINT [CK__ProductoP__Preci__16CE6296] CHECK ([Precio]>=(0));
GO

ALTER TABLE [INVENTARIO].[Existencia] ADD CONSTRAINT [CK__Existenci__Stock__22401542] CHECK ([Stock]>=(0));
GO

ALTER TABLE [INVENTARIO].[Kardex] ADD CONSTRAINT [CK__Kardex__CostoUni__2DB1C7EE] CHECK ([CostoUnit]>=(0));
GO

ALTER TABLE [CXC].[PagoDetalle] ADD CONSTRAINT [CK__PagoDetal__Monto__30592A6F] CHECK ([MontoAplicado]>(0));
GO

ALTER TABLE [VENTAS].[PedidoDetalle] ADD CONSTRAINT [CK__PedidoDet__Canti__473C8FC7] CHECK ([Cantidad]>(0));
GO

ALTER TABLE [VENTAS].[Venta] ADD CONSTRAINT [CK__Venta__5A846E65] CHECK ([Subtotal]>=(0) AND [Descuento]>=(0) AND [Impuestos]>=(0));
GO

ALTER TABLE [VENTAS].[VentaDetalle] ADD CONSTRAINT [CK__VentaDeta__Canti__5F492382] CHECK ([Cantidad]>(0));
GO

ALTER TABLE [GENERAL].[Persona] ADD CONSTRAINT [CK__Persona__TipoDoc__6477ECF3] CHECK ([TipoDoc]='RUC' OR [TipoDoc]='PAS' OR [TipoDoc]='CED');
GO

ALTER TABLE [AUDITORIA].[LogCambio] ADD CONSTRAINT [CK__LogCambio__Opera__658C0CBD] CHECK ([Operacion]='DELETE' OR [Operacion]='UPDATE' OR [Operacion]='INSERT');
GO

ALTER TABLE [CATALOGOS].[TipoMovimientoInventario] ADD CONSTRAINT [CK__TipoMovim__Signo__72910220] CHECK ([Signo]=(-1) OR [Signo]=(1));
GO

ALTER TABLE [INVENTARIO].[Producto] ADD CONSTRAINT [CK__Producto__Costo__7B264821] CHECK ([Costo]>=(0));
GO

ALTER TABLE [COMPRAS].[CompraDetalle] ADD CONSTRAINT [CK__CompraDet__Canti__7BB05806] CHECK ([Cantidad]>(0));
GO

ALTER TABLE [ADMIN].[SolicitudFacturacion] ADD CONSTRAINT [FK_SolicitudFacturacion_Usuario] FOREIGN KEY ([IdUsuario]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [ADMIN].[SolicitudFacturacion] ADD CONSTRAINT [FK_SolicitudFacturacion_Venta] FOREIGN KEY ([IdVenta]) REFERENCES [VENTAS].[Venta] ([IdVenta]);
GO

ALTER TABLE [AUDITORIA].[LogCambio] ADD CONSTRAINT [FK__LogCambio__Usuar__6774552F] FOREIGN KEY ([Usuario]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [AUDITORIA].[OperacionCritica] ADD CONSTRAINT [FK__Operacion__Usuar__6B44E613] FOREIGN KEY ([Usuario]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CAJA].[AperturaCierreCaja] ADD CONSTRAINT [FK__AperturaC__Cread__4DB4832C] FOREIGN KEY ([CreadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CAJA].[AperturaCierreCaja] ADD CONSTRAINT [FK__AperturaC__Elimi__5090EFD7] FOREIGN KEY ([EliminadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CAJA].[AperturaCierreCaja] ADD CONSTRAINT [FK__AperturaC__IdCaj__4707859D] FOREIGN KEY ([IdCaja]) REFERENCES [CAJA].[Caja] ([IdCaja]);
GO

ALTER TABLE [CAJA].[AperturaCierreCaja] ADD CONSTRAINT [FK__AperturaC__IdEmp__47FBA9D6] FOREIGN KEY ([IdEmpleado]) REFERENCES [RRHH].[Empleado] ([IdEmpleado]);
GO

ALTER TABLE [CAJA].[AperturaCierreCaja] ADD CONSTRAINT [FK__AperturaC__IdEst__4AD81681] FOREIGN KEY ([IdEstadoCaja]) REFERENCES [CATALOGOS].[EstadoCaja] ([IdEstadoCaja]);
GO

ALTER TABLE [CAJA].[AperturaCierreCaja] ADD CONSTRAINT [FK__AperturaC__IdSuc__68F2894D] FOREIGN KEY ([IdSucursal]) REFERENCES [CATALOGOS].[Sucursal] ([IdSucursal]);
GO

ALTER TABLE [CAJA].[AperturaCierreCaja] ADD CONSTRAINT [FK__AperturaC__Modif__4F9CCB9E] FOREIGN KEY ([ModificadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CAJA].[AperturaCierreCaja] ADD CONSTRAINT [FK__AperturaC__Respo__4BCC3ABA] FOREIGN KEY ([Responsable]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CAJA].[ArqueoAperturaDetalle] ADD CONSTRAINT [FK__ArqueoApe__Cread__5649C92D] FOREIGN KEY ([CreadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CAJA].[ArqueoAperturaDetalle] ADD CONSTRAINT [FK__ArqueoApe__Elimi__592635D8] FOREIGN KEY ([EliminadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CAJA].[ArqueoAperturaDetalle] ADD CONSTRAINT [FK__ArqueoApe__IdApe__536D5C82] FOREIGN KEY ([IdApertura]) REFERENCES [CAJA].[AperturaCierreCaja] ([IdApertura]);
GO

ALTER TABLE [CAJA].[ArqueoAperturaDetalle] ADD CONSTRAINT [FK__ArqueoApe__IdDen__546180BB] FOREIGN KEY ([IdDenominacion]) REFERENCES [CAJA].[Denominacion] ([IdDenominacion]);
GO

ALTER TABLE [CAJA].[ArqueoAperturaDetalle] ADD CONSTRAINT [FK__ArqueoApe__Modif__5832119F] FOREIGN KEY ([ModificadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CAJA].[ArqueoCierreDetalle] ADD CONSTRAINT [FK__ArqueoCie__Cread__5EDF0F2E] FOREIGN KEY ([CreadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CAJA].[ArqueoCierreDetalle] ADD CONSTRAINT [FK__ArqueoCie__Elimi__61BB7BD9] FOREIGN KEY ([EliminadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CAJA].[ArqueoCierreDetalle] ADD CONSTRAINT [FK__ArqueoCie__IdApe__5C02A283] FOREIGN KEY ([IdApertura]) REFERENCES [CAJA].[AperturaCierreCaja] ([IdApertura]);
GO

ALTER TABLE [CAJA].[ArqueoCierreDetalle] ADD CONSTRAINT [FK__ArqueoCie__IdDen__5CF6C6BC] FOREIGN KEY ([IdDenominacion]) REFERENCES [CAJA].[Denominacion] ([IdDenominacion]);
GO

ALTER TABLE [CAJA].[ArqueoCierreDetalle] ADD CONSTRAINT [FK__ArqueoCie__Modif__60C757A0] FOREIGN KEY ([ModificadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CAJA].[Caja] ADD CONSTRAINT [FK__Caja__CreadoPor__51BA1E3A] FOREIGN KEY ([CreadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CAJA].[Caja] ADD CONSTRAINT [FK__Caja__EliminadoP__558AAF1E] FOREIGN KEY ([EliminadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CAJA].[Caja] ADD CONSTRAINT [FK__Caja__IdSucursal__50C5FA01] FOREIGN KEY ([IdSucursal]) REFERENCES [CATALOGOS].[Sucursal] ([IdSucursal]);
GO

ALTER TABLE [CAJA].[Caja] ADD CONSTRAINT [FK__Caja__Modificado__53A266AC] FOREIGN KEY ([ModificadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CAJA].[Denominacion] ADD CONSTRAINT [FK__Denominac__Codig__36D11DD4] FOREIGN KEY ([CodigoMoneda]) REFERENCES [CAJA].[Moneda] ([Codigo]);
GO

ALTER TABLE [CAJA].[Denominacion] ADD CONSTRAINT [FK__Denominac__Cread__39AD8A7F] FOREIGN KEY ([CreadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CAJA].[Denominacion] ADD CONSTRAINT [FK__Denominac__Elimi__3C89F72A] FOREIGN KEY ([EliminadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CAJA].[Denominacion] ADD CONSTRAINT [FK__Denominac__IdTip__37C5420D] FOREIGN KEY ([IdTipo]) REFERENCES [CAJA].[TipoDenominacion] ([IdTipo]);
GO

ALTER TABLE [CAJA].[Denominacion] ADD CONSTRAINT [FK__Denominac__Modif__3B95D2F1] FOREIGN KEY ([ModificadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CAJA].[Moneda] ADD CONSTRAINT [FK__Moneda__CreadoPo__297722B6] FOREIGN KEY ([CreadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CAJA].[Moneda] ADD CONSTRAINT [FK__Moneda__Eliminad__2C538F61] FOREIGN KEY ([EliminadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CAJA].[Moneda] ADD CONSTRAINT [FK__Moneda__Modifica__2B5F6B28] FOREIGN KEY ([ModificadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CAJA].[MovimientoCaja] ADD CONSTRAINT [FK__Movimient__Cread__5D2BD0E6] FOREIGN KEY ([CreadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CAJA].[MovimientoCaja] ADD CONSTRAINT [FK__Movimient__Elimi__60FC61CA] FOREIGN KEY ([EliminadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CAJA].[MovimientoCaja] ADD CONSTRAINT [FK__Movimient__IdApe__049AA3C2] FOREIGN KEY ([IdAperturaCaja]) REFERENCES [CAJA].[AperturaCierreCaja] ([IdApertura]);
GO

ALTER TABLE [CAJA].[MovimientoCaja] ADD CONSTRAINT [FK__Movimient__IdCaj__58671BC9] FOREIGN KEY ([IdCaja]) REFERENCES [CAJA].[Caja] ([IdCaja]);
GO

ALTER TABLE [CAJA].[MovimientoCaja] ADD CONSTRAINT [FK__Movimient__IdNot__5A4F643B] FOREIGN KEY ([IdNotaCredito]) REFERENCES [VENTAS].[NotaCredito] ([IdNotaCredito]);
GO

ALTER TABLE [CAJA].[MovimientoCaja] ADD CONSTRAINT [FK__Movimient__IdVen__595B4002] FOREIGN KEY ([IdVenta]) REFERENCES [VENTAS].[Venta] ([IdVenta]);
GO

ALTER TABLE [CAJA].[MovimientoCaja] ADD CONSTRAINT [FK__Movimient__Modif__5F141958] FOREIGN KEY ([ModificadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CAJA].[MovimientoCajaDetalle] ADD CONSTRAINT [FK__Movimient__Codig__01BE3717] FOREIGN KEY ([CodigoMoneda]) REFERENCES [CAJA].[Moneda] ([Codigo]);
GO

ALTER TABLE [CAJA].[MovimientoCajaDetalle] ADD CONSTRAINT [FK__Movimient__IdFor__7EE1CA6C] FOREIGN KEY ([IdFormaPago]) REFERENCES [CATALOGOS].[FormaPago] ([IdFormaPago]);
GO

ALTER TABLE [CAJA].[MovimientoCajaDetalle] ADD CONSTRAINT [FK__Movimient__IdMov__7DEDA633] FOREIGN KEY ([IdMovimientoCaja]) REFERENCES [CAJA].[MovimientoCaja] ([IdMovimiento]);
GO

ALTER TABLE [CAJA].[TipoDenominacion] ADD CONSTRAINT [FK__TipoDenom__Cread__3118447E] FOREIGN KEY ([CreadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CAJA].[TipoDenominacion] ADD CONSTRAINT [FK__TipoDenom__Elimi__33F4B129] FOREIGN KEY ([EliminadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CAJA].[TipoDenominacion] ADD CONSTRAINT [FK__TipoDenom__Modif__33008CF0] FOREIGN KEY ([ModificadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CATALOGOS].[Categoria] ADD CONSTRAINT [FK__Categoria__Cread__06ED0088] FOREIGN KEY ([CreadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CATALOGOS].[Categoria] ADD CONSTRAINT [FK__Categoria__Elimi__08D548FA] FOREIGN KEY ([EliminadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CATALOGOS].[Categoria] ADD CONSTRAINT [FK__Categoria__Modif__09C96D33] FOREIGN KEY ([ModificadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CATALOGOS].[Ciudad] ADD CONSTRAINT [FK__Ciudad__CreadoPo__5DCAEF64] FOREIGN KEY ([CreadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CATALOGOS].[Ciudad] ADD CONSTRAINT [FK__Ciudad__Eliminad__5FB337D6] FOREIGN KEY ([EliminadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CATALOGOS].[Ciudad] ADD CONSTRAINT [FK__Ciudad__IdPais__59FA5E80] FOREIGN KEY ([IdPais]) REFERENCES [CATALOGOS].[Pais] ([IdPais]) ON DELETE CASCADE;
GO

ALTER TABLE [CATALOGOS].[Ciudad] ADD CONSTRAINT [FK__Ciudad__Modifica__5EBF139D] FOREIGN KEY ([ModificadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CATALOGOS].[Cliente] ADD CONSTRAINT [FK__Cliente__IdPerso__02FC7413] FOREIGN KEY ([IdPersona]) REFERENCES [GENERAL].[Persona] ([IdPersona]) ON DELETE CASCADE;
GO

ALTER TABLE [CATALOGOS].[Cliente] ADD CONSTRAINT [FK__Cliente__IdSucur__03F0984C] FOREIGN KEY ([IdSucursal]) REFERENCES [CATALOGOS].[Sucursal] ([IdSucursal]) ON DELETE CASCADE;
GO

ALTER TABLE [CATALOGOS].[Cliente] ADD CONSTRAINT [FK_CATA_Cliente_CreadoPor] FOREIGN KEY ([CreadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CATALOGOS].[Cliente] ADD CONSTRAINT [FK_CATA_Cliente_EliminadoPor] FOREIGN KEY ([EliminadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CATALOGOS].[Cliente] ADD CONSTRAINT [FK_CATA_Cliente_ModificadoPor] FOREIGN KEY ([ModificadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CATALOGOS].[Estado] ADD CONSTRAINT [FK__Estado__CreadoPo__6442E2C9] FOREIGN KEY ([CreadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CATALOGOS].[Estado] ADD CONSTRAINT [FK__Estado__Eliminad__671F4F74] FOREIGN KEY ([EliminadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CATALOGOS].[Estado] ADD CONSTRAINT [FK__Estado__Modifica__662B2B3B] FOREIGN KEY ([ModificadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CATALOGOS].[EstadoCaja] ADD CONSTRAINT [FK__EstadoCaj__Cread__414EAC47] FOREIGN KEY ([CreadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CATALOGOS].[EstadoCaja] ADD CONSTRAINT [FK__EstadoCaj__Elimi__442B18F2] FOREIGN KEY ([EliminadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CATALOGOS].[EstadoCaja] ADD CONSTRAINT [FK__EstadoCaj__Modif__4336F4B9] FOREIGN KEY ([ModificadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CATALOGOS].[EstadoCxc] ADD CONSTRAINT [FK__EstadoCxc__Cread__3DE82FB7] FOREIGN KEY ([CreadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CATALOGOS].[EstadoCxc] ADD CONSTRAINT [FK__EstadoCxc__Elimi__41B8C09B] FOREIGN KEY ([EliminadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CATALOGOS].[EstadoCxc] ADD CONSTRAINT [FK__EstadoCxc__Modif__3FD07829] FOREIGN KEY ([ModificadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CATALOGOS].[EstadoNota] ADD CONSTRAINT [FK__EstadoNot__Cread__7167D3BD] FOREIGN KEY ([CreadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CATALOGOS].[EstadoNota] ADD CONSTRAINT [FK__EstadoNot__Elimi__753864A1] FOREIGN KEY ([EliminadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CATALOGOS].[EstadoNota] ADD CONSTRAINT [FK__EstadoNot__Modif__73501C2F] FOREIGN KEY ([ModificadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CATALOGOS].[EstadoPedido] ADD CONSTRAINT [FK__EstadoPed__Cread__4589517F] FOREIGN KEY ([CreadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CATALOGOS].[EstadoPedido] ADD CONSTRAINT [FK__EstadoPed__Elimi__4959E263] FOREIGN KEY ([EliminadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CATALOGOS].[EstadoPedido] ADD CONSTRAINT [FK__EstadoPed__Modif__477199F1] FOREIGN KEY ([ModificadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CATALOGOS].[FormaPago] ADD CONSTRAINT [FK__FormaPago__Cread__6BE40491] FOREIGN KEY ([CreadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CATALOGOS].[FormaPago] ADD CONSTRAINT [FK__FormaPago__Elimi__6EC0713C] FOREIGN KEY ([EliminadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CATALOGOS].[FormaPago] ADD CONSTRAINT [FK__FormaPago__Modif__6DCC4D03] FOREIGN KEY ([ModificadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CATALOGOS].[Linea] ADD CONSTRAINT [FK__Linea__CreadoPor__17236851] FOREIGN KEY ([CreadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CATALOGOS].[Linea] ADD CONSTRAINT [FK__Linea__Eliminado__190BB0C3] FOREIGN KEY ([EliminadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CATALOGOS].[Linea] ADD CONSTRAINT [FK__Linea__Modificad__19FFD4FC] FOREIGN KEY ([ModificadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CATALOGOS].[Marca] ADD CONSTRAINT [FK__Marca__CreadoPor__0E8E2250] FOREIGN KEY ([CreadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CATALOGOS].[Marca] ADD CONSTRAINT [FK__Marca__Eliminado__10766AC2] FOREIGN KEY ([EliminadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CATALOGOS].[Marca] ADD CONSTRAINT [FK__Marca__Modificad__116A8EFB] FOREIGN KEY ([ModificadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CATALOGOS].[MotivoDevolucion] ADD CONSTRAINT [FK__MotivoDev__Cread__69C6B1F5] FOREIGN KEY ([CreadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CATALOGOS].[MotivoDevolucion] ADD CONSTRAINT [FK__MotivoDev__Elimi__6D9742D9] FOREIGN KEY ([EliminadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CATALOGOS].[MotivoDevolucion] ADD CONSTRAINT [FK__MotivoDev__Modif__6BAEFA67] FOREIGN KEY ([ModificadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CATALOGOS].[Pais] ADD CONSTRAINT [FK__Pais__CreadoPor__5441852A] FOREIGN KEY ([CreadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CATALOGOS].[Pais] ADD CONSTRAINT [FK__Pais__EliminadoP__5629CD9C] FOREIGN KEY ([EliminadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CATALOGOS].[Pais] ADD CONSTRAINT [FK__Pais__Modificado__5535A963] FOREIGN KEY ([ModificadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CATALOGOS].[Proveedor] ADD CONSTRAINT [FK__Proveedor__Cread__64CCF2AE] FOREIGN KEY ([CreadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CATALOGOS].[Proveedor] ADD CONSTRAINT [FK__Proveedor__Elimi__689D8392] FOREIGN KEY ([EliminadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CATALOGOS].[Proveedor] ADD CONSTRAINT [FK__Proveedor__Modif__66B53B20] FOREIGN KEY ([ModificadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CATALOGOS].[Sucursal] ADD CONSTRAINT [FK__Sucursal__Creado__71D1E811] FOREIGN KEY ([CreadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CATALOGOS].[Sucursal] ADD CONSTRAINT [FK__Sucursal__Elimin__73BA3083] FOREIGN KEY ([EliminadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CATALOGOS].[Sucursal] ADD CONSTRAINT [FK__Sucursal__IdCiud__6E01572D] FOREIGN KEY ([IdCiudad]) REFERENCES [CATALOGOS].[Ciudad] ([IdCiudad]);
GO

ALTER TABLE [CATALOGOS].[Sucursal] ADD CONSTRAINT [FK__Sucursal__Modifi__72C60C4A] FOREIGN KEY ([ModificadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CATALOGOS].[SucursalTelefono] ADD CONSTRAINT [FK__SucursalT__Cread__7B5B524B] FOREIGN KEY ([CreadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CATALOGOS].[SucursalTelefono] ADD CONSTRAINT [FK__SucursalT__Elimi__7D439ABD] FOREIGN KEY ([EliminadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CATALOGOS].[SucursalTelefono] ADD CONSTRAINT [FK__SucursalT__IdSuc__76969D2E] FOREIGN KEY ([IdSucursal]) REFERENCES [CATALOGOS].[Sucursal] ([IdSucursal]) ON DELETE CASCADE;
GO

ALTER TABLE [CATALOGOS].[SucursalTelefono] ADD CONSTRAINT [FK__SucursalT__Modif__7C4F7684] FOREIGN KEY ([ModificadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CATALOGOS].[Termino] ADD CONSTRAINT [FK__Termino__CreadoP__36470DEF] FOREIGN KEY ([CreadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CATALOGOS].[Termino] ADD CONSTRAINT [FK__Termino__Elimina__3A179ED3] FOREIGN KEY ([EliminadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CATALOGOS].[Termino] ADD CONSTRAINT [FK__Termino__Modific__382F5661] FOREIGN KEY ([ModificadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CATALOGOS].[TipoMovimientoInventario] ADD CONSTRAINT [FK__TipoMovim__Cread__74794A92] FOREIGN KEY ([CreadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CATALOGOS].[TipoMovimientoInventario] ADD CONSTRAINT [FK__TipoMovim__Elimi__7755B73D] FOREIGN KEY ([EliminadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CATALOGOS].[TipoMovimientoInventario] ADD CONSTRAINT [FK__TipoMovim__Modif__76619304] FOREIGN KEY ([ModificadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [COMPRAS].[Compra] ADD CONSTRAINT [FK__Compra__CreadoPo__731B1205] FOREIGN KEY ([CreadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [COMPRAS].[Compra] ADD CONSTRAINT [FK__Compra__Eliminad__76EBA2E9] FOREIGN KEY ([EliminadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [COMPRAS].[Compra] ADD CONSTRAINT [FK__Compra__IdBodega__6E565CE8] FOREIGN KEY ([IdBodega]) REFERENCES [INVENTARIO].[Bodega] ([IdBodega]);
GO

ALTER TABLE [COMPRAS].[Compra] ADD CONSTRAINT [FK__Compra__IdCiudad__6F4A8121] FOREIGN KEY ([IdCiudad]) REFERENCES [CATALOGOS].[Ciudad] ([IdCiudad]);
GO

ALTER TABLE [COMPRAS].[Compra] ADD CONSTRAINT [FK__Compra__IdEmplea__6D6238AF] FOREIGN KEY ([IdEmpleado]) REFERENCES [RRHH].[Empleado] ([IdEmpleado]);
GO

ALTER TABLE [COMPRAS].[Compra] ADD CONSTRAINT [FK__Compra__IdProvee__6C6E1476] FOREIGN KEY ([IdProveedor]) REFERENCES [CATALOGOS].[Proveedor] ([IdProveedor]);
GO

ALTER TABLE [COMPRAS].[Compra] ADD CONSTRAINT [FK__Compra__Modifica__75035A77] FOREIGN KEY ([ModificadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [COMPRAS].[CompraDetalle] ADD CONSTRAINT [FK__CompraDet__Cread__7CA47C3F] FOREIGN KEY ([CreadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [COMPRAS].[CompraDetalle] ADD CONSTRAINT [FK__CompraDet__Elimi__00750D23] FOREIGN KEY ([EliminadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [COMPRAS].[CompraDetalle] ADD CONSTRAINT [FK__CompraDet__IdCom__79C80F94] FOREIGN KEY ([IdCompra]) REFERENCES [COMPRAS].[Compra] ([IdCompra]) ON DELETE CASCADE;
GO

ALTER TABLE [COMPRAS].[CompraDetalle] ADD CONSTRAINT [FK__CompraDet__IdPro__7ABC33CD] FOREIGN KEY ([IdProducto]) REFERENCES [INVENTARIO].[Producto] ([IdProducto]);
GO

ALTER TABLE [COMPRAS].[CompraDetalle] ADD CONSTRAINT [FK__CompraDet__Modif__7E8CC4B1] FOREIGN KEY ([ModificadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CXC].[Documento] ADD CONSTRAINT [FK__Documento__Cread__2022C2A6] FOREIGN KEY ([CreadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CXC].[Documento] ADD CONSTRAINT [FK__Documento__Elimi__1E3A7A34] FOREIGN KEY ([EliminadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CXC].[Documento] ADD CONSTRAINT [FK__Documento__IdCli__1B5E0D89] FOREIGN KEY ([IdCliente]) REFERENCES [CATALOGOS].[Cliente] ([IdCliente]);
GO

ALTER TABLE [CXC].[Documento] ADD CONSTRAINT [FK__Documento__IdEst__1C5231C2] FOREIGN KEY ([IdEstadoCxc]) REFERENCES [CATALOGOS].[EstadoCxc] ([IdEstadoCxc]);
GO

ALTER TABLE [CXC].[Documento] ADD CONSTRAINT [FK__Documento__IdVen__1A69E950] FOREIGN KEY ([IdVenta]) REFERENCES [VENTAS].[Venta] ([IdVenta]) ON DELETE CASCADE;
GO

ALTER TABLE [CXC].[Documento] ADD CONSTRAINT [FK__Documento__Modif__220B0B18] FOREIGN KEY ([ModificadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CXC].[Pago] ADD CONSTRAINT [FK__Pago__CreadoPor__27C3E46E] FOREIGN KEY ([CreadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CXC].[Pago] ADD CONSTRAINT [FK__Pago__EliminadoP__2B947552] FOREIGN KEY ([EliminadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CXC].[Pago] ADD CONSTRAINT [FK__Pago__IdCliente__25DB9BFC] FOREIGN KEY ([IdCliente]) REFERENCES [CATALOGOS].[Cliente] ([IdCliente]);
GO

ALTER TABLE [CXC].[Pago] ADD CONSTRAINT [FK__Pago__IdFormaPag__26CFC035] FOREIGN KEY ([IdFormaPago]) REFERENCES [CATALOGOS].[FormaPago] ([IdFormaPago]);
GO

ALTER TABLE [CXC].[Pago] ADD CONSTRAINT [FK__Pago__Modificado__29AC2CE0] FOREIGN KEY ([ModificadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CXC].[PagoDetalle] ADD CONSTRAINT [FK__PagoDetal__Cread__314D4EA8] FOREIGN KEY ([CreadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CXC].[PagoDetalle] ADD CONSTRAINT [FK__PagoDetal__Elimi__351DDF8C] FOREIGN KEY ([EliminadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [CXC].[PagoDetalle] ADD CONSTRAINT [FK__PagoDetal__IdDoc__2F650636] FOREIGN KEY ([IdDocumentoCxc]) REFERENCES [CXC].[Documento] ([IdDocumentoCxc]);
GO

ALTER TABLE [CXC].[PagoDetalle] ADD CONSTRAINT [FK__PagoDetal__IdPag__2E70E1FD] FOREIGN KEY ([IdPago]) REFERENCES [CXC].[Pago] ([IdPago]) ON DELETE CASCADE;
GO

ALTER TABLE [CXC].[PagoDetalle] ADD CONSTRAINT [FK__PagoDetal__Modif__3335971A] FOREIGN KEY ([ModificadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [GENERAL].[Persona] ADD CONSTRAINT [FK__Persona__IdCiuda__6383C8BA] FOREIGN KEY ([IdCiudad]) REFERENCES [CATALOGOS].[Ciudad] ([IdCiudad]) ON DELETE CASCADE;
GO

ALTER TABLE [GENERAL].[Persona] ADD CONSTRAINT [FK_GeneralPersona_CreadoPor] FOREIGN KEY ([CreadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [GENERAL].[Persona] ADD CONSTRAINT [FK_GeneralPersona_EliminadoPor] FOREIGN KEY ([EliminadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [GENERAL].[Persona] ADD CONSTRAINT [FK_GeneralPersona_ModificadoPor] FOREIGN KEY ([ModificadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [INVENTARIO].[Ajuste] ADD CONSTRAINT [FK__Ajuste__CreadoPo__184C96B4] FOREIGN KEY ([CreadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [INVENTARIO].[Ajuste] ADD CONSTRAINT [FK__Ajuste__Eliminad__1C1D2798] FOREIGN KEY ([EliminadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [INVENTARIO].[Ajuste] ADD CONSTRAINT [FK__Ajuste__IdBodega__16644E42] FOREIGN KEY ([IdBodega]) REFERENCES [INVENTARIO].[Bodega] ([IdBodega]);
GO

ALTER TABLE [INVENTARIO].[Ajuste] ADD CONSTRAINT [FK__Ajuste__Modifica__1A34DF26] FOREIGN KEY ([ModificadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [INVENTARIO].[AjusteDetalle] ADD CONSTRAINT [FK__AjusteDet__Cread__21D600EE] FOREIGN KEY ([CreadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [INVENTARIO].[AjusteDetalle] ADD CONSTRAINT [FK__AjusteDet__Elimi__25A691D2] FOREIGN KEY ([EliminadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [INVENTARIO].[AjusteDetalle] ADD CONSTRAINT [FK__AjusteDet__IdAju__1EF99443] FOREIGN KEY ([IdAjuste]) REFERENCES [INVENTARIO].[Ajuste] ([IdAjuste]) ON DELETE CASCADE;
GO

ALTER TABLE [INVENTARIO].[AjusteDetalle] ADD CONSTRAINT [FK__AjusteDet__IdPro__1FEDB87C] FOREIGN KEY ([IdProducto]) REFERENCES [INVENTARIO].[Producto] ([IdProducto]);
GO

ALTER TABLE [INVENTARIO].[AjusteDetalle] ADD CONSTRAINT [FK__AjusteDet__IdTip__20E1DCB5] FOREIGN KEY ([IdTipoMov]) REFERENCES [CATALOGOS].[TipoMovimientoInventario] ([IdTipoMov]);
GO

ALTER TABLE [INVENTARIO].[AjusteDetalle] ADD CONSTRAINT [FK__AjusteDet__Modif__23BE4960] FOREIGN KEY ([ModificadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [INVENTARIO].[Bodega] ADD CONSTRAINT [FK__Bodega__CreadoPo__1CBC4616] FOREIGN KEY ([CreadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [INVENTARIO].[Bodega] ADD CONSTRAINT [FK__Bodega__Eliminad__1EA48E88] FOREIGN KEY ([EliminadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [INVENTARIO].[Bodega] ADD CONSTRAINT [FK__Bodega__IdSucurs__18EBB532] FOREIGN KEY ([IdSucursal]) REFERENCES [CATALOGOS].[Sucursal] ([IdSucursal]) ON DELETE CASCADE;
GO

ALTER TABLE [INVENTARIO].[Bodega] ADD CONSTRAINT [FK__Bodega__Modifica__1DB06A4F] FOREIGN KEY ([ModificadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [INVENTARIO].[Existencia] ADD CONSTRAINT [FK__Existenci__Cread__24285DB4] FOREIGN KEY ([CreadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [INVENTARIO].[Existencia] ADD CONSTRAINT [FK__Existenci__Elimi__2704CA5F] FOREIGN KEY ([EliminadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [INVENTARIO].[Existencia] ADD CONSTRAINT [FK__Existenci__IdBod__1F63A897] FOREIGN KEY ([IdBodega]) REFERENCES [INVENTARIO].[Bodega] ([IdBodega]) ON DELETE CASCADE;
GO

ALTER TABLE [INVENTARIO].[Existencia] ADD CONSTRAINT [FK__Existenci__IdPro__2057CCD0] FOREIGN KEY ([IdProducto]) REFERENCES [INVENTARIO].[Producto] ([IdProducto]) ON DELETE CASCADE;
GO

ALTER TABLE [INVENTARIO].[Existencia] ADD CONSTRAINT [FK__Existenci__Modif__2610A626] FOREIGN KEY ([ModificadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [INVENTARIO].[Kardex] ADD CONSTRAINT [FK__Kardex__CreadoPo__2EA5EC27] FOREIGN KEY ([CreadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [INVENTARIO].[Kardex] ADD CONSTRAINT [FK__Kardex__Eliminad__32767D0B] FOREIGN KEY ([EliminadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [INVENTARIO].[Kardex] ADD CONSTRAINT [FK__Kardex__IdBodega__29E1370A] FOREIGN KEY ([IdBodega]) REFERENCES [INVENTARIO].[Bodega] ([IdBodega]);
GO

ALTER TABLE [INVENTARIO].[Kardex] ADD CONSTRAINT [FK__Kardex__IdProduc__2AD55B43] FOREIGN KEY ([IdProducto]) REFERENCES [INVENTARIO].[Producto] ([IdProducto]);
GO

ALTER TABLE [INVENTARIO].[Kardex] ADD CONSTRAINT [FK__Kardex__IdTipoMo__2BC97F7C] FOREIGN KEY ([IdTipoMov]) REFERENCES [CATALOGOS].[TipoMovimientoInventario] ([IdTipoMov]);
GO

ALTER TABLE [INVENTARIO].[Kardex] ADD CONSTRAINT [FK__Kardex__Modifica__308E3499] FOREIGN KEY ([ModificadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [INVENTARIO].[ListaPrecio] ADD CONSTRAINT [FK__ListaPrec__Cread__0F2D40CE] FOREIGN KEY ([CreadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [INVENTARIO].[ListaPrecio] ADD CONSTRAINT [FK__ListaPrec__Elimi__1209AD79] FOREIGN KEY ([EliminadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [INVENTARIO].[ListaPrecio] ADD CONSTRAINT [FK__ListaPrec__Modif__11158940] FOREIGN KEY ([ModificadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [INVENTARIO].[Producto] ADD CONSTRAINT [FK__Producto__Creado__7EF6D905] FOREIGN KEY ([CreadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [INVENTARIO].[Producto] ADD CONSTRAINT [FK__Producto__Elimin__01D345B0] FOREIGN KEY ([EliminadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [INVENTARIO].[Producto] ADD CONSTRAINT [FK__Producto__IdCate__1CDC41A7] FOREIGN KEY ([IdCategoria]) REFERENCES [CATALOGOS].[Categoria] ([IdCategoria]);
GO

ALTER TABLE [INVENTARIO].[Producto] ADD CONSTRAINT [FK__Producto__IdLine__1AF3F935] FOREIGN KEY ([IdLinea]) REFERENCES [CATALOGOS].[Linea] ([IdLinea]);
GO

ALTER TABLE [INVENTARIO].[Producto] ADD CONSTRAINT [FK__Producto__IdMarc__1BE81D6E] FOREIGN KEY ([IdMarca]) REFERENCES [CATALOGOS].[Marca] ([IdMarca]);
GO

ALTER TABLE [INVENTARIO].[Producto] ADD CONSTRAINT [FK__Producto__IdProv__1DD065E0] FOREIGN KEY ([IdProveedor]) REFERENCES [CATALOGOS].[Proveedor] ([IdProveedor]);
GO

ALTER TABLE [INVENTARIO].[Producto] ADD CONSTRAINT [FK__Producto__Modifi__00DF2177] FOREIGN KEY ([ModificadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [INVENTARIO].[ProductoImagen] ADD CONSTRAINT [FK__ProductoI__Cread__078C1F06] FOREIGN KEY ([CreadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [INVENTARIO].[ProductoImagen] ADD CONSTRAINT [FK__ProductoI__Elimi__0A688BB1] FOREIGN KEY ([EliminadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [INVENTARIO].[ProductoImagen] ADD CONSTRAINT [FK__ProductoI__IdPro__04AFB25B] FOREIGN KEY ([IdProducto]) REFERENCES [INVENTARIO].[Producto] ([IdProducto]) ON DELETE CASCADE;
GO

ALTER TABLE [INVENTARIO].[ProductoImagen] ADD CONSTRAINT [FK__ProductoI__Modif__09746778] FOREIGN KEY ([ModificadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [INVENTARIO].[ProductoPrecio] ADD CONSTRAINT [FK__ProductoP__Cread__19AACF41] FOREIGN KEY ([CreadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [INVENTARIO].[ProductoPrecio] ADD CONSTRAINT [FK__ProductoP__Elimi__1C873BEC] FOREIGN KEY ([EliminadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [INVENTARIO].[ProductoPrecio] ADD CONSTRAINT [FK__ProductoP__IdLis__17C286CF] FOREIGN KEY ([IdListaPrecio]) REFERENCES [INVENTARIO].[ListaPrecio] ([IdListaPrecio]);
GO

ALTER TABLE [INVENTARIO].[ProductoPrecio] ADD CONSTRAINT [FK__ProductoP__IdPro__15DA3E5D] FOREIGN KEY ([IdProducto]) REFERENCES [INVENTARIO].[Producto] ([IdProducto]) ON DELETE CASCADE;
GO

ALTER TABLE [INVENTARIO].[ProductoPrecio] ADD CONSTRAINT [FK__ProductoP__Modif__1B9317B3] FOREIGN KEY ([ModificadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [INVENTARIO].[Traslado] ADD CONSTRAINT [FK__Traslado__Creado__062DE679] FOREIGN KEY ([CreadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [INVENTARIO].[Traslado] ADD CONSTRAINT [FK__Traslado__Elimin__09FE775D] FOREIGN KEY ([EliminadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [INVENTARIO].[Traslado] ADD CONSTRAINT [FK__Traslado__IdBode__035179CE] FOREIGN KEY ([IdBodegaOrigen]) REFERENCES [INVENTARIO].[Bodega] ([IdBodega]);
GO

ALTER TABLE [INVENTARIO].[Traslado] ADD CONSTRAINT [FK__Traslado__IdBode__04459E07] FOREIGN KEY ([IdBodegaDestino]) REFERENCES [INVENTARIO].[Bodega] ([IdBodega]);
GO

ALTER TABLE [INVENTARIO].[Traslado] ADD CONSTRAINT [FK__Traslado__Modifi__08162EEB] FOREIGN KEY ([ModificadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [INVENTARIO].[TrasladoDetalle] ADD CONSTRAINT [FK__TrasladoD__Cread__0FB750B3] FOREIGN KEY ([CreadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [INVENTARIO].[TrasladoDetalle] ADD CONSTRAINT [FK__TrasladoD__Elimi__1387E197] FOREIGN KEY ([EliminadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [INVENTARIO].[TrasladoDetalle] ADD CONSTRAINT [FK__TrasladoD__IdPro__0DCF0841] FOREIGN KEY ([IdProducto]) REFERENCES [INVENTARIO].[Producto] ([IdProducto]);
GO

ALTER TABLE [INVENTARIO].[TrasladoDetalle] ADD CONSTRAINT [FK__TrasladoD__IdTra__0CDAE408] FOREIGN KEY ([IdTraslado]) REFERENCES [INVENTARIO].[Traslado] ([IdTraslado]) ON DELETE CASCADE;
GO

ALTER TABLE [INVENTARIO].[TrasladoDetalle] ADD CONSTRAINT [FK__TrasladoD__Modif__119F9925] FOREIGN KEY ([ModificadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [RRHH].[Empleado] ADD CONSTRAINT [FK__Empleado__IdPers__10566F31] FOREIGN KEY ([IdPersona]) REFERENCES [GENERAL].[Persona] ([IdPersona]) ON DELETE CASCADE;
GO

ALTER TABLE [RRHH].[Empleado] ADD CONSTRAINT [FK__Empleado__IdSucu__114A936A] FOREIGN KEY ([IdSucursal]) REFERENCES [CATALOGOS].[Sucursal] ([IdSucursal]) ON DELETE CASCADE;
GO

ALTER TABLE [SEGURIDAD].[Permiso] ADD CONSTRAINT [FK__Permiso__CreadoP__2DE6D218] FOREIGN KEY ([CreadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [SEGURIDAD].[Permiso] ADD CONSTRAINT [FK__Permiso__Elimina__30C33EC3] FOREIGN KEY ([EliminadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [SEGURIDAD].[Permiso] ADD CONSTRAINT [FK__Permiso__IdRol__56D3D912] FOREIGN KEY ([IdRol]) REFERENCES [SEGURIDAD].[Rol] ([IdRol]);
GO

ALTER TABLE [SEGURIDAD].[Permiso] ADD CONSTRAINT [FK__Permiso__Modific__2FCF1A8A] FOREIGN KEY ([ModificadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [SEGURIDAD].[Permiso] ADD CONSTRAINT [FK_Permiso_IdRol_Rol] FOREIGN KEY ([IdRol]) REFERENCES [SEGURIDAD].[Rol] ([IdRol]);
GO

ALTER TABLE [SEGURIDAD].[Rol] ADD CONSTRAINT [FK__Rol__CreadoPor__25518C17] FOREIGN KEY ([CreadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [SEGURIDAD].[Rol] ADD CONSTRAINT [FK__Rol__EliminadoPo__282DF8C2] FOREIGN KEY ([EliminadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [SEGURIDAD].[Rol] ADD CONSTRAINT [FK__Rol__ModificadoP__2739D489] FOREIGN KEY ([ModificadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [SEGURIDAD].[RolPermiso] ADD CONSTRAINT [FK__RolPermis__Cread__37703C52] FOREIGN KEY ([CreadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [SEGURIDAD].[RolPermiso] ADD CONSTRAINT [FK__RolPermis__Elimi__3A4CA8FD] FOREIGN KEY ([EliminadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [SEGURIDAD].[RolPermiso] ADD CONSTRAINT [FK__RolPermis__IdPer__3493CFA7] FOREIGN KEY ([IdPermiso]) REFERENCES [SEGURIDAD].[Permiso] ([IdPermiso]) ON DELETE CASCADE;
GO

ALTER TABLE [SEGURIDAD].[RolPermiso] ADD CONSTRAINT [FK__RolPermis__IdRol__339FAB6E] FOREIGN KEY ([IdRol]) REFERENCES [SEGURIDAD].[Rol] ([IdRol]) ON DELETE CASCADE;
GO

ALTER TABLE [SEGURIDAD].[RolPermiso] ADD CONSTRAINT [FK__RolPermis__Modif__395884C4] FOREIGN KEY ([ModificadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [SEGURIDAD].[Usuario] ADD CONSTRAINT [FK_Usuario_CreadoPor] FOREIGN KEY ([CreadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [SEGURIDAD].[Usuario] ADD CONSTRAINT [FK_Usuario_EliminadoPor] FOREIGN KEY ([EliminadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [SEGURIDAD].[Usuario] ADD CONSTRAINT [FK_Usuario_Empleado] FOREIGN KEY ([IdEmpleado]) REFERENCES [RRHH].[Empleado] ([IdEmpleado]) ON DELETE CASCADE;
GO

ALTER TABLE [SEGURIDAD].[Usuario] ADD CONSTRAINT [FK_Usuario_ModificadoPor] FOREIGN KEY ([ModificadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [SEGURIDAD].[UsuarioPermiso] ADD CONSTRAINT [FK__UsuarioPe__Cread__4A8310C6] FOREIGN KEY ([CreadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [SEGURIDAD].[UsuarioPermiso] ADD CONSTRAINT [FK__UsuarioPe__Elimi__4D5F7D71] FOREIGN KEY ([EliminadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [SEGURIDAD].[UsuarioPermiso] ADD CONSTRAINT [FK__UsuarioPe__IdPer__47A6A41B] FOREIGN KEY ([IdPermiso]) REFERENCES [SEGURIDAD].[Permiso] ([IdPermiso]) ON DELETE CASCADE;
GO

ALTER TABLE [SEGURIDAD].[UsuarioPermiso] ADD CONSTRAINT [FK__UsuarioPe__IdUsu__46B27FE2] FOREIGN KEY ([IdUsuario]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]) ON DELETE CASCADE;
GO

ALTER TABLE [SEGURIDAD].[UsuarioPermiso] ADD CONSTRAINT [FK__UsuarioPe__Modif__4C6B5938] FOREIGN KEY ([ModificadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [SEGURIDAD].[UsuarioRol] ADD CONSTRAINT [FK__UsuarioRo__Cread__40F9A68C] FOREIGN KEY ([CreadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [SEGURIDAD].[UsuarioRol] ADD CONSTRAINT [FK__UsuarioRo__Elimi__43D61337] FOREIGN KEY ([EliminadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [SEGURIDAD].[UsuarioRol] ADD CONSTRAINT [FK__UsuarioRo__IdRol__3E1D39E1] FOREIGN KEY ([IdRol]) REFERENCES [SEGURIDAD].[Rol] ([IdRol]) ON DELETE CASCADE;
GO

ALTER TABLE [SEGURIDAD].[UsuarioRol] ADD CONSTRAINT [FK__UsuarioRo__IdUsu__3D2915A8] FOREIGN KEY ([IdUsuario]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]) ON DELETE CASCADE;
GO

ALTER TABLE [SEGURIDAD].[UsuarioRol] ADD CONSTRAINT [FK__UsuarioRo__Modif__42E1EEFE] FOREIGN KEY ([ModificadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [VENTAS].[Cambio] ADD CONSTRAINT [FK__Cambio__CreadoPo__12C8C788] FOREIGN KEY ([CreadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [VENTAS].[Cambio] ADD CONSTRAINT [FK__Cambio__Eliminad__1699586C] FOREIGN KEY ([EliminadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [VENTAS].[Cambio] ADD CONSTRAINT [FK__Cambio__IdClient__0FEC5ADD] FOREIGN KEY ([IdCliente]) REFERENCES [CATALOGOS].[Cliente] ([IdCliente]);
GO

ALTER TABLE [VENTAS].[Cambio] ADD CONSTRAINT [FK__Cambio__IdEmplea__10E07F16] FOREIGN KEY ([IdEmpleado]) REFERENCES [RRHH].[Empleado] ([IdEmpleado]);
GO

ALTER TABLE [VENTAS].[Cambio] ADD CONSTRAINT [FK__Cambio__IdNotaCr__0E04126B] FOREIGN KEY ([IdNotaCredito]) REFERENCES [VENTAS].[NotaCredito] ([IdNotaCredito]);
GO

ALTER TABLE [VENTAS].[Cambio] ADD CONSTRAINT [FK__Cambio__IdVentaN__0EF836A4] FOREIGN KEY ([IdVentaNueva]) REFERENCES [VENTAS].[Venta] ([IdVenta]);
GO

ALTER TABLE [VENTAS].[Cambio] ADD CONSTRAINT [FK__Cambio__Modifica__14B10FFA] FOREIGN KEY ([ModificadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [VENTAS].[NotaCredito] ADD CONSTRAINT [FK__NotaCredi__Aprob__7CD98669] FOREIGN KEY ([AprobadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [VENTAS].[NotaCredito] ADD CONSTRAINT [FK__NotaCredi__Cread__7DCDAAA2] FOREIGN KEY ([CreadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [VENTAS].[NotaCredito] ADD CONSTRAINT [FK__NotaCredi__Elimi__019E3B86] FOREIGN KEY ([EliminadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [VENTAS].[NotaCredito] ADD CONSTRAINT [FK__NotaCredi__IdEst__7BE56230] FOREIGN KEY ([IdEstadoNota]) REFERENCES [CATALOGOS].[EstadoNota] ([IdEstadoNota]);
GO

ALTER TABLE [VENTAS].[NotaCredito] ADD CONSTRAINT [FK__NotaCredi__IdVen__7908F585] FOREIGN KEY ([IdVenta]) REFERENCES [VENTAS].[Venta] ([IdVenta]);
GO

ALTER TABLE [VENTAS].[NotaCredito] ADD CONSTRAINT [FK__NotaCredi__Modif__7FB5F314] FOREIGN KEY ([ModificadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [VENTAS].[NotaCreditoDetalle] ADD CONSTRAINT [FK__NotaCredi__Cread__075714DC] FOREIGN KEY ([CreadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [VENTAS].[NotaCreditoDetalle] ADD CONSTRAINT [FK__NotaCredi__Elimi__0B27A5C0] FOREIGN KEY ([EliminadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [VENTAS].[NotaCreditoDetalle] ADD CONSTRAINT [FK__NotaCredi__IdMot__0662F0A3] FOREIGN KEY ([IdMotivoDevol]) REFERENCES [CATALOGOS].[MotivoDevolucion] ([IdMotivo]);
GO

ALTER TABLE [VENTAS].[NotaCreditoDetalle] ADD CONSTRAINT [FK__NotaCredi__IdNot__047AA831] FOREIGN KEY ([IdNotaCredito]) REFERENCES [VENTAS].[NotaCredito] ([IdNotaCredito]) ON DELETE CASCADE;
GO

ALTER TABLE [VENTAS].[NotaCreditoDetalle] ADD CONSTRAINT [FK__NotaCredi__IdVen__056ECC6A] FOREIGN KEY ([IdVentaDetalle]) REFERENCES [VENTAS].[VentaDetalle] ([IdVentaDetalle]);
GO

ALTER TABLE [VENTAS].[NotaCreditoDetalle] ADD CONSTRAINT [FK__NotaCredi__Modif__093F5D4E] FOREIGN KEY ([ModificadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [VENTAS].[Pedido] ADD CONSTRAINT [FK__Pedido__CreadoPo__3EA749C6] FOREIGN KEY ([CreadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [VENTAS].[Pedido] ADD CONSTRAINT [FK__Pedido__Eliminad__4277DAAA] FOREIGN KEY ([EliminadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [VENTAS].[Pedido] ADD CONSTRAINT [FK__Pedido__IdBodega__45DE573A] FOREIGN KEY ([IdBodega]) REFERENCES [INVENTARIO].[Bodega] ([IdBodega]);
GO

ALTER TABLE [VENTAS].[Pedido] ADD CONSTRAINT [FK__Pedido__IdClient__38EE7070] FOREIGN KEY ([IdCliente]) REFERENCES [CATALOGOS].[Cliente] ([IdCliente]);
GO

ALTER TABLE [VENTAS].[Pedido] ADD CONSTRAINT [FK__Pedido__IdEmplea__39E294A9] FOREIGN KEY ([IdEmpleado]) REFERENCES [RRHH].[Empleado] ([IdEmpleado]);
GO

ALTER TABLE [VENTAS].[Pedido] ADD CONSTRAINT [FK__Pedido__IdEstado__3BCADD1B] FOREIGN KEY ([IdEstadoPedido]) REFERENCES [CATALOGOS].[EstadoPedido] ([IdEstadoPedido]);
GO

ALTER TABLE [VENTAS].[Pedido] ADD CONSTRAINT [FK__Pedido__IdTermin__46D27B73] FOREIGN KEY ([IdTermino]) REFERENCES [CATALOGOS].[Termino] ([IdTermino]);
GO

ALTER TABLE [VENTAS].[Pedido] ADD CONSTRAINT [FK__Pedido__Modifica__408F9238] FOREIGN KEY ([ModificadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [VENTAS].[PedidoDetalle] ADD CONSTRAINT [FK__PedidoDet__Cread__4924D839] FOREIGN KEY ([CreadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [VENTAS].[PedidoDetalle] ADD CONSTRAINT [FK__PedidoDet__Elimi__4CF5691D] FOREIGN KEY ([EliminadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [VENTAS].[PedidoDetalle] ADD CONSTRAINT [FK__PedidoDet__IdPed__45544755] FOREIGN KEY ([IdPedido]) REFERENCES [VENTAS].[Pedido] ([IdPedido]) ON DELETE CASCADE;
GO

ALTER TABLE [VENTAS].[PedidoDetalle] ADD CONSTRAINT [FK__PedidoDet__IdPro__46486B8E] FOREIGN KEY ([IdProducto]) REFERENCES [INVENTARIO].[Producto] ([IdProducto]);
GO

ALTER TABLE [VENTAS].[PedidoDetalle] ADD CONSTRAINT [FK__PedidoDet__Modif__4B0D20AB] FOREIGN KEY ([ModificadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [VENTAS].[Venta] ADD CONSTRAINT [FK__Venta__CreadoPor__55BFB948] FOREIGN KEY ([CreadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [VENTAS].[Venta] ADD CONSTRAINT [FK__Venta__Eliminado__59904A2C] FOREIGN KEY ([EliminadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [VENTAS].[Venta] ADD CONSTRAINT [FK__Venta__IdBodega__4F12BBB9] FOREIGN KEY ([IdBodega]) REFERENCES [INVENTARIO].[Bodega] ([IdBodega]);
GO

ALTER TABLE [VENTAS].[Venta] ADD CONSTRAINT [FK__Venta__IdCliente__4D2A7347] FOREIGN KEY ([IdCliente]) REFERENCES [CATALOGOS].[Cliente] ([IdCliente]);
GO

ALTER TABLE [VENTAS].[Venta] ADD CONSTRAINT [FK__Venta__IdEmplead__4E1E9780] FOREIGN KEY ([IdEmpleado]) REFERENCES [RRHH].[Empleado] ([IdEmpleado]);
GO

ALTER TABLE [VENTAS].[Venta] ADD CONSTRAINT [FK__Venta__IdEstado__5006DFF2] FOREIGN KEY ([IdEstado]) REFERENCES [CATALOGOS].[Estado] ([IdEstado]);
GO

ALTER TABLE [VENTAS].[Venta] ADD CONSTRAINT [FK__Venta__IdEstadoC__54CB950F] FOREIGN KEY ([IdEstadoCxc]) REFERENCES [CATALOGOS].[EstadoCxc] ([IdEstadoCxc]);
GO

ALTER TABLE [VENTAS].[Venta] ADD CONSTRAINT [FK__Venta__IdPedidoO__47C69FAC] FOREIGN KEY ([IdPedidoOrigen]) REFERENCES [VENTAS].[Pedido] ([IdPedido]);
GO

ALTER TABLE [VENTAS].[Venta] ADD CONSTRAINT [FK__Venta__IdTermino__52E34C9D] FOREIGN KEY ([IdTermino]) REFERENCES [CATALOGOS].[Termino] ([IdTermino]);
GO

ALTER TABLE [VENTAS].[Venta] ADD CONSTRAINT [FK__Venta__Modificad__57A801BA] FOREIGN KEY ([ModificadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [VENTAS].[VentaDetalle] ADD CONSTRAINT [FK__VentaDeta__Cread__6501FCD8] FOREIGN KEY ([CreadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [VENTAS].[VentaDetalle] ADD CONSTRAINT [FK__VentaDeta__Elimi__640DD89F] FOREIGN KEY ([EliminadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

ALTER TABLE [VENTAS].[VentaDetalle] ADD CONSTRAINT [FK__VentaDeta__IdPro__5E54FF49] FOREIGN KEY ([IdProducto]) REFERENCES [INVENTARIO].[Producto] ([IdProducto]);
GO

ALTER TABLE [VENTAS].[VentaDetalle] ADD CONSTRAINT [FK__VentaDeta__IdVen__5D60DB10] FOREIGN KEY ([IdVenta]) REFERENCES [VENTAS].[Venta] ([IdVenta]) ON DELETE CASCADE;
GO

ALTER TABLE [VENTAS].[VentaDetalle] ADD CONSTRAINT [FK__VentaDeta__Modif__61316BF4] FOREIGN KEY ([ModificadoPor]) REFERENCES [SEGURIDAD].[Usuario] ([IdUsuario]);
GO

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO
CREATE FUNCTION NormalizarDocumento(@doc VARCHAR(50))
RETURNS VARCHAR(50)
AS
BEGIN
    RETURN REPLACE(REPLACE(@doc, '-', ''), ' ', '')
END
GO

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

CREATE PROCEDURE [CATALOGOS].[Empleado_ACTUALIZAR]
    @IdEmpleado INT,
    @Nombres NVARCHAR(50),
    @Apellidos NVARCHAR(50),
    @Direccion NVARCHAR(250),
    @Telefono VARCHAR(20),
    @Celular VARCHAR(20),
    @Email NVARCHAR(50),
    @TipoDoc CHAR(3),
    @NumDoc NVARCHAR(30),
    @IdCiudad INT,
    @IdSucursal INT,
    @ModificadoPor INT,
    @Puesto NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF NOT EXISTS (SELECT 1 FROM RRHH.Empleado WHERE IdEmpleado = @IdEmpleado AND Eliminado = 0)
        BEGIN
            RAISERROR('Empleado no encontrado o eliminado.', 16, 1);
            ROLLBACK;
            RETURN;
        END

        DECLARE @IdPersona INT;
        SELECT @IdPersona = IdPersona FROM RRHH.Empleado WHERE IdEmpleado = @IdEmpleado;

        -- Dividir nombres y apellidos
        DECLARE @Nombre1 NVARCHAR(10), @Nombre2 NVARCHAR(10) = NULL;
        DECLARE @Apellido1 NVARCHAR(10), @Apellido2 NVARCHAR(10) = NULL;

        SET @Nombre1 = LEFT(@Nombres, CHARINDEX(' ', @Nombres + ' ') - 1);
        SET @Nombre2 = NULLIF(LTRIM(SUBSTRING(@Nombres, CHARINDEX(' ', @Nombres + ' '), LEN(@Nombres))), '');

        SET @Apellido1 = LEFT(@Apellidos, CHARINDEX(' ', @Apellidos + ' ') - 1);
        SET @Apellido2 = NULLIF(LTRIM(SUBSTRING(@Apellidos, CHARINDEX(' ', @Apellidos + ' '), LEN(@Apellidos))), '');

        -- Validaciones básicas
        IF @Telefono IS NOT NULL AND (LEN(@Telefono) < 8 OR @Telefono IN ('1234-5678', '6789-0123', '1111-1111', '2222-2222'))
        BEGIN
            RAISERROR('Número de teléfono inválido.', 16, 1);
            ROLLBACK;
            RETURN;
        END

        IF @Celular IS NOT NULL AND (LEN(@Celular) < 8 OR @Celular IN ('1234-5678', '6789-0123', '1111-1111', '2222-2222'))
        BEGIN
            RAISERROR('Número de celular inválido.', 16, 1);
            ROLLBACK;
            RETURN;
        END

        -- Actualizar Persona
        UPDATE GENERAL.Persona
        SET
            Nombre1 = @Nombre1,
            Nombre2 = @Nombre2,
            Apellido1 = @Apellido1,
            Apellido2 = @Apellido2,
            Direccion = @Direccion,
            Telefono = @Telefono,
            Celular = @Celular,
            Email = @Email,
            TipoDoc = @TipoDoc,
            NumDoc = @NumDoc,
            IdCiudad = @IdCiudad,
            ModificadoPor = @ModificadoPor,
            FechaModificacion = SYSDATETIME()
        WHERE IdPersona = @IdPersona;

        -- Actualizar Empleado
        UPDATE RRHH.Empleado
        SET
            IdSucursal = @IdSucursal,
            Puesto = @Puesto,
            ModificadoPor = @ModificadoPor,
            FechaModificacion = SYSDATETIME()
        WHERE IdEmpleado = @IdEmpleado;

        COMMIT;

        -- Retornar datos actualizados
        SELECT
            E.IdEmpleado,
            CONCAT(P.Nombre1, ' ', ISNULL(P.Nombre2, '')) AS Nombres,
            CONCAT(P.Apellido1, ' ', ISNULL(P.Apellido2, '')) AS Apellidos,
            P.Direccion,
            P.Telefono,
            P.Celular,
            P.Email,
            P.TipoDoc,
            P.NumDoc,
            CIU.Nombre AS Ciudad,
            CIU.IdCiudad,
            PA.Nombre AS Pais,
            S.Nombre AS Sucursal,
            S.IdSucursal,
            E.Codigo,
            E.Puesto,
            E.FechaModificacion
        FROM RRHH.Empleado E
        JOIN GENERAL.Persona P ON E.IdPersona = P.IdPersona
        JOIN CATALOGOS.Ciudad CIU ON P.IdCiudad = CIU.IdCiudad
        JOIN CATALOGOS.Pais PA ON CIU.IdPais = PA.IdPais
        JOIN CATALOGOS.Sucursal S ON E.IdSucursal = S.IdSucursal
        WHERE E.IdEmpleado = @IdEmpleado;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK;

        DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrorMsg, 16, 1);
    END CATCH
END

GO

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO
CREATE PROCEDURE [CATALOGOS].[sp_Cliente_Seleccionar]
    @Nombre NVARCHAR(100) = NULL,
    @NumDoc NVARCHAR(30) = NULL,
    @IdSucursal INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        C.IdCliente,
        CONCAT(P.Nombre1, ' ', ISNULL(P.Nombre2, '')) AS Nombres,
		CONCAT(P.Apellido1, ' ', ISNULL(P.Apellido2, '')) AS Apellidos,
        P.Direccion,
        P.Telefono,
        P.Celular,
        P.Email,
        P.TipoDoc,
        P.NumDoc,
        CIU.Nombre AS Ciudad,
		CIU.IdCiudad,
        PA.Nombre AS Pais,
        S.Nombre AS Sucursal,
		S.IdSucursal,
        C.TieneCredito,
        C.LimiteCredito,
        C.FechaCreacion,
        C.Eliminado
    FROM CATALOGOS.Cliente C
    JOIN GENERAL.Persona P ON C.IdPersona = P.IdPersona
    JOIN CATALOGOS.Ciudad CIU ON P.IdCiudad = CIU.IdCiudad
    JOIN CATALOGOS.Pais PA ON CIU.IdPais = PA.IdPais
    JOIN CATALOGOS.Sucursal S ON C.IdSucursal = S.IdSucursal
    WHERE 
        C.Eliminado = 0 AND
        (@Nombre IS NULL OR CONCAT(P.Nombre1, ' ', ISNULL(P.Nombre2, ''), ' ', P.Apellido1, ' ', ISNULL(P.Apellido2, '')) LIKE '%' + @Nombre + '%') AND
        (@NumDoc IS NULL OR P.NumDoc = @NumDoc) AND
        (@IdSucursal IS NULL OR C.IdSucursal = @IdSucursal)
    ORDER BY C.IdCliente DESC;
END
GO

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO
CREATE PROCEDURE [CATALOGOS].[sp_Empleado_Seleccionar]
    @Nombre NVARCHAR(100) = NULL,
    @NumDoc NVARCHAR(30) = NULL,
    @IdSucursal INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        E.IdEmpleado,
        CONCAT(P.Nombre1, ' ', ISNULL(P.Nombre2, '')) AS Nombres,
		CONCAT(P.Apellido1, ' ', ISNULL(P.Apellido2, '')) AS Apellidos,
        P.Direccion,
        P.Telefono,
        P.Celular,
        P.Email,
        P.TipoDoc,
        P.NumDoc,
        CIU.Nombre AS Ciudad,
		CIU.IdCiudad,
        PA.Nombre AS Pais,
        S.Nombre AS Sucursal,
		--U.Login as Usuario,
		S.IdSucursal,
        E.Codigo,
        E.Puesto,
        E.FechaCreacion,
		E.FechaIngreso,
        E.Eliminado
    FROM RRHH.Empleado E
    LEFT JOIN GENERAL.Persona P ON E.IdPersona = P.IdPersona
    LEFT JOIN CATALOGOS.Ciudad CIU ON P.IdCiudad = CIU.IdCiudad
    LEFT JOIN CATALOGOS.Pais PA ON CIU.IdPais = PA.IdPais
    LEFT JOIN CATALOGOS.Sucursal S ON E.IdSucursal = S.IdSucursal
	--LEFT JOIN SEGURIDAD.Usuario U ON U.IdEmpleado = E.IdEmpleado
    WHERE 
        --E.Eliminado = 0 AND U.Eliminado = 0 AND 
		E.Eliminado = 0 AND
        (@Nombre IS NULL OR CONCAT(P.Nombre1, ' ', ISNULL(P.Nombre2, ''), ' ', P.Apellido1, ' ', ISNULL(P.Apellido2, '')) LIKE '%' + @Nombre + '%') AND
        (@NumDoc IS NULL OR P.NumDoc = @NumDoc) AND
        (@IdSucursal IS NULL OR E.IdSucursal = @IdSucursal)
    ORDER BY E.IdEmpleado DESC;
END
GO

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO
CREATE PROCEDURE [CATALOGOS].[sp_InsertarCliente]
    @Nombres NVARCHAR(50),
    @Apellidos NVARCHAR(50),
    @Direccion NVARCHAR(250),
    @Telefono VARCHAR(20),
    @Celular VARCHAR(20),
    @Email NVARCHAR(50),
    @IdCiudad INT,
    @TipoDoc CHAR(3),
    @NumDoc NVARCHAR(30),
    @IdSucursal INT,
    @TieneCredito BIT,
    @LimiteCredito DECIMAL(18,2),
    @CreadoPor INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        -- Dividir nombres y apellidos
        DECLARE @Nombre1 NVARCHAR(10), @Nombre2 NVARCHAR(10) = NULL;
        DECLARE @Apellido1 NVARCHAR(10), @Apellido2 NVARCHAR(10) = NULL;

        SET @Nombre1 = LEFT(@Nombres, CHARINDEX(' ', @Nombres + ' ') - 1);
		SET @Nombre2 = NULLIF(LTRIM(SUBSTRING(@Nombres, CHARINDEX(' ', @Nombres + ' '), LEN(@Nombres))), '');

        SET @Apellido1 = LEFT(@Apellidos, CHARINDEX(' ', @Apellidos + ' ') - 1);
		SET @Apellido2 = NULLIF(LTRIM(SUBSTRING(@Apellidos, CHARINDEX(' ', @Apellidos + ' '), LEN(@Apellidos))), '');

        -- Validaciones básicas
        IF @Telefono IS NOT NULL AND (
            LEN(@Telefono) < 8 OR
            @Telefono IN ('1234-5678', '6789-0123', '1111-1111', '2222-2222')
        )
        BEGIN
            RAISERROR('Número de teléfono inválido.', 16, 1);
            ROLLBACK;
            RETURN;
        END

        IF @Celular IS NOT NULL AND (
            LEN(@Celular) < 8 OR
            @Celular IN ('1234-5678', '6789-0123', '1111-1111', '2222-2222')
        )
        BEGIN
            RAISERROR('Número de celular inválido.', 16, 1);
            ROLLBACK;
            RETURN;
        END

        IF @TieneCredito = 1 AND (@LimiteCredito IS NULL OR @LimiteCredito <= 0)
        BEGIN
            RAISERROR('El cliente tiene crédito pero no se especificó un límite válido.', 16, 1);
            ROLLBACK;
            RETURN;
        END

        IF @TieneCredito = 0
            SET @LimiteCredito = NULL;

        -- Insertar en GENERAL.Persona
        INSERT INTO GENERAL.Persona (
            Nombre1, Nombre2, Apellido1, Apellido2, Direccion, Telefono, Celular, Email,
            IdCiudad, TipoDoc, NumDoc, CreadoPor
        )
        VALUES (
            @Nombre1, @Nombre2, @Apellido1, @Apellido2, @Direccion, @Telefono, @Celular, @Email,
            @IdCiudad, @TipoDoc, @NumDoc, @CreadoPor
        );

        DECLARE @IdPersona INT = SCOPE_IDENTITY();

        -- Insertar en CATALOGOS.Cliente
        DECLARE @CodigoCliente VARCHAR(20);
        SET @CodigoCliente = 'CLI-' + RIGHT('00000' + CAST(@IdPersona AS VARCHAR), 6);

        INSERT INTO CATALOGOS.Cliente (
            IdPersona, IdSucursal, Codigo, TieneCredito, LimiteCredito, CreadoPor
        )
        VALUES (
            @IdPersona, @IdSucursal, @CodigoCliente, @TieneCredito, @LimiteCredito, @CreadoPor
        );

        COMMIT;
		-- Devolver información del cliente insertado
		SELECT 
			c.IdCliente,
			c.Codigo,
			p.Nombre1 + ' ' + ISNULL(p.Nombre2, '') AS Nombres,
			p.Apellido1 + ' ' + ISNULL(p.Apellido2, '') AS Apellidos,
			p.Direccion,
			p.Telefono,
			p.IdCiudad,
			p.TipoDoc,
			p.NumDoc,
			c.IdSucursal,
			s.Nombre as Sucursal,
			p.Email,
			p.Celular,
			c.TieneCredito,
			c.LimiteCredito
		FROM CATALOGOS.Cliente c
		JOIN GENERAL.Persona p ON p.IdPersona = c.IdPersona
		JOIN CATALOGOS.Sucursal s ON s.IdSucursal = c.IdSucursal
		WHERE c.IdPersona = @IdPersona;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK;

        DECLARE @MensajeError NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@MensajeError, 16, 1);
    END CATCH
END
GO

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO
CREATE PROCEDURE [CATALOGOS].[sp_InsertarEmpleado]
    @Nombres NVARCHAR(50),
    @Apellidos NVARCHAR(50),
    @Direccion NVARCHAR(250),
    @Telefono VARCHAR(20),
    @Celular VARCHAR(20),
    @Email NVARCHAR(50),
    @IdCiudad INT,
    @TipoDoc CHAR(3),
    @NumDoc NVARCHAR(30),
    @IdSucursal INT,
    @CreadoPor INT,
	@Puesto NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        -- Dividir nombres y apellidos
        DECLARE @Nombre1 NVARCHAR(10), @Nombre2 NVARCHAR(10) = NULL;
        DECLARE @Apellido1 NVARCHAR(10), @Apellido2 NVARCHAR(10) = NULL;

        SET @Nombre1 = LEFT(@Nombres, CHARINDEX(' ', @Nombres + ' ') - 1);
		SET @Nombre2 = NULLIF(LTRIM(SUBSTRING(@Nombres, CHARINDEX(' ', @Nombres + ' '), LEN(@Nombres))), '');

        SET @Apellido1 = LEFT(@Apellidos, CHARINDEX(' ', @Apellidos + ' ') - 1);
		SET @Apellido2 = NULLIF(LTRIM(SUBSTRING(@Apellidos, CHARINDEX(' ', @Apellidos + ' '), LEN(@Apellidos))), '');

        -- Validaciones básicas
        IF @Telefono IS NOT NULL AND (
            LEN(@Telefono) < 8 OR
            @Telefono IN ('1234-5678', '6789-0123', '1111-1111', '2222-2222')
        )
        BEGIN
            RAISERROR('Número de teléfono inválido.', 16, 1);
            ROLLBACK;
            RETURN;
        END

        IF @Celular IS NOT NULL AND (
            LEN(@Celular) < 8 OR
            @Celular IN ('1234-5678', '6789-0123', '1111-1111', '2222-2222')
        )
        BEGIN
            RAISERROR('Número de celular inválido.', 16, 1);
            ROLLBACK;
            RETURN;
        END


        -- Insertar en GENERAL.Persona
        INSERT INTO GENERAL.Persona (
            Nombre1, Nombre2, Apellido1, Apellido2, Direccion, Telefono, Celular, Email,
            IdCiudad, TipoDoc, NumDoc, CreadoPor, Eliminado
        )
        VALUES (
            @Nombre1, @Nombre2, @Apellido1, @Apellido2, @Direccion, @Telefono, @Celular, @Email,
            @IdCiudad, @TipoDoc, @NumDoc, @CreadoPor, 0
        );

        DECLARE @IdPersona INT = SCOPE_IDENTITY();

        -- Insertar en CATALOGOS.Cliente
        DECLARE @CodigoEmpleado VARCHAR(20);
        SET @CodigoEmpleado = 'EMP-' + RIGHT('00000' + CAST(@IdPersona AS VARCHAR), 6);

        INSERT INTO RRHH.Empleado(
            IdPersona, IdSucursal, Codigo, CreadoPor, Puesto, Eliminado
        )
        VALUES (
            @IdPersona, @IdSucursal, @CodigoEmpleado, @CreadoPor, @Puesto, 0
        );

        COMMIT;

		SELECT
        E.IdEmpleado,
        CONCAT(P.Nombre1, ' ', ISNULL(P.Nombre2, '')) AS Nombres,
		CONCAT(P.Apellido1, ' ', ISNULL(P.Apellido2, '')) AS Apellidos,
        P.Direccion,
        P.Telefono,
        P.Celular,
        P.Email,
        P.TipoDoc,
        P.NumDoc,
        CIU.Nombre AS Ciudad,
		CIU.IdCiudad,
        PA.Nombre AS Pais,
        S.Nombre AS Sucursal,
		U.Login as Usuario,
		S.IdSucursal,
        E.Codigo,
        E.Puesto,
        E.FechaCreacion,
		E.FechaIngreso,
        E.Eliminado
    FROM RRHH.Empleado E
    LEFT JOIN GENERAL.Persona P ON E.IdPersona = P.IdPersona
    LEFT JOIN CATALOGOS.Ciudad CIU ON P.IdCiudad = CIU.IdCiudad
    LEFT JOIN CATALOGOS.Pais PA ON CIU.IdPais = PA.IdPais
    LEFT JOIN CATALOGOS.Sucursal S ON E.IdSucursal = S.IdSucursal
	LEFT JOIN SEGURIDAD.Usuario U ON U.IdEmpleado = E.IdEmpleado
	where E.Eliminado = 0 AND P.IdPersona = @IdPersona
	AND P.Eliminado = 0
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK;

        DECLARE @MensajeError NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@MensajeError, 16, 1);
    END CATCH
END


GO

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO
CREATE   PROCEDURE [COMPRAS].[sp_Compra_Insertar]
    @IdProveedor INT,
    @IdEmpleado INT,
    @IdBodega INT,
    @Fecha DATETIME2,
    @UsuarioId INT,
    @Detalles COMPRAS.TipoCompraDetalle READONLY
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRAN;

        -- Calcular subtotal
        DECLARE @Subtotal DECIMAL(18,4), @Descuento DECIMAL(18,4) = 0, @Impuestos DECIMAL(18,4) = 0;
        SELECT 
            @Subtotal = SUM(Cantidad * CostoUnit)
        FROM @Detalles;

        -- Insertar encabezado
		DECLARE @CodigoSucursal NVARCHAR(10);
		SELECT @CodigoSucursal = CodigoSucursal
		FROM CATALOGOS.Sucursal
		WHERE IdSucursal IN(SELECT IdSucursal FROM INVENTARIO.Bodega WHERE IdBodega = @IdBodega);

		IF @CodigoSucursal IS NULL
		BEGIN
			THROW 50003, 'No se encontró el código de la sucursal.', 1;
		END

		DECLARE @Consecutivo BIGINT;

		UPDATE ADMIN.Consecutivos
		SET ValorActual = ValorActual + 1
		WHERE Entidad = 'COMPRA';

		SELECT @Consecutivo = ValorActual
		FROM ADMIN.Consecutivos
		WHERE Entidad = 'COMPRA';

		DECLARE @Numero NVARCHAR(20);
		SET @Numero = @CodigoSucursal + '-' + RIGHT(REPLICATE('0', 9) + CAST(@Consecutivo AS VARCHAR), 9);
        DECLARE @IdCompra BIGINT;
        INSERT INTO COMPRAS.Compra (
            Numero, IdProveedor, IdEmpleado, IdBodega, IdCiudad, Fecha,
            Subtotal, Descuento, Impuestos,
            CreadoPor, FechaCreacion
        )
        VALUES (
            @Numero, @IdProveedor, @IdEmpleado, @IdBodega, 1, @Fecha,
            @Subtotal, 0, 0,
            @UsuarioId, SYSDATETIME()
        );
        SET @IdCompra = SCOPE_IDENTITY();

        -- Insertar detalles
        INSERT INTO COMPRAS.CompraDetalle (
            IdCompra, IdProducto, Cantidad, CostoUnit, CreadoPor, FechaCreacion
        )
        SELECT 
            @IdCompra, IdProducto, Cantidad, CostoUnit, @UsuarioId, SYSDATETIME()
        FROM @Detalles;

        -- 1. Actualizar existencia si ya existe
        UPDATE E
        SET 
            E.Stock = E.Stock + D.Cantidad,
            E.ModificadoPor = @UsuarioId,
            E.FechaModificacion = SYSDATETIME()
        FROM INVENTARIO.Existencia E
        JOIN @Detalles D ON E.IdProducto = D.IdProducto
        WHERE E.IdBodega = @IdBodega;

        -- 2. Insertar existencia si no existía
        INSERT INTO INVENTARIO.Existencia (
            IdBodega, IdProducto, Stock, CreadoPor, FechaCreacion
        )
        SELECT 
            @IdBodega, D.IdProducto, D.Cantidad, @UsuarioId, SYSDATETIME()
        FROM @Detalles D
        WHERE NOT EXISTS (
            SELECT 1
            FROM INVENTARIO.Existencia E
            WHERE E.IdProducto = D.IdProducto AND E.IdBodega = @IdBodega
        );

        -- Insertar en Kardex (tipo movimiento 2 = COMPRA)
        INSERT INTO INVENTARIO.Kardex (
            IdBodega, IdProducto, IdTipoMov, ReferenciaId, Fecha,
            Cantidad, CostoUnit, Observacion,
            CreadoPor, FechaCreacion
        )
        SELECT 
            @IdBodega, IdProducto, 6, @IdCompra, @Fecha,
            Cantidad, CostoUnit, CONCAT('Compra ', @Numero),
            @UsuarioId, SYSDATETIME()
        FROM @Detalles;

        COMMIT;
    END TRY
    BEGIN CATCH
        ROLLBACK;
        THROW;
    END CATCH
END

GO

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO
CREATE   PROCEDURE [INVENTARIO].[sp_Kardex_General]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        P.IdProducto,
		B.IdBodega,
        P.Codigo,
        P.Referencia,
        P.Descripcion,
        CA.Nombre AS Categoria,
        M.Nombre AS Marca,
        L.Nombre AS Linea,
        B.Nombre AS Bodega,

        SUM(CASE WHEN TP.Signo > 0 THEN K.Cantidad ELSE 0 END) AS Entradas,
        SUM(CASE WHEN TP.Signo < 0 THEN K.Cantidad * -1 ELSE 0 END) AS Salidas,
        SUM(K.Cantidad) AS Saldo

    FROM INVENTARIO.Producto P
    INNER JOIN INVENTARIO.Kardex K ON K.IdProducto = P.IdProducto AND K.Eliminado = 0
    INNER JOIN CATALOGOS.Categoria CA ON CA.IdCategoria = P.IdCategoria
    INNER JOIN CATALOGOS.Linea L ON L.IdLinea = P.IdLinea
    INNER JOIN CATALOGOS.Marca M ON M.IdMarca = P.IdMarca
    INNER JOIN INVENTARIO.Bodega B ON B.IdBodega = K.IdBodega
    INNER JOIN CATALOGOS.TipoMovimientoInventario TP ON TP.IdTipoMov = K.IdTipoMov

    GROUP BY
        P.IdProducto, B.IdBodega, P.Codigo, P.Referencia, P.Descripcion,
        CA.Nombre, M.Nombre, L.Nombre, B.Nombre
    ORDER BY P.Descripcion
END;

GO

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO
CREATE PROCEDURE [INVENTARIO].[sp_Productos_StockYPrecios]
    @IdSucursal INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Detectar la bodega principal de la sucursal
    DECLARE @IdBodegaPrincipal INT;
    SELECT TOP 1 @IdBodegaPrincipal = B.IdBodega
    FROM INVENTARIO.Bodega B
    WHERE B.IdSucursal = @IdSucursal AND B.Eliminado = 0 AND B.EsPrincipal = 1
    ORDER BY B.IdBodega; -- Asumiendo que la primera es la principal

    -- Resultado
    SELECT
        P.IdProducto,
        P.Codigo,
        P.Descripcion,
        P.Referencia,
		(
            SELECT TOP 1 PIMG.UrlArchivo
            FROM INVENTARIO.ProductoImagen PIMG
            WHERE PIMG.IdProducto = P.IdProducto AND PIMG.Eliminado = 0
            ORDER BY PIMG.IdImagen
        ) AS ImagenUrl,
        
        -- Stock en la bodega principal
        ISNULL((
            SELECT E.Stock
            FROM INVENTARIO.Existencia E
            WHERE E.IdProducto = P.IdProducto AND E.IdBodega = @IdBodegaPrincipal
        ), 0) AS StockBodegaPrincipal,

        -- Stock total en sucursal (todas las bodegas de esa sucursal)
      ISNULL((
            SELECT SUM(E.Stock)
            FROM INVENTARIO.Existencia E
            INNER JOIN INVENTARIO.Bodega B ON B.IdBodega = E.IdBodega
            WHERE E.IdProducto = P.IdProducto AND B.IdSucursal = @IdSucursal
        ), 0) AS StockTotalSucursal,

        -- Precios en formato JSON
        (
            SELECT
                LP.Nombre AS TipoPrecio,
                PR.Precio
            FROM INVENTARIO.ProductoPrecio PR
            INNER JOIN INVENTARIO.ListaPrecio LP ON LP.IdListaPrecio = PR.IdListaPrecio
            WHERE PR.IdProducto = P.IdProducto AND PR.Eliminado = 0
            FOR JSON PATH
        ) AS Precios

    FROM INVENTARIO.Producto P
    WHERE P.Eliminado = 0
    ORDER BY P.Descripcion;
END

GO

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO
CREATE PROCEDURE [INVENTARIO].[sp_Stock_Bodega]
    @IdBodega INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Detectar la bodega principal de la sucursal

    -- Resultado
    SELECT
        P.IdProducto,
        P.Codigo,
        P.Descripcion,
        P.Referencia,
		M.Nombre as Marca,
		CA.Nombre AS Categoria,
		(
            SELECT TOP 1 PIMG.UrlArchivo
            FROM INVENTARIO.ProductoImagen PIMG
            WHERE PIMG.IdProducto = P.IdProducto AND PIMG.Eliminado = 0
            ORDER BY PIMG.IdImagen
        ) AS ImagenUrl,
        
        -- Stock en la bodega principal
        ISNULL((
            SELECT E.Stock
            FROM INVENTARIO.Existencia E
            WHERE E.IdProducto = P.IdProducto AND E.IdBodega = @IdBodega
        ), 0) AS Stock

    FROM INVENTARIO.Producto P
	LEFT JOIN CATALOGOS.Marca M ON M.IdMarca = p.IdMarca
	LEFT JOIN CATALOGOS.Categoria CA ON CA.IdCategoria = P.IdCategoria
    WHERE P.Eliminado = 0
    ORDER BY P.Descripcion;
END

GO

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO
CREATE   PROCEDURE [INVENTARIO].[sp_Traslado_Insertar]
    @IdBodegaOrigen INT,
    @IdBodegaDestino INT,
    @Fecha DATETIME2,
    @Observacion NVARCHAR(250),
    @UsuarioId INT,
    @Detalles INVENTARIO.TipoTrasladoDetalle READONLY
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRAN;
		DECLARE 
		@IdTipoMovimientoOrigen INT,
		@IdTipoMovimientoDestino INT;
        -- Insertar encabezado

		SET @IdTipoMovimientoOrigen = (
		SELECT TOP(1) IdTipoMov
		FROM CATALOGOS.TipoMovimientoInventario
		WHERE Nombre LIKE '%TRASLADO%'
		AND Signo < 0)

		SET @IdTipoMovimientoDestino = (
		SELECT TOP(1) IdTipoMov
		FROM CATALOGOS.TipoMovimientoInventario
		WHERE Nombre LIKE '%TRASLADO%'
		AND Signo > 0)
        DECLARE @IdTraslado BIGINT;

		DECLARE @CodigoSucursal NVARCHAR(10);
		SELECT @CodigoSucursal = CodigoSucursal
		FROM CATALOGOS.Sucursal
		WHERE IdSucursal = (SELECT TOP(1) IdSucursal
		FROM INVENTARIO.Bodega WHERE IdBodega = @IdBodegaOrigen);

		IF @CodigoSucursal IS NULL
		BEGIN
			THROW 50003, 'No se encontró el código de la sucursal.', 1;
		END

		DECLARE @Consecutivo BIGINT;

		UPDATE ADMIN.Consecutivos
		SET ValorActual = ValorActual + 1
		WHERE Entidad = 'TRASLADO';

		SELECT @Consecutivo = ValorActual
		FROM ADMIN.Consecutivos
		WHERE Entidad = 'TRASLADO';

		DECLARE @NumeroTraslado NVARCHAR(20);
		SET @NumeroTraslado = @CodigoSucursal + '-' + RIGHT(REPLICATE('0', 9) + CAST(@Consecutivo AS VARCHAR), 9);

        INSERT INTO INVENTARIO.Traslado (
            IdBodegaOrigen, IdBodegaDestino, Fecha, Observacion,
            CreadoPor, FechaCreacion, NumeroTraslado
        )
        VALUES (
            @IdBodegaOrigen, @IdBodegaDestino, @Fecha, @Observacion,
            @UsuarioId, SYSDATETIME(), @NumeroTraslado
        );
        SET @IdTraslado = SCOPE_IDENTITY();

        -- Insertar detalles
        INSERT INTO INVENTARIO.TrasladoDetalle (
            IdTraslado, IdProducto, Cantidad, CreadoPor, FechaCreacion
        )
        SELECT 
            @IdTraslado, IdProducto, Cantidad, @UsuarioId, SYSDATETIME()
        FROM @Detalles;

        -- Descontar de bodega origen
        UPDATE E
        SET 
            E.Stock = E.Stock - D.Cantidad,
            E.ModificadoPor = @UsuarioId,
            E.FechaModificacion = SYSDATETIME()
        FROM INVENTARIO.Existencia E
        JOIN @Detalles D ON D.IdProducto = E.IdProducto
        WHERE E.IdBodega = @IdBodegaOrigen;

        -- Sumar a bodega destino si ya existe
        UPDATE E
        SET 
            E.Stock = E.Stock + D.Cantidad,
            E.ModificadoPor = @UsuarioId,
            E.FechaModificacion = SYSDATETIME()
        FROM INVENTARIO.Existencia E
        JOIN @Detalles D ON D.IdProducto = E.IdProducto
        WHERE E.IdBodega = @IdBodegaDestino;

        -- Insertar si no existía en destino
        INSERT INTO INVENTARIO.Existencia (
            IdBodega, IdProducto, Stock, CreadoPor, FechaCreacion
        )
        SELECT 
            @IdBodegaDestino, D.IdProducto, D.Cantidad, @UsuarioId, SYSDATETIME()
        FROM @Detalles D
        WHERE NOT EXISTS (
            SELECT 1
            FROM INVENTARIO.Existencia E
            WHERE E.IdProducto = D.IdProducto AND E.IdBodega = @IdBodegaDestino
        );

        -- Insertar en Kardex (3 = salida, 4 = entrada)
        -- Salida
        INSERT INTO INVENTARIO.Kardex (
            IdBodega, IdProducto, IdTipoMov, ReferenciaId, Fecha,
            Cantidad, CostoUnit, Observacion,
            CreadoPor, FechaCreacion
        )
        SELECT 
            @IdBodegaOrigen, D.IdProducto,  @IdTipoMovimientoOrigen, @IdTraslado, @Fecha,
            -D.Cantidad, 0, CONCAT('Traslado a Bodega ', @IdBodegaDestino),
            @UsuarioId, SYSDATETIME()
        FROM @Detalles D;

        -- Entrada
        INSERT INTO INVENTARIO.Kardex (
            IdBodega, IdProducto, IdTipoMov, ReferenciaId, Fecha,
            Cantidad, CostoUnit, Observacion,
            CreadoPor, FechaCreacion
        )
        SELECT 
            @IdBodegaDestino, D.IdProducto,@IdTipoMovimientoDestino, @IdTraslado, @Fecha,
            D.Cantidad, 0, CONCAT('Traslado desde Bodega ', @IdBodegaOrigen),
            @UsuarioId, SYSDATETIME()
        FROM @Detalles D;

        COMMIT;

		SELECT @IdTraslado AS IdTraslado;
    END TRY
    BEGIN CATCH
        ROLLBACK;
        THROW;
    END CATCH
END

GO

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO
CREATE   Proc [INVENTARIO].[vw_KardexDetallado] 
@IdProducto INT,
@IdBodega INT
AS
SELECT 
    K.IdKardex,
    CONVERT(VARCHAR, K.Fecha, 103) AS Fecha,
    B.Nombre AS Bodega,
    P.Codigo AS CodigoProducto,
    P.Descripcion AS Producto,
    K.Cantidad,
    K.CostoUnit,
    TM.Descripcion AS TipoMovimiento,
    K.IdTipoMov,
    K.ReferenciaId,
    CASE 
        WHEN K.IdTipoMov = 1 THEN CONCAT('Compra #', V.NumeroVenta)
        WHEN K.IdTipoMov = 2 THEN CONCAT('Venta #', C.Numero)
        WHEN K.IdTipoMov = 3 THEN CONCAT('Traslado Entrada #', T.IdTraslado)
        WHEN K.IdTipoMov = 4 THEN CONCAT('Traslado Salida #', T.IdTraslado)
        WHEN K.IdTipoMov = 5 THEN CONCAT('Ajuste #', A.IdAjuste)
        ELSE 'Otro'
    END AS Referencia,
    K.Observacion,
    K.CreadoPor,
    U.Login AS Usuario,
    K.FechaCreacion
FROM INVENTARIO.Kardex K
INNER JOIN INVENTARIO.Bodega B ON K.IdBodega = B.IdBodega
INNER JOIN INVENTARIO.Producto P ON K.IdProducto = P.IdProducto
INNER JOIN CATALOGOS.TipoMovimientoInventario TM ON K.IdTipoMov = TM.IdTipoMov
LEFT JOIN VENTAS.Venta V ON K.IdTipoMov = 1 AND V.IdVenta = K.ReferenciaId
LEFT JOIN COMPRAS.Compra C ON K.IdTipoMov = 2 AND C.IdCompra = K.ReferenciaId
LEFT JOIN INVENTARIO.Traslado T ON K.IdTipoMov IN (3, 4) AND T.IdTraslado = K.ReferenciaId
LEFT JOIN INVENTARIO.Ajuste A ON K.IdTipoMov = 5 AND A.IdAjuste = K.ReferenciaId
LEFT JOIN SEGURIDAD.Usuario U ON K.CreadoPor = U.IdUsuario
WHERE K.Eliminado = 0
AND K.IdBodega = @IdBodega AND K.IdProducto = @IdProducto
ORDER BY K.IdKardex asc;
GO

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO
CREATE PROCEDURE REPORTES.sp_ObtenerClientes
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        C.IdCliente,
        C.Codigo AS CodigoCliente,
        CONCAT(P.Nombre1, ' ', ISNULL(P.Nombre2, ''), ' ', P.Apellido1, ' ', ISNULL(P.Apellido2, '')) AS NombreCompleto,
        P.Direccion,
        P.Telefono,
        P.Celular,
        P.Email,
        CIU.Nombre AS Ciudad,
        PA.Nombre AS Pais,
        S.Nombre AS Sucursal,
        C.TieneCredito,
        C.LimiteCredito,
        C.FechaCreacion
    FROM CATALOGOS.Cliente C
    INNER JOIN GENERAL.Persona P ON P.IdPersona = C.IdPersona
    INNER JOIN CATALOGOS.Ciudad CIU ON CIU.IdCiudad = P.IdCiudad
    INNER JOIN CATALOGOS.Pais PA ON PA.IdPais = CIU.IdPais
    INNER JOIN CATALOGOS.Sucursal S ON S.IdSucursal = C.IdSucursal
    WHERE C.Eliminado = 0
    ORDER BY C.IdCliente DESC;
END

GO

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO
CREATE PROCEDURE [REPORTES].[sp_ObtenerEmpleados]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        E.IdEmpleado,
        E.Codigo AS CodigoEmpleado,
        CONCAT(P.Nombre1, ' ', ISNULL(P.Nombre2, ''), ' ', P.Apellido1, ' ', ISNULL(P.Apellido2, '')) AS NombreCompleto,
        P.Direccion,
        P.Telefono,
        P.Celular,
        P.Email,
        CIU.Nombre AS Ciudad,
        PA.Nombre AS Pais,
        S.Nombre AS Sucursal,
		S.IdSucursal,
        E.Puesto,
        E.FechaIngreso,
        E.FechaCreacion
    FROM RRHH.Empleado E
    INNER JOIN GENERAL.Persona P ON P.IdPersona = E.IdPersona
    INNER JOIN CATALOGOS.Ciudad CIU ON CIU.IdCiudad = P.IdCiudad
    INNER JOIN CATALOGOS.Pais PA ON PA.IdPais = CIU.IdPais
    INNER JOIN CATALOGOS.Sucursal S ON S.IdSucursal = E.IdSucursal
    WHERE E.Eliminado = 0
    ORDER BY E.IdEmpleado DESC;
END

GO

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO
CREATE   PROCEDURE [REPORTES].[sp_Reporte_Pedido]
    @IdPedido BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        PED.IdPedido,
        PED.NumeroPedido,
		FORMAT(PED.FechaPedido, 'dd-MM-yyyy') AS Fecha,
        FORMAT(PED.FechaCreacion, 'dd-MM-yyyy HH:mm') AS FechaCreacion,
        CONCAT(
            ISNULL(P.Nombre1, ''), ' ', ISNULL(P.Nombre2, ''), ' ',
            ISNULL(P.Apellido1, ''), ' ', ISNULL(P.Apellido2, '')
        ) AS Cliente,
        P.Direccion,
        P.Celular,
        S.Nombre AS Sucursal,
        B.Nombre AS Bodega,
        CONCAT(PE.Nombre1, ' ', ISNULL(PE.Nombre2, ''), ' ', PE.Apellido1, ' ', ISNULL(PE.Apellido2, ''))AS Empleado,
        T.Codigo AS Termino,
        ES.Descripcion AS Estado,
		ES.Codigo as CodigoEstado,
        PED.Subtotal,
        PED.Descuento,
        PED.Impuestos,
        (PED.Subtotal - PED.Descuento + PED.Impuestos) AS Total
    FROM VENTAS.Pedido PED
    LEFT JOIN CATALOGOS.Cliente C ON C.IdCliente = PED.IdCliente
    LEFT JOIN GENERAL.Persona P ON P.IdPersona = C.IdPersona
    LEFT JOIN INVENTARIO.Bodega B ON B.IdBodega = PED.IdBodega
	LEFT JOIN CATALOGOS.Sucursal S ON S.IdSucursal = B.IdSucursal
    LEFT JOIN RRHH.Empleado E ON E.IdEmpleado = PED.IdEmpleado
	LEFT JOIN GENERAL.Persona PE ON PE.IdPersona = E.IdPersona
    LEFT JOIN CATALOGOS.Termino T ON T.IdTermino = PED.IdTermino
    LEFT JOIN SEGURIDAD.Usuario U ON U.IdUsuario = PED.CreadoPor
    LEFT JOIN CATALOGOS.Estado ES ON ES.IdEstado = PED.IdEstadoPedido
    WHERE PED.IdPedido = @IdPedido
    -- DETALLE
    SELECT 
        PD.IdPedidoDetalle,
        PR.Codigo,
        PR.Descripcion,
        PD.Cantidad,
        PD.PrecioUnitario,
        PD.Descuento,
        PD.Subtotal
    FROM VENTAS.PedidoDetalle PD
    JOIN INVENTARIO.Producto PR ON PR.IdProducto = PD.IdProducto
    WHERE PD.IdPedido = @IdPedido AND PD.Eliminado = 0
    ORDER BY PD.IdPedidoDetalle;
END
GO

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

CREATE   PROCEDURE [REPORTES].[sp_Reporte_TodasLasCompras]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        C.IdCompra,
        C.Numero,
		FORMAT(C.Fecha, 'dd-MM-yyyy') AS Fecha,
        FORMAT(C.FechaCreacion, 'dd-MM-yyyy HH:mm') AS FechaCreacion,
        PRO.Nombre AS Proveedor,
		BO.Nombre AS BodegaDestino,
		(C.Subtotal - C.Descuento + C.Impuestos) AS Total,
        CONCAT(PE.Nombre1, ' ', ISNULL(PE.Nombre2, ''), ' ', PE.Apellido1, ' ', ISNULL(PE.Apellido2, ''))AS Empleado,
        (
            SELECT 
                CD.IdDetalle,
                PR.Codigo,
				PR.Referencia,
                PR.Descripcion,
                CD.Cantidad,
                CD.CostoUnit,
                CD.Subtotal
            FROM COMPRAS.CompraDetalle CD
            LEFT JOIN INVENTARIO.Producto PR ON PR.IdProducto = CD.IdProducto
            WHERE CD.IdCompra = C.IdCompra AND CD.Eliminado = 0
            FOR JSON PATH
        ) AS Detalles

    FROM COMPRAS.Compra C
    LEFT JOIN RRHH.Empleado E ON E.IdEmpleado = C.IdEmpleado
    LEFT JOIN GENERAL.Persona PE ON PE.IdPersona = E.IdPersona
    LEFT JOIN INVENTARIO.Bodega BO ON BO.IdBodega = C.IdBodega
	LEFT JOIN CATALOGOS.Proveedor PRO ON PRO.IdProveedor = C.IdProveedor
    WHERE C.Eliminado = 0
    ORDER BY C.IdCompra DESC;
END

GO

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

CREATE   PROCEDURE [REPORTES].[sp_Reporte_TodasLasVentas]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        V.IdVenta,
        V.NumeroVenta,
		FORMAT(V.Fecha, 'dd-MM-yyyy') AS Fecha,
        FORMAT(V.FechaCreacion, 'dd-MM-yyyy HH:mm') AS FechaCreacion,
        CONCAT(
            ISNULL(P.Nombre1, ''), ' ', ISNULL(P.Nombre2, ''), ' ',
            ISNULL(P.Apellido1, ''), ' ', ISNULL(P.Apellido2, '')
        ) AS Cliente,
        P.Direccion,
        P.Celular,
        S.Nombre AS Sucursal,
        B.Nombre AS Bodega,
        CONCAT(PE.Nombre1, ' ', ISNULL(PE.Nombre2, ''), ' ', PE.Apellido1, ' ', ISNULL(PE.Apellido2, ''))AS Empleado,
        T.Codigo AS Termino,
        EC.Codigo AS EstadoCXC,
        ES.Descripcion AS Estado,
        V.Subtotal,
        V.Descuento,
        V.Impuestos,
        (V.Subtotal - V.Descuento + V.Impuestos) AS Total,

        (
            SELECT 
                D.IdVentaDetalle,
                PR.Codigo,
				PR.Referencia,
                PR.Descripcion,
                D.Cantidad,
                D.PrecioUnitario,
                D.Descuento,
                D.Subtotal
            FROM VENTAS.VentaDetalle D
            LEFT JOIN INVENTARIO.Producto PR ON PR.IdProducto = D.IdProducto
            WHERE D.IdVenta = V.IdVenta AND D.Eliminado = 0
            FOR JSON PATH
        ) AS Detalles

    FROM VENTAS.Venta V
    LEFT JOIN CATALOGOS.Cliente C ON C.IdCliente = V.IdCliente
    LEFT JOIN GENERAL.Persona P ON P.IdPersona = C.IdPersona
    LEFT JOIN INVENTARIO.Bodega B ON B.IdBodega = V.IdBodega
	LEFT JOIN CATALOGOS.Sucursal S ON S.IdSucursal = B.IdSucursal
    LEFT JOIN RRHH.Empleado E ON E.IdEmpleado = V.IdEmpleado
	LEFT JOIN GENERAL.Persona PE ON PE.IdPersona = E.IdPersona
    LEFT JOIN CATALOGOS.Termino T ON T.IdTermino = V.IdTermino
    LEFT JOIN CATALOGOS.EstadoCxc EC ON EC.IdEstadoCxc = V.IdEstadoCxc
    LEFT JOIN SEGURIDAD.Usuario U ON U.IdUsuario = V.CreadoPor
    LEFT JOIN CATALOGOS.Estado ES ON ES.IdEstado = V.IdEstado
    WHERE V.Eliminado = 0
    ORDER BY V.IdVenta DESC;
END

GO

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

CREATE   PROCEDURE [REPORTES].[sp_Reporte_TodosLosPedidos]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        PED.IdPedido,
        PED.NumeroPedido,
		FORMAT(PED.FechaPedido, 'dd-MM-yyyy') AS Fecha,
        FORMAT(PED.FechaCreacion, 'dd-MM-yyyy HH:mm') AS FechaCreacion,
        CONCAT(
            ISNULL(P.Nombre1, ''), ' ', ISNULL(P.Nombre2, ''), ' ',
            ISNULL(P.Apellido1, ''), ' ', ISNULL(P.Apellido2, '')
        ) AS Cliente,
        P.Direccion,
        P.Celular,
        S.Nombre AS Sucursal,
        B.Nombre AS Bodega,
        CONCAT(PE.Nombre1, ' ', ISNULL(PE.Nombre2, ''), ' ', PE.Apellido1, ' ', ISNULL(PE.Apellido2, ''))AS Empleado,
        T.Codigo AS Termino,
        ES.Descripcion AS Estado,
		ES.Codigo as CodigoEstado,
        PED.Subtotal,
        PED.Descuento,
        PED.Impuestos,
        (PED.Subtotal - PED.Descuento + PED.Impuestos) AS Total,

        (
            SELECT 
                D.IdPedidoDetalle,
                PR.Codigo,
				PR.Referencia,
                PR.Descripcion,
                D.Cantidad,
                D.PrecioUnitario,
                D.Descuento,
                D.Subtotal
            FROM VENTAS.PedidoDetalle D
            LEFT JOIN INVENTARIO.Producto PR ON PR.IdProducto = D.IdProducto
            WHERE D.IdPedido = PED.IdPedido AND D.Eliminado = 0
            FOR JSON PATH
        ) AS Detalles

    FROM VENTAS.Pedido PED
    LEFT JOIN CATALOGOS.Cliente C ON C.IdCliente = PED.IdCliente
    LEFT JOIN GENERAL.Persona P ON P.IdPersona = C.IdPersona
    LEFT JOIN INVENTARIO.Bodega B ON B.IdBodega = PED.IdBodega
	LEFT JOIN CATALOGOS.Sucursal S ON S.IdSucursal = B.IdSucursal
    LEFT JOIN RRHH.Empleado E ON E.IdEmpleado = PED.IdEmpleado
	LEFT JOIN GENERAL.Persona PE ON PE.IdPersona = E.IdPersona
    LEFT JOIN CATALOGOS.Termino T ON T.IdTermino = PED.IdTermino
    LEFT JOIN SEGURIDAD.Usuario U ON U.IdUsuario = PED.CreadoPor
    LEFT JOIN CATALOGOS.EstadoPedido ES ON ES.IdEstadoPedido = PED.IdEstadoPedido
    WHERE PED.Eliminado = 0
    ORDER BY PED.IdPedido DESC;
END

GO

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO
CREATE   PROCEDURE [REPORTES].[sp_Reporte_TodosLosTraslado]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        T.IdTraslado,
		T.NumeroTraslado,
		CONVERT(VARCHAR(16), T.Fecha, 103) AS FechaTraslado,
        T.Observacion,
        BO.Nombre AS BodegaOrigen,
        BD.Nombre AS BodegaDestino,
		Observacion,
		 (
            SELECT 
                TD.IdDetalle,
                PR.Codigo,
				PR.Referencia,
                PR.Descripcion,
                TD.Cantidad
            FROM INVENTARIO.TrasladoDetalle TD
            LEFT JOIN INVENTARIO.Producto PR ON PR.IdProducto = TD.IdProducto
            WHERE TD.IdTraslado = T.IdTraslado AND T.Eliminado = 0
            FOR JSON PATH
        ) AS Detalles
    FROM INVENTARIO.Traslado T
    INNER JOIN INVENTARIO.Bodega BO ON BO.IdBodega = T.IdBodegaOrigen
    INNER JOIN INVENTARIO.Bodega BD ON BD.IdBodega = T.IdBodegaDestino
    WHERE 
        T.Eliminado = 0
    ORDER BY T.IdTraslado DESC;
END

GO

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO
CREATE   PROCEDURE [REPORTES].[sp_Reporte_Traslado]
    @FechaInicio DATE,
    @FechaFin DATE
AS
BEGIN
    SET NOCOUNT ON;
	IF @FechaFin < @FechaInicio
	BEGIN
		RAISERROR('La fecha final no puede ser menor que la fecha de inicio.', 16, 1);
		RETURN;
	END

    SELECT 
        T.IdTraslado,
		T.NumeroTraslado,
		CONVERT(VARCHAR(16), T.Fecha, 120) AS FechaTraslado,
        T.Observacion,
        BO.Nombre AS BodegaOrigen,
        BD.Nombre AS BodegaDestino,
		Observacion,
		 (
            SELECT 
                TD.IdDetalle,
                PR.Codigo,
				PR.Referencia,
                PR.Descripcion,
                TD.Cantidad
            FROM INVENTARIO.TrasladoDetalle TD
            LEFT JOIN INVENTARIO.Producto PR ON PR.IdProducto = TD.IdProducto
            WHERE TD.IdTraslado = T.IdTraslado AND T.Eliminado = 0
            FOR JSON PATH
        ) AS Detalles
    FROM INVENTARIO.Traslado T
    INNER JOIN INVENTARIO.TrasladoDetalle TD ON TD.IdTraslado = T.IdTraslado
    INNER JOIN INVENTARIO.Bodega BO ON BO.IdBodega = T.IdBodegaOrigen
    INNER JOIN INVENTARIO.Bodega BD ON BD.IdBodega = T.IdBodegaDestino
    WHERE 
        T.Fecha BETWEEN @FechaInicio AND @FechaFin
        AND T.Eliminado = 0
    ORDER BY T.IdTraslado DESC;
END

GO

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO
CREATE   PROCEDURE [REPORTES].[sp_Reporte_Venta]
    @IdVenta BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    -- ENCABEZADO
    SELECT 
        V.IdVenta,
        V.NumeroVenta,
		FORMAT(V.Fecha, 'dd-MM-yyyy') AS Fecha,
        FORMAT(V.FechaCreacion, 'dd-MM-yyyy HH:mm') AS FechaCreacion,
        CONCAT(
            ISNULL(P.Nombre1, ''), ' ', ISNULL(P.Nombre2, ''), ' ',
            ISNULL(P.Apellido1, ''), ' ', ISNULL(P.Apellido2, '')
        ) AS Cliente,
        P.Direccion,
        P.Celular,
        S.Nombre AS Sucursal,
        B.Nombre AS Bodega,
        CONCAT(PE.Nombre1, ' ', ISNULL(PE.Nombre2, ''), ' ', PE.Apellido1, ' ', ISNULL(PE.Apellido2, ''))AS Empleado,
        T.Codigo AS Termino,
        EC.Codigo AS EstadoCXC,
        ES.Descripcion AS Estado,
        V.Subtotal,
        V.Descuento,
        V.Impuestos,
        (V.Subtotal - V.Descuento + V.Impuestos) AS Total
    FROM VENTAS.Venta V
    LEFT JOIN CATALOGOS.Cliente C ON C.IdCliente = V.IdCliente
    LEFT JOIN GENERAL.Persona P ON P.IdPersona = C.IdPersona
    LEFT JOIN INVENTARIO.Bodega B ON B.IdBodega = V.IdBodega
	LEFT JOIN CATALOGOS.Sucursal S ON S.IdSucursal = B.IdSucursal
    LEFT JOIN RRHH.Empleado E ON E.IdEmpleado = V.IdEmpleado
	LEFT JOIN GENERAL.Persona PE ON PE.IdPersona = E.IdPersona
    LEFT JOIN CATALOGOS.Termino T ON T.IdTermino = V.IdTermino
    LEFT JOIN CATALOGOS.EstadoCxc EC ON EC.IdEstadoCxc = V.IdEstadoCxc
    LEFT JOIN SEGURIDAD.Usuario U ON U.IdUsuario = V.CreadoPor
    LEFT JOIN CATALOGOS.Estado ES ON ES.IdEstado = V.IdEstado
    WHERE V.IdVenta = @IdVenta
    -- DETALLE
    SELECT 
        D.IdVentaDetalle,
        PR.Codigo,
        PR.Descripcion,
        D.Cantidad,
        D.PrecioUnitario,
        D.Descuento,
        D.Subtotal
    FROM VENTAS.VentaDetalle D
    JOIN INVENTARIO.Producto PR ON PR.IdProducto = D.IdProducto
    WHERE D.IdVenta = @IdVenta AND D.Eliminado = 0
    ORDER BY D.IdVentaDetalle;
END

GO

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO
CREATE   PROCEDURE [REPORTES].[sp_Reporte_VentaPorUsuario]
    @IdUsuario INT,
    @FechaDesde DATETIME,
    @FechaHasta DATETIME,
    @IdSucursal INT
AS
BEGIN
    SET NOCOUNT ON;

    -- ENCABEZADOS DE VENTA
    SELECT 
        V.IdVenta,
        V.NumeroVenta,
        FORMAT(V.Fecha, 'yyyy-MM-dd HH:mm') AS Fecha,
        CONCAT(P.Nombre1, ' ', ISNULL(P.Nombre2, ''), ' ', P.Apellido1, ' ', ISNULL(P.Apellido2, '')) AS Cliente,
        P.Direccion,
        P.Celular,
        S.Nombre AS SucursalCliente,
        B.Nombre AS Bodega,
        SU.Nombre AS SucursalUsuario,
        E.Puesto AS AtendidoPor,
        T.Codigo AS Termino,
        EC.Codigo AS EstadoCXC,
        V.Subtotal,
        V.Descuento,
        V.Impuestos,
        V.Total
    FROM VENTAS.Venta V
    JOIN CATALOGOS.Cliente C ON C.IdCliente = V.IdCliente
    JOIN GENERAL.Persona P ON P.IdPersona = C.IdPersona
    JOIN CATALOGOS.Sucursal S ON S.IdSucursal = C.IdSucursal
    JOIN INVENTARIO.Bodega B ON B.IdBodega = V.IdBodega
    JOIN RRHH.Empleado E ON E.IdEmpleado = V.IdEmpleado
    JOIN SEGURIDAD.Usuario U ON U.IdUsuario = V.CreadoPor
    JOIN RRHH.Empleado EU ON EU.IdEmpleado = U.IdEmpleado
    JOIN CATALOGOS.Sucursal SU ON SU.IdSucursal = EU.IdSucursal
    JOIN CATALOGOS.Termino T ON T.IdTermino = V.IdTermino
    JOIN CATALOGOS.EstadoCxc EC ON EC.IdEstadoCxc = V.IdEstadoCxc
    WHERE 
        V.Eliminado = 0 AND
        V.CreadoPor = @IdUsuario AND
        V.Fecha >= @FechaDesde AND V.Fecha < DATEADD(DAY, 1, @FechaHasta) AND
        SU.IdSucursal = @IdSucursal;

    -- DETALLE DE VENTA
    SELECT 
        D.IdVentaDetalle,
        D.IdVenta,
        PR.Codigo,
        PR.Descripcion,
        D.Cantidad,
        D.PrecioUnitario,
        D.Descuento,
        D.Subtotal
    FROM VENTAS.VentaDetalle D
    JOIN INVENTARIO.Producto PR ON PR.IdProducto = D.IdProducto
    JOIN VENTAS.Venta V ON V.IdVenta = D.IdVenta
    JOIN SEGURIDAD.Usuario U ON U.IdUsuario = V.CreadoPor
    JOIN RRHH.Empleado EU ON EU.IdEmpleado = U.IdEmpleado
    WHERE 
        D.Eliminado = 0 AND
        V.CreadoPor = @IdUsuario AND
        V.Fecha >= @FechaDesde AND V.Fecha < DATEADD(DAY, 1, @FechaHasta) AND
        EU.IdSucursal = @IdSucursal
    ORDER BY D.IdVenta, D.IdVentaDetalle;
END

GO

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO
CREATE   PROCEDURE [REPORTES].[sp_Reporte_Venta_FECHA]
    @FechaDesde DATETIME,
    @FechaHasta DATETIME
AS
BEGIN
    SET NOCOUNT ON;

    -- ENCABEZADOS DE VENTA
    SELECT 
        V.IdVenta,
        V.NumeroVenta,
        FORMAT(V.Fecha, 'yyyy-MM-dd HH:mm') AS Fecha,
        CONCAT(P.Nombre1, ' ', ISNULL(P.Nombre2, ''), ' ', P.Apellido1, ' ', ISNULL(P.Apellido2, '')) AS Cliente,
        P.Direccion,
        P.Celular,
        S.Nombre AS Sucursal,
        B.Nombre AS Bodega,
        E.Puesto AS AtendidoPor,
        T.Codigo AS Termino,
        EC.Codigo AS EstadoCXC,
        V.Subtotal,
        V.Descuento,
        V.Impuestos,
        V.Total
    FROM VENTAS.Venta V
    JOIN CATALOGOS.Cliente C ON C.IdCliente = V.IdCliente
    JOIN GENERAL.Persona P ON P.IdPersona = C.IdPersona
    JOIN CATALOGOS.Sucursal S ON S.IdSucursal = C.IdSucursal
    JOIN INVENTARIO.Bodega B ON B.IdBodega = V.IdBodega
    JOIN RRHH.Empleado E ON E.IdEmpleado = V.IdEmpleado
    JOIN CATALOGOS.Termino T ON T.IdTermino = V.IdTermino
    JOIN CATALOGOS.EstadoCxc EC ON EC.IdEstadoCxc = V.IdEstadoCxc
    WHERE 
        V.Eliminado = 0 AND
        V.Fecha >= @FechaDesde AND V.Fecha < DATEADD(DAY, 1, @FechaHasta);

    -- DETALLE DE VENTA
    SELECT 
        D.IdVentaDetalle,
        D.IdVenta,
        PR.Codigo,
        PR.Descripcion,
        D.Cantidad,
        D.PrecioUnitario,
        D.Descuento,
        D.Subtotal
    FROM VENTAS.VentaDetalle D
    JOIN INVENTARIO.Producto PR ON PR.IdProducto = D.IdProducto
    JOIN VENTAS.Venta V ON V.IdVenta = D.IdVenta
    WHERE 
        D.Eliminado = 0 AND
        V.Fecha >= @FechaDesde AND V.Fecha < DATEADD(DAY, 1, @FechaHasta)
    ORDER BY D.IdVenta, D.IdVentaDetalle;
END

GO

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO
CREATE PROCEDURE [SEGURIDAD].[sp_ObtenerEmpleadosConUsuario]
AS
BEGIN
    SELECT
        E.IdEmpleado AS Id,
        CONCAT(P.Nombre1, ' ', ISNULL(P.Nombre2, ''), ' ', P.Apellido1, ' ', ISNULL(P.Apellido2, '')) AS Name
    FROM RRHH.Empleado E
    INNER JOIN GENERAL.Persona P ON P.IdPersona = E.IdPersona
    WHERE 
        E.Eliminado = 0
        AND P.Eliminado = 0
        AND E.IdEmpleado IN (
            SELECT IdEmpleado FROM SEGURIDAD.Usuario WHERE Eliminado = 0 AND IdEmpleado IS NOT NULL
        )
    ORDER BY E.IdEmpleado DESC
END

GO

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO
CREATE PROCEDURE SEGURIDAD.sp_ObtenerEmpleadosSinUsuario
AS
BEGIN
    SELECT
        E.IdEmpleado,
        CONCAT(P.Nombre1, ' ', ISNULL(P.Nombre2, ''), ' ', P.Apellido1, ' ', ISNULL(P.Apellido2, '')) AS NombreCompleto
    FROM RRHH.Empleado E
    INNER JOIN GENERAL.Persona P ON P.IdPersona = E.IdPersona
    WHERE 
        E.Eliminado = 0
        AND P.Eliminado = 0
        AND E.IdEmpleado NOT IN (
            SELECT IdEmpleado FROM SEGURIDAD.Usuario WHERE Eliminado = 0 AND IdEmpleado IS NOT NULL
        )
    ORDER BY E.IdEmpleado DESC
END

GO

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO
CREATE PROCEDURE [SEGURIDAD].[sp_ObtenerUsuarios]
AS
BEGIN
	SELECT
	U.IdUsuario,
	U.Login as Usuario,
	CONCAT(P.Nombre1, ' ', ISNULL(P.Nombre2, ''), ' ', P.Apellido1, ' ', ISNULL(P.Apellido2, '')) AS NombreCompleto,
	U.Activo,
	E.IdEmpleado

	FROM SEGURIDAD.Usuario U
	LEFT JOIN RRHH.Empleado E ON U.IdEmpleado = E.IdEmpleado
	LEFT JOIN GENERAL.Persona P ON P.IdPersona = E.IdPersona
	WHERE U.Eliminado = 0
	ORDER BY U.IdUsuario DESC

END
GO

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO
CREATE   PROCEDURE VENTAS.sp_AnularFactura
    @IdVenta BIGINT,
    @IdUsuario INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        -- Validar si ya fue anulada
        IF EXISTS (
            SELECT 1
            FROM VENTAS.Venta
            WHERE IdVenta = @IdVenta AND Eliminado = 1
        )
        BEGIN
            RAISERROR('La factura ya fue anulada.', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        -- Obtener datos de la factura
        DECLARE @IdBodega INT, @Fecha DATETIME, @NumeroVenta NVARCHAR(25);
        SELECT @IdBodega = IdBodega, @Fecha = Fecha, @NumeroVenta = NumeroVenta
        FROM VENTAS.Venta
        WHERE IdVenta = @IdVenta;

        -- Marcar encabezado como eliminado
        UPDATE VENTAS.Venta
        SET Eliminado = 1,
            EliminadoPor = @IdUsuario,
            FechaEliminacion = SYSDATETIME()
        WHERE IdVenta = @IdVenta;

        -- Marcar detalle como eliminado
        UPDATE VENTAS.VentaDetalle
        SET Eliminado = 1,
            EliminadoPor = @IdUsuario,
            FechaEliminacion = SYSDATETIME()
        WHERE IdVenta = @IdVenta;

        -- Obtener el IdTipoMov para "ANULACION VENTA"
        DECLARE @IdTipoMov INT;
        SELECT @IdTipoMov = IdTipoMov
        FROM CATALOGOS.TipoMovimientoInventario
        WHERE Nombre = 'ANULACION DE VENTA' AND Eliminado = 0;

        IF @IdTipoMov IS NULL
        BEGIN
            RAISERROR('No se encontró el tipo de movimiento "ANULACION VENTA".', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        -- Insertar movimientos inversos en Kardex
        INSERT INTO INVENTARIO.Kardex (
            IdProducto, IdBodega, Fecha, IdTipoMov, Cantidad, CostoUnit,
            Observacion, ReferenciaId, CreadoPor, FechaCreacion, Eliminado
        )
        SELECT 
            VD.IdProducto,
            @IdBodega,
            SYSDATETIME(),
            @IdTipoMov,
            VD.Cantidad,
            VD.PrecioUnitario, -- Asumimos como costo de reverso el precio de venta
            CONCAT('Anulación de factura ', @NumeroVenta),
            @IdVenta,
            @IdUsuario,
            SYSDATETIME(),
            0
        FROM VENTAS.VentaDetalle VD
        WHERE VD.IdVenta = @IdVenta;

		UPDATE E
        SET 
            E.Stock = E.Stock + VD.Cantidad,
            E.ModificadoPor = @IdUsuario,
            E.FechaModificacion = SYSDATETIME()
        FROM INVENTARIO.Existencia E
        INNER JOIN VENTAS.VentaDetalle VD ON E.IdProducto = VD.IdProducto
        WHERE VD.IdVenta = @IdVenta AND E.IdBodega = @IdBodega;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO
CREATE   PROCEDURE [VENTAS].[sp_AnularPedido]
    @IdPedido BIGINT,
    @IdUsuario INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        -- Validar si ya fue anulada
        IF EXISTS (
            SELECT 1
            FROM VENTAS.Pedido
            WHERE IdPedido = @IdPedido AND Eliminado = 1
        )
        BEGIN
            RAISERROR('El pedido ya fue anulado.', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        -- Obtener datos de la factura
        DECLARE @IdBodega INT, @Fecha DATETIME, @NumeroPedido NVARCHAR(25);
        SELECT @IdBodega = IdBodega, @Fecha = FechaPedido, @NumeroPedido = NumeroPedido
        FROM VENTAS.Pedido
        WHERE IdPedido = @IdPedido;

        -- Marcar encabezado como eliminado
        UPDATE VENTAS.Pedido
        SET Eliminado = 1,
            EliminadoPor = @IdUsuario,
            FechaEliminacion = SYSDATETIME()
        WHERE IdPedido = @IdPedido;

        -- Marcar detalle como eliminado
        UPDATE VENTAS.PedidoDetalle
        SET Eliminado = 1,
            EliminadoPor = @IdUsuario,
            FechaEliminacion = SYSDATETIME()
        WHERE IdPedido = @IdPedido;
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO
CREATE PROCEDURE [VENTAS].[sp_Pedido_ConvertirAVenta]
    @IdPedido BIGINT,
    @IdUsuario INT
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRAN;

        -- Obtener datos del pedido
        DECLARE 
            @IdCliente INT,
            @IdEmpleado INT,
            @IdBodega INT,
            @FechaPedido DATETIME2,
            @IdTermino SMALLINT,
            @Subtotal DECIMAL(18,4),
            @Descuento DECIMAL(18,4),
			@IdEstadoPedido SMALLINT,
			@IdEstadoVenta SMALLINT,
            @Impuestos DECIMAL(18,4);

        SELECT 
            @IdCliente = IdCliente,
            @IdEmpleado = IdEmpleado,
            @IdBodega = IdBodega,
            @FechaPedido = FechaPedido,
            @IdTermino = IdTermino,
            @Subtotal = Subtotal,
            @Descuento = Descuento,
            @Impuestos = Impuestos
        FROM VENTAS.Pedido
        WHERE IdPedido = @IdPedido;

        -- VALIDACIÓN DE STOCK
        DECLARE @ProductosInvalidos NVARCHAR(MAX);

        SELECT @ProductosInvalidos = STRING_AGG(ISNULL(P.Referencia, 'SIN REFERENCIA'), ', ')
        FROM VENTAS.PedidoDetalle D
        LEFT JOIN INVENTARIO.Existencia E ON E.IdProducto = D.IdProducto AND E.IdBodega = @IdBodega
        INNER JOIN INVENTARIO.Producto P ON D.IdProducto = P.IdProducto
        WHERE D.IdPedido = @IdPedido AND (E.IdProducto IS NULL OR E.Stock < D.Cantidad);

        IF @ProductosInvalidos IS NOT NULL AND LEN(@ProductosInvalidos) > 0
        BEGIN
            DECLARE @MensajeError NVARCHAR(MAX) = 'Los siguientes productos no tienen suficiente stock o no existen en la bodega: ' + @ProductosInvalidos;
            THROW 50001, @MensajeError, 1;
        END

        -- Insertar venta
        DECLARE @IdVenta BIGINT;
		DECLARE @Consecutivo BIGINT;
		DECLARE @CodigoSucursal NVARCHAR(20);

		SET @CodigoSucursal = (SELECT TOP 1 CodigoSucursal
		FROM CATALOGOS.Sucursal WHERE IdSucursal = (SELECT IdSucursal FROM INVENTARIO.Bodega WHERE IdBodega = @IdBodega));

		UPDATE ADMIN.Consecutivos
		SET ValorActual = ValorActual + 1
		WHERE Entidad = 'VENTA';

		SELECT @Consecutivo = ValorActual
		FROM ADMIN.Consecutivos
		WHERE Entidad = 'VENTA';

		SET @IdEstadoPedido = (SELECT IdEstadoPedido FROM CATALOGOS.EstadoPedido WHERE Codigo = 'FACTUR');
		SET @IdEstadoVenta = (SELECT IdEstado FROM CATALOGOS.Estado WHERE Codigo = 'FACT_PENDIENTE');

		DECLARE @NumeroVenta NVARCHAR(20) = @CodigoSucursal + '-' + RIGHT(REPLICATE('0', 9) + CAST(@Consecutivo AS VARCHAR), 9);

        INSERT INTO VENTAS.Venta (
            NumeroVenta, IdCliente, IdEmpleado, IdBodega, Fecha,
            Subtotal, Descuento, Impuestos,
            IdTermino, IdEstado, IdEstadoCxc,
            IdPedidoOrigen, CreadoPor, FechaCreacion
        )
        VALUES (
            @NumeroVenta, @IdCliente, @IdEmpleado, @IdBodega, @FechaPedido,
            @Subtotal, @Descuento, @Impuestos,
            @IdTermino, @IdEstadoVenta, 1,
            @IdPedido, @IdUsuario, SYSDATETIME()
        );

        SET @IdVenta = SCOPE_IDENTITY();

        -- Insertar detalle de la venta
        INSERT INTO VENTAS.VentaDetalle (
            IdVenta, IdProducto, Cantidad, PrecioUnitario, Descuento,
            CreadoPor, FechaCreacion
        )
        SELECT 
            @IdVenta, IdProducto, Cantidad, PrecioUnitario, Descuento,
            @IdUsuario, SYSDATETIME()
        FROM VENTAS.PedidoDetalle
        WHERE IdPedido = @IdPedido;

        -- Actualizar existencia
        UPDATE E
        SET 
            E.Stock = E.Stock - D.Cantidad,
            E.ModificadoPor = @IdUsuario,
            E.FechaModificacion = SYSDATETIME()
        FROM INVENTARIO.Existencia E
        INNER JOIN VENTAS.PedidoDetalle D ON D.IdProducto = E.IdProducto
        WHERE D.IdPedido = @IdPedido AND E.IdBodega = @IdBodega;

        -- Insertar en Kardex
        INSERT INTO INVENTARIO.Kardex (
            IdBodega, IdProducto, IdTipoMov, ReferenciaId, Fecha,
            Cantidad, CostoUnit, Observacion,
            CreadoPor, FechaCreacion
        )
        SELECT 
            @IdBodega, IdProducto, 7, @IdVenta, @FechaPedido,
            -Cantidad, PrecioUnitario, CONCAT('Venta desde Pedido ', @IdPedido),
            @IdUsuario, SYSDATETIME()
        FROM VENTAS.PedidoDetalle
        WHERE IdPedido = @IdPedido;

		-- Actualizar estado del pedido
		UPDATE VENTAS.Pedido
		SET IdEstadoPedido = @IdEstadoPedido
		WHERE IdPedido = @IdPedido;

        COMMIT;
    END TRY
    BEGIN CATCH
        ROLLBACK;
        THROW;
    END CATCH
END

GO

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

CREATE   PROCEDURE [VENTAS].[sp_Pedido_Insertar]
    @IdCliente INT,
    @IdEmpleado INT,
    @IdSucursal INT,
    @Fecha DATETIME2,
    @IdTermino SMALLINT,
    @Observacion NVARCHAR(250) = NULL,
    @UsuarioId INT,
    @Detalles VENTAS.TipoVentaDetalle READONLY
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRAN;

		DECLARE @CodigoSucursal NVARCHAR(10);
		DECLARE @IdBodega INT
		
		SET @IdBodega = (
		SELECT TOP 1 IdBodega FROM INVENTARIO.Bodega where IdSucursal = @IdSucursal
		AND Eliminado = 0 AND EsPrincipal = 1)

		IF @IdBodega IS NULL
		BEGIN
			THROW 50002, 'No se encontró una bodega principal activa para esta sucursal.', 1;
		END

		SELECT @CodigoSucursal = CodigoSucursal
		FROM CATALOGOS.Sucursal
		WHERE IdSucursal = @IdSucursal;

		IF @CodigoSucursal IS NULL
		BEGIN
			THROW 50003, 'No se encontró el código de la sucursal.', 1;
		END

		DECLARE @Consecutivo BIGINT;

		UPDATE ADMIN.Consecutivos
		SET ValorActual = ValorActual + 1
		WHERE Entidad = 'PEDIDO';

		SELECT @Consecutivo = ValorActual
		FROM ADMIN.Consecutivos
		WHERE Entidad = 'PEDIDO';

		DECLARE @NumeroVenta NVARCHAR(20);
		SET @NumeroVenta = @CodigoSucursal + '-' + RIGHT(REPLICATE('0', 9) + CAST(@Consecutivo AS VARCHAR), 9);
        -- Calcular montos
        DECLARE @Subtotal DECIMAL(18,4), @Descuento DECIMAL(18,4);
        SELECT 
            @Subtotal = SUM(Cantidad * PrecioUnitario),
            @Descuento = SUM(Descuento)
        FROM @Detalles;

		DECLARE @IdEstadoPedido SMALLINT;

		SET @IdEstadoPedido = (SELECT TOP(1) IdEstadoPedido
		FROM CATALOGOS.EstadoPedido
		WHERE Codigo = 'SINFAC')

        -- Insertar encabezado del pedido
        DECLARE @IdPedido BIGINT;
        INSERT INTO VENTAS.Pedido (
            IdCliente, IdEmpleado, IdBodega, FechaPedido,
            Subtotal, Descuento, Impuestos,
            IdTermino, Observacion,
            CreadoPor, FechaCreacion, NumeroPedido, IdEstadoPedido
        )
        VALUES (
            @IdCliente, @IdEmpleado, @IdBodega, @Fecha,
            @Subtotal, @Descuento, 0,
             @IdTermino, @Observacion,
            @UsuarioId, SYSDATETIME(), @NumeroVenta, @IdEstadoPedido
        );
        SET @IdPedido = SCOPE_IDENTITY();

        -- Insertar detalles
        INSERT INTO VENTAS.PedidoDetalle (
            IdPedido, IdProducto, Cantidad, PrecioUnitario, Descuento,
            CreadoPor, FechaCreacion
        )
        SELECT 
            @IdPedido, IdProducto, Cantidad, PrecioUnitario, Descuento,
            @UsuarioId, SYSDATETIME()
        FROM @Detalles;

        COMMIT;
		SELECT @IdPedido AS IdPedido
    END TRY
    BEGIN CATCH
        ROLLBACK;
        THROW;
    END CATCH
END
GO

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO
-- Snapshot inspected on 2026-10-11. Apply only after reviewing existing schema.
CREATE   PROCEDURE [VENTAS].[sp_Venta_Insertar_Optimizado]
    @IdCliente INT,
    @IdEmpleado INT,
    @IdSucursal INT,
    @Fecha DATETIME2,
    @IdTermino SMALLINT,
    @UsuarioId INT,
	@Observacion NVARCHAR(250) = NULL,
    @Detalles VENTAS.TipoVentaDetalle READONLY
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT IdProducto FROM @Detalles GROUP BY IdProducto HAVING COUNT(*) > 1)
        THROW 50004, 'Cada producto debe aparecer una sola vez.', 1;

    BEGIN TRY
        BEGIN TRAN;
		 DECLARE @ProductosInvalidos NVARCHAR(MAX) = '';
		 DECLARE @IdBodega INT
		
		SET @IdBodega = (
		SELECT TOP 1 IdBodega FROM INVENTARIO.Bodega where IdSucursal = @IdSucursal
		AND Eliminado = 0 AND Activo = 1 AND EsPrincipal = 1)

		IF @IdBodega IS NULL
		BEGIN
			THROW 50002, 'No se encontró una bodega principal activa para esta sucursal.', 1;
		END


		SELECT @ProductosInvalidos = STRING_AGG(ISNULL(P.Referencia, 'SIN REFERENCIA'), ', ')
		FROM @Detalles D
		LEFT JOIN INVENTARIO.Existencia E WITH (UPDLOCK, HOLDLOCK) ON E.IdProducto = D.IdProducto AND E.IdBodega = @IdBodega
		INNER JOIN INVENTARIO.Producto P ON D.IdProducto = P.IdProducto
		WHERE E.IdProducto IS NULL OR E.Stock < D.Cantidad;

		IF @ProductosInvalidos IS NOT NULL AND LEN(@ProductosInvalidos) > 0
		BEGIN
			DECLARE @MensajeError NVARCHAR(MAX) = 'Los siguientes productos no tienen suficiente stock o no existen en la bodega: ' + @ProductosInvalidos;
			THROW 50001, @MensajeError, 1;
		END

		DECLARE @CodigoSucursal NVARCHAR(10);
		SELECT @CodigoSucursal = CodigoSucursal
		FROM CATALOGOS.Sucursal
		WHERE IdSucursal = @IdSucursal;

		IF @CodigoSucursal IS NULL
		BEGIN
			THROW 50003, 'No se encontró el código de la sucursal.', 1;
		END

		DECLARE @Consecutivo BIGINT;

		UPDATE ADMIN.Consecutivos
		SET ValorActual = ValorActual + 1
		WHERE Entidad = 'VENTA';

		SELECT @Consecutivo = ValorActual
		FROM ADMIN.Consecutivos
		WHERE Entidad = 'VENTA';

		DECLARE @NumeroVenta NVARCHAR(20);
		SET @NumeroVenta = @CodigoSucursal + '-' + RIGHT(REPLICATE('0', 9) + CAST(@Consecutivo AS VARCHAR), 9);
        -- Calcular montos
        DECLARE @Subtotal DECIMAL(18,4), @Descuento DECIMAL(18,4);
        SELECT 
            @Subtotal = SUM(Cantidad * PrecioUnitario),
            @Descuento = SUM(Descuento)
        FROM @Detalles;

        -- Insertar encabezado
        DECLARE @IdVenta BIGINT;
        INSERT INTO VENTAS.Venta (
            NumeroVenta, IdCliente, IdEmpleado, IdBodega, Fecha,
            Subtotal, Descuento, Impuestos, IdTermino, IdEstado, IdEstadoCxc,
            CreadoPor, FechaCreacion, Observacion
        )
        VALUES (
            @NumeroVenta, @IdCliente, @IdEmpleado, @IdBodega, @Fecha,
            @Subtotal, @Descuento, 0, @IdTermino, 1, 3,
            @UsuarioId, SYSDATETIME(), @Observacion
        );

        SET @IdVenta = SCOPE_IDENTITY();

        -- Insertar detalles
        INSERT INTO VENTAS.VentaDetalle (
            IdVenta, IdProducto, Cantidad, PrecioUnitario, Descuento,
            CreadoPor, FechaCreacion
        )
        SELECT 
            @IdVenta, IdProducto, Cantidad, PrecioUnitario, Descuento,
            @UsuarioId, SYSDATETIME()
        FROM @Detalles;

        -- Actualizar existencia
        UPDATE E
        SET 
            E.Stock = E.Stock - D.Cantidad,
            E.ModificadoPor = @UsuarioId,
            E.FechaModificacion = SYSDATETIME()
        FROM INVENTARIO.Existencia E
        INNER JOIN @Detalles D ON D.IdProducto = E.IdProducto
        WHERE E.IdBodega = @IdBodega;

        -- Insertar en Kardex
        INSERT INTO INVENTARIO.Kardex (
            IdBodega, IdProducto, IdTipoMov, ReferenciaId, Fecha,
            Cantidad, CostoUnit, Observacion,
            CreadoPor, FechaCreacion
        )
        SELECT 
            @IdBodega, IdProducto, 7, @IdVenta, @Fecha,
            -Cantidad, PrecioUnitario, CONCAT('Venta ', @NumeroVenta),
            @UsuarioId, SYSDATETIME()
        FROM @Detalles;

        COMMIT;

		SELECT @IdVenta AS IdVenta
    END TRY
    BEGIN CATCH
        ROLLBACK;
        THROW;
    END CATCH
END

GO
