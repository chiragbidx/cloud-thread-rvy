# Changelog
<!--
  Purpose:
  - Track project change history over time.
  - Record date, summary, and key files touched for each change set.
  - Keep entries append-only (do not delete past entries).
-->

## 2024-04-27 — AI Contract Generate: Contracts/Clients/AI Integration

- Added Drizzle DB schema for clients, contracts, and contract_activities (multi-tenant, team-scoped).
- Created database migration & updated journal for new tables.
- Implemented full contracts CRUD server actions with Zod validation & activity log.
- AI OpenAI generation integration (generateAIDraftContract action) for contract draft authoring.
- Contracts dashboard UI for list, detail, edit, activity view, and status changes.
- Clients dashboard UI for listing and dummy routes for detailed CRUD.
- Updated sidebar navigation for “Contracts” and “Clients”.
- Branded copy, empty states, and action labels for “AI Contract Generate”.

**Key files:**
- `lib/db/schema.ts`, `drizzle/0001_add_contracts_clients_activity.sql`, `drizzle/meta/_journal.json`
- `app/dashboard/contracts/actions.tsx`, `app/dashboard/clients/actions.tsx`
- `app/dashboard/contracts/page.tsx`, `app/dashboard/contracts/new/page.tsx`, `app/dashboard/contracts/[id]/page.tsx`, `app/dashboard/contracts/[id]/edit/page.tsx`
- `app/dashboard/clients/page.tsx`
- `components/dashboard/sidebar-nav.tsx`