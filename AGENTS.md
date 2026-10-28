# AGENTS.md

Reglas obligatorias para cualquier agente de IA o persona que trabaje en `mottor-ai-front`. Síguelas en cada tarea.

## Fuente de verdad: mottor-ai-specs

1. **Lee las specs antes de cualquier tarea.** Abre [mottor-ai-specs](https://github.com/Juanperezc/mottor-ai-specs) y lee:
   - la constitución: `.specify/memory/constitution.md`;
   - la spec de la feature en `specs/<feature>/`: `spec.md`, `plan.md`, `tasks.md` y `fixtures/`.
2. **Sin spec, no hay código.** No escribas código si no lo respaldan un requisito de la spec y una tarea en `tasks.md`.
3. **La spec manda.** Si el código y la spec no coinciden, la spec tiene razón. Detente y propón el cambio como PR a `mottor-ai-specs`. Cambia el código solo después de que se actualice la spec.
4. **Nunca crees specs aquí.** Nada de `spec.md`, `plan.md`, `tasks.md` ni `fixtures/` en este repo. Las specs viven solo en `mottor-ai-specs`.
5. **Respeta el contrato del backend.** La forma de los requests y responses sale del OpenAPI que publica `mottor-ai-back` (`docs/api/openapi.json` en ese repo, o `/docs/api.json` en un backend en ejecución). No agregues, renombres ni elimines campos por tu cuenta; los cambios de contrato se hacen en `mottor-ai-back`.

## Flujo de Git

6. Crea la rama desde `staging`: `feat/`, `fix/`, `refactor/`, `test/`, `docs/`, `chore/`.
7. Usa [Conventional Commits](https://www.conventionalcommits.org/): `<type>(<scope>): <imperative summary>`.
8. Abre el PR a `staging`. El release se hace con un PR de `staging` a `main`. Nunca hagas push directo a `staging` ni a `main`.
9. La descripción de cada PR referencia la spec y las tareas que implementa:

   ```text
   Spec: 001-quotes-mvp
   Tasks: T021, T023
   ```

   Los PR de documentación o de chores sin spec usan `Spec: N/A (docs)` y `Tasks: N/A`.

## Idioma

10. Código, identificadores, comentarios y commits: **inglés**. README y documentación: **español**.
11. Specs en `mottor-ai-specs`: **español**.

## Calidad

12. Mantén los tests en verde. Agrega o actualiza tests con cada cambio de comportamiento, usando los fixtures de la spec como casos de prueba.
13. No bajes la cobertura de tests. Ejecuta el comando de cobertura de `README.md` antes de abrir un PR.
14. Si tienes dudas, detente y pregunta. No adivines requisitos.

## Específico del frontend

15. Genera los tipos de la API a partir del OpenAPI del backend (`npm run gen:api`). No escribas tipos de la API a mano.
16. Usa TypeScript estricto. Nada de `any` sin un comentario que explique por qué.
17. Ejecuta `npm run test:coverage` antes de abrir un PR.
