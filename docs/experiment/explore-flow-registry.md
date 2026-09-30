# Compose flow catalog (FAB → API)

**Branch:** `experiment-ui` · Maps **catalog IDs** to wizards, validation, lifecycles, and endpoints.

**Code IDs** match URL `compose=` ([`compose.ts`](../../src/explore/compose.ts)): **`organize.*` · `find.*` · `add.*`**

**Architecture:** **Organize** → `activities` · **Demand** (FAB “Find”) → `participant_intents` · **Add** → catalog.

**Catalog module:** `src/explore/composeFlowCatalog.ts`

---

## Rules

1. Each catalog entry = own steps, validation, submit, **lifecycle** — no merged wizard.
2. Step kits only — not shared draft state.
3. Organize and Demand share **OutingCategory** — not shared wizards.

---

## ID format

`<composeIntent>.<segment>[.<topic>]`

| Prefix | Compose intent | Architecture | Storage |
|--------|----------------|--------------|---------|
| `organize.*` | `organize` | Organize | `activities` |
| `find.*` | `find` | Demand | `participant_intents` |
| `add.*` | `add` | Add place | `locations` / shop |
| `find.goods.*` | **Future** | Goods/services demand | TBD |

Examples: `organize.hiking`, `compose=organize:carpool` → `organize.rideshare`, `find:carpool` → `find.carpool`, `add.trail`.

---

## Organize (Host — `canPublish`)

| Catalog ID | Compose URL | Outing category | `activityType` | API body (v1) | Default participation* |
|------------|-------------|-----------------|----------------|---------------|--------------------------|
| `organize.hiking` | `organize:hiking` | hiking | `hiking` | `host.ts` create + `outingCategory` | approval |
| `organize.camping` | `organize:camping` | camping | `camping` | same | approval |
| `organize.events` | `organize:event` | events | `event` | same | rsvp |
| `organize.rideshare` | `organize:carpool` | rideshare | `carpool` | same | approval (locked on submit) |
| `organize.activities` | `organize:activity` | activities | `event` | same + `outingTopic` | approval |

\* Host may choose rsvp vs approval on **audience** step (except rideshare — always approval). Per-flow Zod split (E5 optional) not yet extracted.

**Lifecycle:** draft → published → cancelled.

**Code:** `composeFlowCatalog.ts` → `organizeFlows/*` (per `organize.*` id) · `createOrganize/CreateOrganizeFlowHost.tsx` · shell `CreateActivityFlow.tsx` · step modules `organizeWizard/steps/*-step.tsx` (dispatched via `renderOrganizeWizardStepsForIds`) · sheet chrome `organizeWizard/OrganizeWizardChrome.tsx` · shared draft in `organizeFlow.ts` · `POST /host/activities` · `organizeActivityPublish.ts` · registry draft `organizePlaceRegistryDraft.ts`.

**Wizard maintenance (after editing the monolithic slice):**

1. `node scripts/restore-organize-wizard-slice.mjs` (optional — from git snapshot)
2. `node scripts/split-wizard-steps-v3.mjs`
3. `node scripts/fix-wizard-step-imports.mjs`
4. `node scripts/prune-organize-wizard-steps.mjs` — then restore any missing `lucide-react` icons used in JSX
5. `node scripts/apply-organize-wizard-chrome.mjs` — `FlowSheetChrome` → `OrganizeWizardChrome` (custom `title={…}` supported; verify `type-step` uses `ORGANIZE_TYPE_SHEET_TITLE`)
6. `node scripts/use-organize-wizard-step-next.mjs` then `node scripts/prune-organize-step-next-imports.mjs` — footer + next → `OrganizeWizardStepNext`

**Registry venue:** when `registryPlaceId` + `placeLabelSource: registry`, hiking/camping flows skip `difficulty` and `about_trail` (data from place registry).

**Meeting point step:** map pin + **extra directions** only (no optional label field).

**Post-publish carpool:** optional on success sheet when `catalogFlow.postPublishCarpool` (not on publish step).

**Reorganize (new activity id):** host menu **Reorganize on map** → `/explore?compose=organize:<kind>&organizeFrom=<activityId>` · `organizeFromActivity.ts` · publish sends optional `clonedFromActivityId` (audit `metadata.sourceActivityId`). Distinct from console **Duplicate** (`POST …/duplicate` → draft modal).

**Places:** one `Place` entity, typed by `PlaceKind` — `packages/shared-types/src/place-kind.ts`, `docs/DOMAIN.md`.

---

## Find → Demand (any member)

| Catalog ID | Compose URL | FAB label | Outing category | Intent `kind` | API |
|------------|-------------|-----------|-----------------|---------------|-----|
| `find.hiking` | `find:hiking` | Hiking | hiking | `hiking` | `POST /me/participant-intents` |
| `find.camping` | `find:camping` | Camping | camping | `camping` | same |
| `find.event` | `find:event` | **Activities** | activities | `event` | same |
| `find.carpool` | `find:carpool` | Rideshare | rideshare | `carpool` | same |

**Lifecycle:** active → fulfilled \| cancelled; host **fulfill** → separate Organize publish (see below).

**Code:** `demandFlow.ts`, `CreateDemandFlow.tsx`.

---

## Add (catalog)

| Catalog ID | Contribute kind | API |
|------------|-----------------|-----|
| `add.trail` | `hiking` | `POST /me/locations` |
| `add.camp` | `camping` | Same |
| `add.shop` | `shop` | Shop onboarding |
| `add.spot` | `event` | Same |

**Code:** `contributeFlow.ts`, `CreateContributeFlow.tsx`.

---

## Discovery (browse)

**Activities** tab = Organize + Find (Demand) pins. **Places** = Add catalog only.

---

## Demand → Organize (fulfill)

Approved host opens a demand pin → **Host this** (or `?fulfillIntent=demand:{id}`) → `useExploreFulfillIntent` seeds `CreateActivityFlow` via `createDraftFromDemand` — **new** activity row; demand lifecycle unchanged until product marks fulfilled.

**Code:** `useExploreFulfillIntent.ts`, `exploreFulfillIntentReturnPath()` in `routing.ts`.

---

## Endpoints (unchanged)

Organize · `POST /host/activities` · Demand · `POST /me/participant-intents` · Add · `POST /me/locations` · Map · `GET /explore/map`
