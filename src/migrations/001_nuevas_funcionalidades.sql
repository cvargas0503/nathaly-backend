-- ============================================================================
-- MIGRACION: Nuevas funcionalidades API Tiendas Nathaly
-- Fecha: 2026-05-16
-- Descripcion: Crea las tablas necesarias para las nuevas funcionalidades
-- ============================================================================

-- 1. Tabla de Tasa de Cambio
IF NOT EXISTS (SELECT * FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id WHERE s.name = 'ADMIN' AND t.name = 'TasaCambio')
BEGIN
    CREATE TABLE ADMIN.TasaCambio (
        IdTasa INT IDENTITY(1,1) PRIMARY KEY,
        Valor DECIMAL(18,4) NOT NULL,
        FechaVigencia DATETIME2 DEFAULT SYSDATETIME(),
        Activa BIT DEFAULT 1,
        CreadoPor INT NOT NULL,
        FechaCreacion DATETIME2 DEFAULT SYSDATETIME()
    );

    -- Insertar tasa por defecto
    INSERT INTO ADMIN.TasaCambio (Valor, Activa, CreadoPor)
    VALUES (37.0000, 1, 1);

    PRINT 'Tabla ADMIN.TasaCambio creada exitosamente';
END
GO

-- 2. Tabla de Auditoría
IF NOT EXISTS (SELECT * FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id WHERE s.name = 'ADMIN' AND t.name = 'Auditoria')
BEGIN
    CREATE TABLE ADMIN.Auditoria (
        IdAuditoria BIGINT IDENTITY(1,1) PRIMARY KEY,
        Entidad NVARCHAR(50) NOT NULL,
        Accion NVARCHAR(20) NOT NULL,
        EntidadId BIGINT NULL,
        Descripcion NVARCHAR(500) NULL,
        DatosAnterior NVARCHAR(MAX) NULL,
        DatosNuevo NVARCHAR(MAX) NULL,
        UsuarioId INT NOT NULL,
        UsuarioLogin NVARCHAR(50) NULL,
        Fecha DATETIME2 DEFAULT SYSDATETIME(),
        IpAddress NVARCHAR(45) NULL
    );

    PRINT 'Tabla ADMIN.Auditoria creada exitosamente';
END
GO

-- 3. Tabla de Notificaciones
IF NOT EXISTS (SELECT * FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id WHERE s.name = 'ADMIN' AND t.name = 'Notificacion')
BEGIN
    CREATE TABLE ADMIN.Notificacion (
        IdNotificacion BIGINT IDENTITY(1,1) PRIMARY KEY,
        Tipo NVARCHAR(30) NOT NULL,
        Titulo NVARCHAR(150) NOT NULL,
        Descripcion NVARCHAR(500) NULL,
        Entidad NVARCHAR(50) NULL,
        EntidadId BIGINT NULL,
        UsuarioId INT NULL,
        Leida BIT DEFAULT 0,
        Fecha DATETIME2 DEFAULT SYSDATETIME()
    );

    PRINT 'Tabla ADMIN.Notificacion creada exitosamente';
END
GO

-- 4. Asegurar que existe el consecutivo de NOTA_CREDITO
IF NOT EXISTS (SELECT 1 FROM ADMIN.Consecutivos WHERE Entidad = 'NOTA_CREDITO')
BEGIN
    INSERT INTO ADMIN.Consecutivos (Entidad, ValorActual) VALUES ('NOTA_CREDITO', 0);
    PRINT 'Consecutivo NOTA_CREDITO creado';
END
GO

PRINT '========================================';
PRINT 'Migración completada exitosamente';
PRINT '========================================';
