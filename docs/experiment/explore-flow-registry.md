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

Examples: `organize.hiking`, `find:carpool` → `find.carpool`, `add.trail`.

---

## Organize (Host — `canPublish`)

| Catalog ID | Outing category | `activityType` | Default participation* |
|------------|-----------------|----------------|--------------------------|
| `organize.hiking` | hiking | `hiking` | approval |
| `organize.camping` | camping | `camping` | approval |
| `organize.events` | events | `event` | rsvp |
| `organize.rideshare` | rideshare | `carpool` | approval |
| `organize.activities.*` | activities | `event` | approval |

\* Host may choose rsvp vs approval before submit.

**Lifecycle:** draft → published → cancelled.

**Code:** `organizeFlow.ts`, `CreateActivityFlow.tsx` · API `POST /host/events`.

---

## Find → Demand (any member)

| Catalog ID | Compose kind | Outing category | Intent `kind` |
|------------|--------------|-----------------|-----------------|
| `find.hiking` | `hiking` | hiking | `hiking` |
| `find.camping` | `camping` | camping | `camping` |
| `find.event` | `event` | activities | `event` |
| `find.carpool` | `carpool` | rideshare | `carpool` |

**Lifecycle:** active → fulfilled \| cancelled; convert → Organize.

**Code:** `demandFlow.ts`, `CreateDemandFlow.tsx` · API `POST /me/participant-intents`.

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

## Endpoints (unchanged)

Organize · Host POST events · Demand · POST participant-intents · Add · POST locations · Map · GET explore/map
