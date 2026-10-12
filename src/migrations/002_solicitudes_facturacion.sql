-- Run once per environment before deploying the invoicing facade.
SET XACT_ABORT ON;
BEGIN TRANSACTION;
IF SCHEMA_ID('ADMIN') IS NULL EXEC('CREATE SCHEMA ADMIN');
IF OBJECT_ID('ADMIN.SolicitudFacturacion','U') IS NULL
BEGIN
  CREATE TABLE ADMIN.SolicitudFacturacion (
    IdUsuario INT NOT NULL,
    Clave UNIQUEIDENTIFIER NOT NULL,
    IdVenta BIGINT NOT NULL,
    Huella CHAR(64) NOT NULL,
    FechaCreacion DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_SolicitudFacturacion PRIMARY KEY (IdUsuario, Clave),
    CONSTRAINT FK_SolicitudFacturacion_Usuario FOREIGN KEY (IdUsuario) REFERENCES SEGURIDAD.Usuario(IdUsuario),
    CONSTRAINT FK_SolicitudFacturacion_Venta FOREIGN KEY (IdVenta) REFERENCES VENTAS.Venta(IdVenta)
  );
END;
COMMIT;
