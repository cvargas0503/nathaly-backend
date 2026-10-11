# Checklist de liberación a master

- [ ] El PR tiene base `master` y origen `qa` (o hotfix justificado).
- [ ] QA aprobó explícitamente el último SHA del origen y adjuntó evidencia.
- [ ] Features, issues y PRs incluidos están identificados.
- [ ] No entraron cambios nuevos en QA después de su aprobación; si ocurrió, se repitieron las pruebas.
- [ ] Los checks del PR están aprobados y las conversaciones resueltas.
- [ ] Un integrante distinto del autor revisó el candidato.
- [ ] Se documentaron migraciones, orden de aplicación, respaldo de datos y procedimiento de reversión.
- [ ] La configuración del ambiente se distribuye por un medio privado; no hay secretos en el diff.
- [ ] Se acordó el número de versión y se documentaron contratos/limitaciones.
- [ ] Tras el merge, se creó un tag anotado en el SHA de master y se registró la versión.
- [ ] Se abrieron las sincronizaciones necesarias hacia develop/QA y se cerraron los issues terminados.

La creación del tag y la publicación de código no implican despliegue. Registrar por separado si existe un ambiente desplegado, quién lo actualiza y qué SHA ejecuta.
