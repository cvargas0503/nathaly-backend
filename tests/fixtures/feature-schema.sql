-- QA only: column contracts from the local schema; no production rows or secrets.
-- External foreign keys and business CHECK constraints are intentionally not reproduced.
CREATE SCHEMA INVENTARIO;
GO
CREATE SCHEMA VENTAS;
GO
CREATE SCHEMA CATALOGOS;
GO
CREATE SCHEMA SEGURIDAD;
GO
CREATE SCHEMA ADMIN;
GO
CREATE TABLE CATALOGOS.Categoria (
[IdCategoria] int IDENTITY(1,1) PRIMARY KEY NOT NULL,
[Nombre] nvarchar(50) NOT NULL,
[Eliminado] bit NULL DEFAULT ((0)),
[CreadoPor] int NULL,
[FechaCreacion] datetime2 NULL DEFAULT (sysdatetime()),
[EliminadoPor] int NULL,
[FechaEliminacion] datetime2 NULL,
[ModificadoPor] int NULL,
[FechaModificacion] datetime2 NULL
);
GO
CREATE TABLE CATALOGOS.Estado (
[IdEstado] smallint IDENTITY(1,1) PRIMARY KEY NOT NULL,
[Codigo] varchar(10) NOT NULL,
[Descripcion] nvarchar(80) NOT NULL,
[Eliminado] bit NULL DEFAULT ((0)),
[CreadoPor] int NOT NULL,
[FechaCreacion] datetime2 NULL DEFAULT (sysdatetime()),
[ModificadoPor] int NULL,
[FechaModificacion] datetime2 NULL,
[EliminadoPor] int NULL,
[FechaEliminacion] datetime2 NULL
);
GO
CREATE TABLE CATALOGOS.Linea (
[IdLinea] int IDENTITY(1,1) PRIMARY KEY NOT NULL,
[Nombre] nvarchar(50) NOT NULL,
[Eliminado] bit NULL DEFAULT ((0)),
[CreadoPor] int NULL,
[FechaCreacion] datetime2 NULL DEFAULT (sysdatetime()),
[EliminadoPor] int NULL,
[FechaEliminacion] datetime2 NULL,
[ModificadoPor] int NULL,
[FechaModificacion] datetime2 NULL
);
GO
CREATE TABLE CATALOGOS.Marca (
[IdMarca] int IDENTITY(1,1) PRIMARY KEY NOT NULL,
[Nombre] nvarchar(50) NOT NULL,
[Eliminado] bit NULL DEFAULT ((0)),
[CreadoPor] int NULL,
[FechaCreacion] datetime2 NULL DEFAULT (sysdatetime()),
[EliminadoPor] int NULL,
[FechaEliminacion] datetime2 NULL,
[ModificadoPor] int NULL,
[FechaModificacion] datetime2 NULL
);
GO
CREATE TABLE CATALOGOS.Proveedor (
[IdProveedor] int IDENTITY(1,1) PRIMARY KEY NOT NULL,
[RazonSocial] nvarchar(150) NOT NULL,
[RUC] nvarchar(30) NOT NULL,
[Direccion] nvarchar(250) NULL,
[Telefono] varchar(20) NULL,
[Email] nvarchar(100) NULL,
[CreadoPor] int NOT NULL,
[FechaCreacion] datetime2 NULL DEFAULT (sysdatetime()),
[ModificadoPor] int NULL,
[FechaModificacion] datetime2 NULL,
[Eliminado] bit NULL DEFAULT ((0)),
[EliminadoPor] int NULL,
[FechaEliminacion] datetime2 NULL,
[Nombre] nvarchar(100) NOT NULL
);
GO
CREATE TABLE CATALOGOS.TipoMovimientoInventario (
[IdTipoMov] smallint IDENTITY(1,1) PRIMARY KEY NOT NULL,
[Descripcion] nvarchar(80) NOT NULL,
[Signo] smallint NOT NULL,
[Eliminado] bit NULL DEFAULT ((0)),
[CreadoPor] int NOT NULL,
[FechaCreacion] datetime2 NULL DEFAULT (sysdatetime()),
[ModificadoPor] int NULL,
[FechaModificacion] datetime2 NULL,
[EliminadoPor] int NULL,
[FechaEliminacion] datetime2 NULL,
[Nombre] nvarchar(80) NOT NULL
);
GO
CREATE TABLE INVENTARIO.Ajuste (
[IdAjuste] bigint IDENTITY(1,1) PRIMARY KEY NOT NULL,
[IdBodega] int NOT NULL,
[Fecha] datetime2 NULL DEFAULT (sysdatetime()),
[Observacion] nvarchar(250) NULL,
[CreadoPor] int NOT NULL,
[FechaCreacion] datetime2 NULL DEFAULT (sysdatetime()),
[ModificadoPor] int NULL,
[FechaModificacion] datetime2 NULL,
[Eliminado] bit NULL DEFAULT ((0)),
[EliminadoPor] int NULL,
[FechaEliminacion] datetime2 NULL
);
GO
CREATE TABLE INVENTARIO.AjusteDetalle (
[IdDetalle] bigint IDENTITY(1,1) PRIMARY KEY NOT NULL,
[IdAjuste] bigint NOT NULL,
[IdProducto] int NOT NULL,
[Cantidad] decimal(18,2) NOT NULL,
[CostoUnit] decimal(18,4) NOT NULL,
[IdTipoMov] smallint NOT NULL,
[CreadoPor] int NOT NULL,
[FechaCreacion] datetime2 NULL DEFAULT (sysdatetime()),
[ModificadoPor] int NULL,
[FechaModificacion] datetime2 NULL,
[Eliminado] bit NULL DEFAULT ((0)),
[EliminadoPor] int NULL,
[FechaEliminacion] datetime2 NULL
);
GO
CREATE TABLE INVENTARIO.Bodega (
[IdBodega] int IDENTITY(1,1) PRIMARY KEY NOT NULL,
[IdSucursal] int NOT NULL,
[CodigoBodega] nvarchar(15) NOT NULL,
[Nombre] nvarchar(100) NOT NULL,
[Descripcion] nvarchar(250) NULL,
[Activo] bit NULL DEFAULT ((1)),
[Eliminado] bit NULL DEFAULT ((0)),
[FechaCreacion] datetime2 NULL DEFAULT (sysdatetime()),
[CreadoPor] int NULL,
[ModificadoPor] int NULL,
[FechaModificacion] datetime2 NULL,
[EliminadoPor] int NULL,
[FechaEliminacion] datetime2 NULL,
[EsPrincipal] bit NULL DEFAULT ((0))
);
GO
CREATE TABLE INVENTARIO.Existencia (
[IdBodega] int NOT NULL,
[IdProducto] int NOT NULL,
[Stock] decimal(18,2) NOT NULL DEFAULT ((0)),
[Eliminado] bit NULL DEFAULT ((0)),
[CreadoPor] int NOT NULL,
[FechaCreacion] datetime2 NULL DEFAULT (sysdatetime()),
[ModificadoPor] int NULL,
[FechaModificacion] datetime2 NULL,
[EliminadoPor] int NULL,
[FechaEliminacion] datetime2 NULL,
PRIMARY KEY(IdBodega,IdProducto)
);
GO
CREATE TABLE INVENTARIO.Kardex (
[IdKardex] bigint IDENTITY(1,1) PRIMARY KEY NOT NULL,
[IdBodega] int NOT NULL,
[IdProducto] int NOT NULL,
[IdTipoMov] smallint NOT NULL,
[ReferenciaId] bigint NULL,
[Fecha] datetime2 NOT NULL DEFAULT (sysdatetime()),
[Cantidad] decimal(18,2) NOT NULL,
[CostoUnit] decimal(18,4) NOT NULL,
[Observacion] nvarchar(250) NULL,
[CreadoPor] int NOT NULL,
[FechaCreacion] datetime2 NULL DEFAULT (sysdatetime()),
[ModificadoPor] int NULL,
[FechaModificacion] datetime2 NULL,
[Eliminado] bit NULL DEFAULT ((0)),
[EliminadoPor] int NULL,
[FechaEliminacion] datetime2 NULL
);
GO
CREATE TABLE INVENTARIO.Producto (
[IdProducto] int IDENTITY(1,1) PRIMARY KEY NOT NULL,
[Codigo] nvarchar(30) NOT NULL,
[Descripcion] nvarchar(150) NOT NULL,
[Costo] decimal(18,4) NOT NULL,
[ExistenciaMin] decimal(18,2) NOT NULL DEFAULT ((0)),
[ExistenciaMax] decimal(18,2) NOT NULL DEFAULT ((0)),
[Eliminado] bit NULL DEFAULT ((0)),
[CreadoPor] int NOT NULL,
[FechaCreacion] datetime2 NULL DEFAULT (sysdatetime()),
[ModificadoPor] int NULL,
[FechaModificacion] datetime2 NULL,
[EliminadoPor] int NULL,
[FechaEliminacion] datetime2 NULL,
[IdLinea] int NOT NULL,
[IdMarca] int NOT NULL,
[IdCategoria] int NOT NULL,
[IdProveedor] int NOT NULL,
[Referencia] nvarchar(50) NOT NULL
);
GO
CREATE TABLE SEGURIDAD.Permiso (
[IdPermiso] int IDENTITY(1,1) PRIMARY KEY NOT NULL,
[Nombre] nvarchar(80) NOT NULL,
[Descripcion] nvarchar(250) NULL,
[Activo] bit NOT NULL DEFAULT ((1)),
[Eliminado] bit NOT NULL DEFAULT ((0)),
[CreadoPor] int NULL,
[FechaCreacion] datetime2 NULL DEFAULT (sysdatetime()),
[ModificadoPor] int NULL,
[FechaModificacion] datetime2 NULL,
[EliminadoPor] int NULL,
[FechaEliminacion] datetime2 NULL
);
GO
CREATE TABLE SEGURIDAD.Usuario (
[IdUsuario] int IDENTITY(1,1) PRIMARY KEY NOT NULL,
[IdEmpleado] int NULL,
[Login] varchar(50) NOT NULL,
[PassHash] nvarchar(100) NOT NULL,
[Activo] bit NULL DEFAULT ((1)),
[Eliminado] bit NULL DEFAULT ((0)),
[FechaCreacion] datetime2 NULL DEFAULT (sysdatetime()),
[FechaModificacion] datetime2 NULL,
[FechaEliminacion] datetime2 NULL,
[CreadoPor] int NULL,
[ModificadoPor] int NULL,
[EliminadoPor] int NULL
);
GO
CREATE TABLE SEGURIDAD.UsuarioPermiso (
[IdUsuario] int NOT NULL,
[IdPermiso] int NOT NULL,
[Permitido] bit NOT NULL,
[Activo] bit NOT NULL DEFAULT ((1)),
[Eliminado] bit NOT NULL DEFAULT ((0)),
[CreadoPor] int NULL,
[FechaCreacion] datetime2 NULL DEFAULT (sysdatetime()),
[ModificadoPor] int NULL,
[FechaModificacion] datetime2 NULL,
[EliminadoPor] int NULL,
[FechaEliminacion] datetime2 NULL
);
GO
CREATE TABLE VENTAS.NotaCredito (
[IdNotaCredito] bigint IDENTITY(1,1) PRIMARY KEY NOT NULL,
[NumeroNC] nvarchar(25) NOT NULL,
[IdVenta] bigint NOT NULL,
[Fecha] datetime2 NULL DEFAULT (sysdatetime()),
[IdEstadoNota] smallint NOT NULL DEFAULT ((1)),
[Motivo] nvarchar(250) NULL,
[Total] decimal(18,4) NOT NULL,
[AprobadoPor] int NULL,
[FechaAprobacion] datetime2 NULL,
[CreadoPor] int NOT NULL,
[FechaCreacion] datetime2 NULL DEFAULT (sysdatetime()),
[ModificadoPor] int NULL,
[FechaModificacion] datetime2 NULL,
[Eliminado] bit NULL DEFAULT ((0)),
[EliminadoPor] int NULL,
[FechaEliminacion] datetime2 NULL
);
GO
CREATE TABLE VENTAS.NotaCreditoDetalle (
[IdNotaDetalle] bigint IDENTITY(1,1) PRIMARY KEY NOT NULL,
[IdNotaCredito] bigint NOT NULL,
[IdVentaDetalle] bigint NOT NULL,
[Cantidad] decimal(18,2) NOT NULL,
[Monto] decimal(18,4) NOT NULL,
[IdMotivoDevol] smallint NOT NULL,
[CreadoPor] int NOT NULL,
[FechaCreacion] datetime2 NULL DEFAULT (sysdatetime()),
[ModificadoPor] int NULL,
[FechaModificacion] datetime2 NULL,
[Eliminado] bit NULL DEFAULT ((0)),
[EliminadoPor] int NULL,
[FechaEliminacion] datetime2 NULL
);
GO
CREATE TABLE VENTAS.Venta (
[IdVenta] bigint IDENTITY(1,1) PRIMARY KEY NOT NULL,
[NumeroVenta] nvarchar(25) NOT NULL,
[IdCliente] int NOT NULL,
[IdEmpleado] int NOT NULL,
[IdBodega] int NOT NULL,
[IdEstado] smallint NOT NULL,
[Fecha] datetime2 NOT NULL,
[Subtotal] decimal(18,4) NOT NULL,
[Descuento] decimal(18,4) NOT NULL DEFAULT ((0)),
[Impuestos] decimal(18,4) NOT NULL DEFAULT ((0)),
[Total] decimal(20,4) NULL,
[IdTermino] smallint NOT NULL,
[IdEstadoCxc] smallint NOT NULL DEFAULT ((1)),
[CreadoPor] int NOT NULL,
[FechaCreacion] datetime2 NULL DEFAULT (sysdatetime()),
[ModificadoPor] int NULL,
[FechaModificacion] datetime2 NULL,
[Eliminado] bit NULL DEFAULT ((0)),
[EliminadoPor] int NULL,
[FechaEliminacion] datetime2 NULL,
[IdPedidoOrigen] bigint NULL,
[Observacion] nvarchar(50) NULL
);
GO
CREATE TABLE VENTAS.VentaDetalle (
[IdVentaDetalle] bigint IDENTITY(1,1) PRIMARY KEY NOT NULL,
[IdVenta] bigint NOT NULL,
[IdProducto] int NOT NULL,
[Cantidad] decimal(18,2) NOT NULL,
[PrecioUnitario] decimal(18,4) NOT NULL,
[Descuento] decimal(18,4) NOT NULL DEFAULT ((0)),
[Subtotal] AS (Cantidad*PrecioUnitario-Descuento),
[ModificadoPor] int NULL,
[FechaModificacion] datetime2 NULL DEFAULT (sysdatetime()),
[Eliminado] bit NULL DEFAULT ((0)),
[EliminadoPor] int NULL,
[FechaEliminacion] datetime2 NULL,
[CreadoPor] int NOT NULL,
[FechaCreacion] datetime2 NULL DEFAULT (sysdatetime())
);
GO
CREATE TABLE ADMIN.Consecutivos (Entidad nvarchar(50) PRIMARY KEY,ValorActual int NOT NULL);
GO
CREATE UNIQUE INDEX UX_QA_NotaCredito_Numero ON VENTAS.NotaCredito(NumeroNC);
GO

-- Security Codigo is part of the API contract, absent from the older local DB inspected.
ALTER TABLE SEGURIDAD.Permiso ADD Codigo nvarchar(50) NOT NULL;
CREATE UNIQUE INDEX UX_QA_Permiso_Codigo ON SEGURIDAD.Permiso(Codigo);
GO
