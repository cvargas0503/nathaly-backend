SET XACT_ABORT ON;
BEGIN TRANSACTION;
IF OBJECT_ID('INVENTARIO.Ajuste') IS NULL OR OBJECT_ID('INVENTARIO.AjusteDetalle') IS NULL
  THROW 51000, 'Se requiere el esquema inicial INVENTARIO.Ajuste/AjusteDetalle', 1;
IF NOT EXISTS (SELECT 1 FROM CATALOGOS.TipoMovimientoInventario WHERE Nombre='AJUSTE_ENTRADA' AND Eliminado=0)
BEGIN
  DECLARE @Usuario int=(SELECT MIN(IdUsuario) FROM SEGURIDAD.Usuario WHERE Activo=1 AND Eliminado=0);
  IF @Usuario IS NULL THROW 51000, 'Se requiere un usuario activo para atribuir el seed', 1;
  INSERT INTO CATALOGOS.TipoMovimientoInventario (Nombre,Descripcion,Signo,CreadoPor,FechaCreacion,Eliminado)
    VALUES ('AJUSTE_ENTRADA','Entrada por ajuste físico',1,@Usuario,SYSUTCDATETIME(),0);
END;
IF NOT EXISTS (SELECT 1 FROM CATALOGOS.TipoMovimientoInventario WHERE Nombre='AJUSTE_SALIDA' AND Eliminado=0)
BEGIN
  DECLARE @UsuarioSalida int=(SELECT MIN(IdUsuario) FROM SEGURIDAD.Usuario WHERE Activo=1 AND Eliminado=0);
  IF @UsuarioSalida IS NULL THROW 51000, 'Se requiere un usuario activo para atribuir el seed', 1;
  INSERT INTO CATALOGOS.TipoMovimientoInventario (Nombre,Descripcion,Signo,CreadoPor,FechaCreacion,Eliminado)
    VALUES ('AJUSTE_SALIDA','Salida por ajuste físico',-1,@UsuarioSalida,SYSUTCDATETIME(),0);
END;
COMMIT;
GO
IF NOT EXISTS (SELECT 1 FROM SEGURIDAD.Permiso WHERE Codigo='REGISTRAR_AJUSTES')
  INSERT INTO SEGURIDAD.Permiso (Codigo,Nombre,Descripcion,Activo,Eliminado,FechaCreacion) VALUES ('REGISTRAR_AJUSTES','REGISTRAR_AJUSTES','Permiso de feature f01',1,0,SYSUTCDATETIME());
GO
IF NOT EXISTS (SELECT 1 FROM SEGURIDAD.Permiso WHERE Codigo='VER_AJUSTES')
  INSERT INTO SEGURIDAD.Permiso (Codigo,Nombre,Descripcion,Activo,Eliminado,FechaCreacion) VALUES ('VER_AJUSTES','VER_AJUSTES','Permiso de feature f01',1,0,SYSUTCDATETIME());
GO
