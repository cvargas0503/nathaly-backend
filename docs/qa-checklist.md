# Checklist de QA por candidato

Copiar a `docs/evidencias/QA-<version>.md` y completar resultados; una casilla vacía no representa aprobación.

- Versión/candidato:
- PR `develop -> qa`:
- SHA exacto de `qa` evaluado:
- Fecha y responsable QA:
- Ambiente y versión SQL Server (sin credenciales):
- Migraciones aplicadas y orden:
- Fixtures utilizados:

| Feature | Caso de aceptación | Resultado esperado | Resultado obtenido | Evidencia | Aprobado por |
| --- | --- | --- | --- | --- | --- |
| F01–F05 | Completar cada caso del documento asignado | Completar | Pendiente | Enlace/archivo | Pendiente |

- [ ] El CI del último SHA pasó (`Validate API`, `Validate branch flow`).
- [ ] Login, perfil y logout siguen funcionando con cookies.
- [ ] Usuarios sin sesión y sin permiso reciben `401`/`403`; no se exponen datos ajenos.
- [ ] SQL parametrizado y validación de IDs, fechas y números comprobados.
- [ ] Ajustes/devoluciones: stock, Kardex y transacciones consistentes; concurrencia real y rollback probados.
- [ ] Notificaciones: lectura individual y privacidad verificadas entre dos usuarios.
- [ ] Auditoría: cambios y eventos son atómicos y los snapshots no incluyen secretos.
- [ ] Reposición: filtros por bodega/proveedor y totales completos comprobados.
- [ ] Migraciones probadas sobre esquema existente, repetición segura cuando corresponda y reversión documentada.
- [ ] Contratos anteriores y endpoints de ventas/caja/catálogos conservan comportamiento esperado.
- [ ] Cada defecto está vinculado a issue/PR; las correcciones se sincronizaron a develop y se revalidó el nuevo SHA.

**Decisión:** pendiente / aprobado / rechazado. **Defectos abiertos y riesgos aceptados:** completar. **SHA autorizado para liberación:** completar. No declarar aprobado mientras haya escenarios críticos no ejecutados o defectos bloqueantes.
