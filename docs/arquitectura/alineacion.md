# Alineación con Diseño de Sistemas de Internet

Referencia: Sistema Web de Facturación e Inventario para Tiendas Esther, 16/08/2026, páginas físicas 53–59 (impresas 52–58). Los repositorios conservan Nathaly; esta revisión compara la solución técnica y no presupone que ambas tiendas sean el mismo cliente.

## Decisiones y evidencia

- Cliente–servidor, tres capas lógicas: React → HTTP API Express/TypeScript → SQL Server. No se adoptan microservicios: facturación y stock requieren consistencia y el documento plantea tres tiendas y menos de cien empleados, no métricas verificadas de producción.
- `FacturacionFacade.confirmar` es la entrada del caso de uso. Controlador adapta HTTP; fachada valida y coordina; `SqlTransaccionesFacturacion` proporciona repositorios de solicitudes y facturas y servicio de disponibilidad, asociados a una misma transacción/conexión.
- La escritura de factura, detalles, stock y Kardex conserva `VENTAS.sp_Venta_Insertar_Optimizado`. La fachada no reproduce esas reglas en JavaScript. La lectura del comprobante y el registro de idempotencia ocurren antes del commit exterior. Una falla solicita rollback.
- Disponibilidad usa UPDLOCK/HOLDLOCK y orden de productos estable. La fila de bodega se lee con HOLDLOCK; no se bloquean deliberadamente todas las ventas de una sucursal con UPDLOCK sobre la bodega.
- `Idempotency-Key` UUID obligatorio para POST /api/v1/ventas. Clave acotada al usuario, hash SHA-256 del payload normalizado y registro persistente. Misma clave/datos: 200 con la factura previa; primera ejecución: 201; otros datos: 409. `sp_getapplock` serializa reintentos entre procesos.
- Middleware central verifica permisos activos desde SQL Server. La autorización de la interfaz sólo mejora UX. Consulta global/auditoría/dashboard se restringen a GESTIONAR_USUARIOS al incluir datos agregados. Las consultas de catálogos admiten permisos operativos; su modificación requiere el permiso específico. Revisar la matriz con responsables del negocio antes de producción.
- Logout guarda la huella del token hasta su expiración; el backend y profile rechazan su reutilización. JWT con jti único evita revocar otra sesión emitida en el mismo segundo. No se devuelve el token en JSON.
- Frontend introduce TypeScript en entrada, servicio de ventas y formulario. allowJs permite convivencia con JSX; no equivale a migración total ni validación estricta de todos los componentes.

## Migraciones y despliegue

1. Respaldar base de datos y verificar restauración en un ambiente de QA.
2. Revisar y ejecutar, en orden, `src/migrations/002_solicitudes_facturacion.sql`, `003_revocacion_sesiones.sql` y `004_facturacion_bloqueos.sql`, con la herramienta SQL del administrador. No ejecutar DDL en solicitudes HTTP. Se aplicaron al SQL Server local durante esta revisión.
3. Publicar backend y frontend compatibles juntos: el contrato anterior no enviaba Idempotency-Key. Consumidores externos deben adaptarse.
4. Configurar .env fuera de Git, CORS explícito, HTTPS en proxy, cookies Secure en producción y usuario SQL con privilegios mínimos; separar permisos de migración de los de ejecución.
5. Ejecutar npm ci, npm test y npm run test:integration contra una base LOCAL de QA con catálogos y stock. Estas pruebas crean facturas dentro de transacciones que revierten; pueden consumir identidades y producir huecos en IDs. Nunca ejecutar sobre producción.
6. Verificar integración del proceso de conversión de pedidos, anulación y devoluciones por separado: conservan sus rutas/procedimientos y no usan esta fachada de confirmación directa.
7. Limpiar periódicamente SEGURIDAD.SesionRevocada donde Expira <= SYSUTCDATETIME(). Conservar solicitudes de idempotencia al menos durante la política de reintentos definida; no borrarlas durante reintentos activos.

No desplegar sin las migraciones. En caso de rollback de aplicación, conservar ambas tablas nuevas y restaurar el procedimiento previo desde el respaldo si es necesario; no borrar facturas ni claves registradas.

## Verificación y límites

Pruebas unitarias: validación, orden de coordinación, reintento, conflicto, error de stock, error de reporte, permisos y SQL parametrizado. Integración local: factura/detalle/Kardex, reversión, reintento, stock insuficiente, competencia por locks y seguridad HTTP/sesiones.

Una prueba de bloqueos no acredita tiempos de 3/8 segundos ni diez usuarios completos. Faltan mediciones de carga, pruebas de restauración, verificación HTTPS/despliegue, QA funcional completo y protección efectiva de ramas (issue #10). Las features F01–F05 continúan siendo requerimientos asignables, no funcionalidades terminadas.

FRQ-0021 y FRQ-0022 se referencian en dependencias del PDF, pero sus fichas no aparecen en las páginas de requerimientos revisadas. Resolver esa trazabilidad documental; no inventar fichas originales. Gestión completa de roles y auditoría integral siguen requiriendo validación funcional específica.

## Resultado final de esta revisión

14 pruebas unitarias y 4 de integración aprobadas. Frontend: typecheck/build y lint sin errores (15 advertencias), exportación jsPDF/AutoTable verificada. Audit final: backend 14 avisos (11 altos, 3 moderados); frontend 1 alto (xlsx); cero críticos en ambos. Resolver avisos residuales antes de aprobación productiva.
