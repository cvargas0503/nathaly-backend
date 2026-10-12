IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_Auditoria_EntidadFechaId' AND object_id=OBJECT_ID('ADMIN.Auditoria'))
  CREATE INDEX IX_Auditoria_EntidadFechaId ON ADMIN.Auditoria(Entidad,Fecha DESC,IdAuditoria DESC);
GO
IF NOT EXISTS (SELECT 1 FROM SEGURIDAD.Permiso WHERE Codigo='VER_AUDITORIA_CATALOGOS')
  INSERT INTO SEGURIDAD.Permiso (Codigo,Nombre,Descripcion,Activo,Eliminado,FechaCreacion) VALUES ('VER_AUDITORIA_CATALOGOS','VER_AUDITORIA_CATALOGOS','Permiso de feature f04',1,0,SYSUTCDATETIME());
GO
