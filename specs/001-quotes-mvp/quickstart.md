# Quickstart: Quotes MVP (frontend)

> Guía de validación una vez implementado. Comandos orientativos.

```bash
npm install
npm run gen:api        # openapi-typescript specs/001-quotes-mvp/contracts/openapi.yaml -o src/api/schema.d.ts
npm run dev:mock       # Vite + MSW (sin backend)
VITE_API_URL=http://localhost:8000/api npm run dev   # contra mottor-ai-back
npm test               # Vitest + Testing Library + vitest-axe
npm run lint && npm run typecheck
```

## Escenarios de verificación (mapean a la spec)
1. **US1**: `/quotes` → paginar, filtrar por cliente, cambiar a EUR; expandir una descripción multilínea con el teclado.
2. **US1 estados**: MSW con lista vacía, filtro sin resultados y error 500 → empty, sin resultados y alerta con "Reintentar".
3. **US2**: `/import` → subir `fixtures/dataset-valid-with-errors.json` → progreso por batch → reporte con tabla de errores paginada; probar cancelar.
4. **US3**: `/quotes/1` → el desglose de reglas cuadra con el total (sin warning); editar ticket → preview en vivo → guardar → recargar.
5. **a11y**: solo teclado en los 3 flujos; zoom 200%; ancho 320 px; `npm test` sin violaciones de axe.
