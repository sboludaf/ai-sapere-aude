# AI Sapere Aude

Aplicacion fullstack en Next.js para gestionar propuestas, presupuestos, asistentes y profesores asignados a formaciones.

## Stack

- Next.js App Router + TypeScript
- MySQL para datos transaccionales de la aplicacion
- Neo4j para relaciones de empresa, propuesta, servicios y profesores
- Qdrant para persistir vectorizaciones de propuestas

## Arranque local

1. Copia variables de entorno:

```bash
cp .env.example .env.local
```

2. Levanta persistencias:

```bash
docker compose up -d
```

3. Instala dependencias y arranca Next.js:

```bash
npm install
npm run dev
```

4. Abre `http://localhost:3000`.

## Modelo funcional

- Cada propuesta se guarda como iniciativa con ciclo de vida propio.
- La oferta nace en `PENDING_APPROVAL`.
- Los comentarios viven en `proposal_comments`.
- El historico de estados vive en `proposal_status_history`.
- El presupuesto actual queda en `proposals.total_cost`, y cada cambio crea una entrada en `budget_versions` con sus `budget_items`.
- Las asignaciones docentes se guardan por fecha y horas en `proposal_professor_assignments`.
- Al crear o actualizar presupuesto/estado, la propuesta se sincroniza con Neo4j y Qdrant si los servicios estan disponibles.

## Vectorizaciones

La primera version incluye un vector determinista local para poder validar el flujo Qdrant sin depender de un proveedor de embeddings. El punto de sustitucion esta en `src/lib/integrations/qdrant.ts`.
