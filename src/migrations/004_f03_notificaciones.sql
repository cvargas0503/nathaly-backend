SET XACT_ABORT ON;
IF COL_LENGTH('ADMIN.Notificacion','ClaveCondicion') IS NULL
  ALTER TABLE ADMIN.Notificacion ADD ClaveCondicion nvarchar(150) NULL;
IF COL_LENGTH('ADMIN.Notificacion','Activa') IS NULL
  ALTER TABLE ADMIN.Notificacion ADD Activa bit NOT NULL CONSTRAINT DF_Notificacion_Activa DEFAULT(1);
IF COL_LENGTH('ADMIN.Notificacion','FechaCierre') IS NULL
  ALTER TABLE ADMIN.Notificacion ADD FechaCierre datetime2 NULL;
GO
BEGIN TRANSACTION;
IF OBJECT_ID('ADMIN.NotificacionLectura') IS NULL
CREATE TABLE ADMIN.NotificacionLectura (
  IdNotificacion bigint NOT NULL,
  UsuarioId int NOT NULL,
  FechaLectura datetime2 NOT NULL,
  CONSTRAINT PK_NotificacionLectura PRIMARY KEY (IdNotificacion,UsuarioId),
  CONSTRAINT FK_Lectura_Notificacion FOREIGN KEY (IdNotificacion) REFERENCES ADMIN.Notificacion(IdNotificacion),
  CONSTRAINT FK_Lectura_Usuario FOREIGN KEY (UsuarioId) REFERENCES SEGURIDAD.Usuario(IdUsuario)
);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='UX_Notificacion_CondicionActiva' AND object_id=OBJECT_ID('ADMIN.Notificacion'))
  CREATE UNIQUE INDEX UX_Notificacion_CondicionActiva ON ADMIN.Notificacion(ClaveCondicion) WHERE Activa=1 AND ClaveCondicion IS NOT NULL;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_Notificacion_Visible' AND object_id=OBJECT_ID('ADMIN.Notificacion'))
  CREATE INDEX IX_Notificacion_Visible ON ADMIN.Notificacion(UsuarioId,Activa,Fecha DESC,IdNotificacion DESC);
INSERT INTO ADMIN.NotificacionLectura (IdNotificacion,UsuarioId,FechaLectura)
  SELECT n.IdNotificacion,n.UsuarioId,COALESCE(n.Fecha,SYSUTCDATETIME()) FROM ADMIN.Notificacion n
  WHERE n.UsuarioId IS NOT NULL AND n.Leida=1
    AND NOT EXISTS (SELECT 1 FROM ADMIN.NotificacionLectura l WHERE l.IdNotificacion=n.IdNotificacion AND l.UsuarioId=n.UsuarioId);
COMMIT;
GO
IF NOT EXISTS (SELECT 1 FROM SEGURIDAD.Permiso WHERE Codigo='VER_NOTIFICACIONES')
  INSERT INTO SEGURIDAD.Permiso (Codigo,Nombre,Descripcion,Activo,Eliminado,FechaCreacion) VALUES ('VER_NOTIFICACIONES','VER_NOTIFICACIONES','Permiso de feature f03',1,0,SYSUTCDATETIME());
GO
