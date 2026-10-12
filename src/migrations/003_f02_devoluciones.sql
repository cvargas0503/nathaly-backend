SET XACT_ABORT ON;
BEGIN TRANSACTION;
IF OBJECT_ID('ADMIN.SolicitudDevolucion') IS NULL
CREATE TABLE ADMIN.SolicitudDevolucion (
  UsuarioId int NOT NULL,
  Clave varchar(128) COLLATE Latin1_General_100_BIN2 NOT NULL,
  BodyHash char(64) NOT NULL,
  Resultado nvarchar(max) NOT NULL,
  Fecha datetime2 NOT NULL,
  CONSTRAINT PK_SolicitudDevolucion PRIMARY KEY (UsuarioId,Clave),
  CONSTRAINT FK_SolicitudDevolucion_Usuario FOREIGN KEY (UsuarioId) REFERENCES SEGURIDAD.Usuario(IdUsuario),
  CONSTRAINT CK_SolicitudDevolucion_Resultado CHECK (ISJSON(Resultado)=1)
);
COMMIT;
GO
-- Reversión SOLO en BD de pruebas, después de guardar la evidencia:
-- DROP TABLE ADMIN.SolicitudDevolucion;
-- No revertir notas ni stock confirmados por eliminación de esta tabla.
IF NOT EXISTS (SELECT 1 FROM SEGURIDAD.Permiso WHERE Codigo='REGISTRAR_DEVOLUCIONES')
  INSERT INTO SEGURIDAD.Permiso (Codigo,Nombre,Descripcion,Activo,Eliminado,FechaCreacion) VALUES ('REGISTRAR_DEVOLUCIONES','REGISTRAR_DEVOLUCIONES','Permiso de feature f02',1,0,SYSUTCDATETIME());
GO
IF NOT EXISTS (SELECT 1 FROM SEGURIDAD.Permiso WHERE Codigo='VER_DEVOLUCIONES')
  INSERT INTO SEGURIDAD.Permiso (Codigo,Nombre,Descripcion,Activo,Eliminado,FechaCreacion) VALUES ('VER_DEVOLUCIONES','VER_DEVOLUCIONES','Permiso de feature f02',1,0,SYSUTCDATETIME());
GO
