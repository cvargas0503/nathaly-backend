-- Permiso de consulta. No agrega tablas ni modifica existencias.
IF NOT EXISTS (SELECT 1 FROM SEGURIDAD.Permiso WHERE Codigo='VER_REPOSICION')
  INSERT INTO SEGURIDAD.Permiso (Codigo,Nombre,Descripcion,Activo,Eliminado,FechaCreacion) VALUES ('VER_REPOSICION','VER_REPOSICION','Permiso de feature f05',1,0,SYSUTCDATETIME());
GO
