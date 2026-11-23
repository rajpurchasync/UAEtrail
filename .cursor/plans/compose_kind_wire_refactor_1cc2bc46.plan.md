# Compose kind wire + operator surface (MIG-PLATFORM-COMPOSE-OPERATOR-2026)

**Status:** **Closed** (2026-11-22)  
**Migration:** `scripts/platform-program.json` → `MIG-PLATFORM-COMPOSE-OPERATOR-2026` (`complete`)  
**Guards:** `migPlatformComposeOperatorProgramGuard`, `composeSpineGuard`, `composeLineageGuard`, `composeWireEmitGuard`  
**Verify:** `npm run verify:compose-spine`

## Target wire (shipped)

| Kind | Emit | Publish |
|------|------|---------|
| Activity | `compose=activity:*` | `POST /publishing/activities` (hosting flows) |
| Place | `compose=place:*` | place / facility flows |
| Intent | `compose=intent:open` · `intent:fixed:*` | `PUT /me/availability` |

Legacy `host` / `seek` / `add` / `availability` compose values: **parse-only** in `packages/shared-types/src/compose-route.ts` (`migrateLegacyComposeWire`). No product emit in `src/` (`composeWireEmitGuard`).

Wishlist: **`POST /me/wishlist`** via `saveWishlistTarget` — never compose.

Operator console: SPA **`/operator/*`** (legacy `/hosting`, `/publishing`, `/organizer` inbound redirects only).

## Wizards (catalog `wizard` field)

- `hostingFlow` → activities  
- `intentFixedFlow` → `intentFixedFlowEngine.ts` + `CreateAvailabilityFixedFlow.tsx`  
- `addFlow` → places  

Open intent: `IntentOpenComposeSheet` + `PlanAvailabilitySection` + `UPL_INTENT_*` (`upl-glossary.ts`).

## Acceptance checklist

- [x] `CreateKindSheet` three kinds (activity · place · intent)  
- [x] `composeFlowCatalog` ids `activity.*` \| `place.*` \| `intent.*`  
- [x] Retired `CreateIntentSheet`, `MarkAvailabilityComposeSheet`, `organizeFlow`, `FabTopLevel`  
- [x] `MIG-PLATFORM-COMPOSE-OPERATOR-2026` registered **complete**  
- [x] Tier-1: `CREATE_FLOW.md`, `DOMAIN_CANONICALS.md`, `SYSTEM_COHERENCE.md` reference program id  
- [x] `verify:compose-spine` green  

## Non-goals (follow-up backlog)

- Optional rename inbound `view=people` (crews browse — separate plan)  
- P7 `buddiesApi` facade rename (`MIG-PEOPLE-VOCAB` manifest phase P7)