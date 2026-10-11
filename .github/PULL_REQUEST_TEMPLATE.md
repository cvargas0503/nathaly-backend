## Requerimiento y comportamiento

ID de feature/defecto:
Issue relacionado (usar `Closes #N` si se completa):
Rama origen -> destino:
Problema y resultado observable:

## Alcance y compatibilidad

Endpoints/contratos:
Archivos/módulos relevantes:
Migraciones y orden:
Impacto sobre clientes existentes:
Reversión y riesgos:

## Validación

Comandos ejecutados y resultados:
Pruebas de integración SQL Server y fixture:
Evidencias y SHA probado:
Casos no ejecutados y razón:

- [ ] El destino corresponde a feature -> develop, develop -> qa o qa -> master; excepciones justificadas.
- [ ] Cumple los criterios de aceptación del requerimiento.
- [ ] `npm run typecheck`, `npm test` y `npm run build` pasan.
- [ ] Auth/permisos, parámetros SQL, transacciones y concurrencia verificados según el alcance.
- [ ] Sin secretos, datos privados, dumps, uploads, dist ni node_modules.
- [ ] Documentación y migraciones revisadas.
- [ ] Se pidió revisión al compañero asignado.

Para promociones: incluir versión, SHA exacto, features/PRs incluidos y checklist de QA/liberación. No marcar pruebas como ejecutadas si solo se simularon con mocks.
