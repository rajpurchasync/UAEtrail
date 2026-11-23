# Seeking storage — operations runbook

> **MIG-DISCO-REG (Nov 2026):** Product **Find crew** = **`member_availability`** (fixed map pins). No new `activityMode: seeking` writes; HTTP **`/me/seeking-posts/*`** removed. After legacy backfill below, run **`npm --workspace @uaetrail/api run migrate-seeking-to-availability`** (dry-run first) to copy published seeking activities into fixed slots; optional **`--cancel-seeking`**. Map cache invalidates automatically.

**Goal (legacy phase):** Retire **`participant_intents`** stub rows and seeking activities without leaving orphan join data. **Current product** does not create seeking activities — this runbook is **ops cleanup** on existing DBs.

**Checklist mirror:** [`PRE_DEPLOY_CHECKLIST.md`](../PRE_DEPLOY_CHECKLIST.md) § Release gates (seeking + G-manage).

## Prerequisites

- API can reach the target MongoDB (`MONGODB_URI_*` for that env).
- Repo on the release commit; `npm run verify:system:quick` green in CI.

## Ordered steps (every environment)

Run from **repo root** on a machine that loads the same `.env` as the API (or `docker compose exec api` with env injected).

### 1. Readiness report

```bash
npm run seeking:storage-status
```

**Deploy gate (step 4 in checklist):** `npm run seeking:deploy-gate` — same as `seeking:storage-status -- --strict` (exit 0 required).

Inspect JSON:

| Field | Action if non-zero / false |
|-------|----------------------------|
| `activeIntentsMissingSeekingActivity` | Run backfill (step 2) before disabling stub write |
| `readyToDisableStubWrite` | Should become `true` after backfill |
| `participantIntentStubWriteEnabled` | Must be `false` in API env before calling production “done” |

### 2. Backfill

```bash
npm --workspace @uaetrail/api run backfill-seeking-activities -- --dry-run
npm --workspace @uaetrail/api run backfill-seeking-activities
```

Re-run step 1 until `activeIntentsMissingSeekingActivity` is **0**.

If `activeIntentsMissingCoordsSkippedByBackfill` is non-zero, backfill will never create seeking rows for those pins — add coordinates in product/admin or cancel them:

```bash
npm --workspace @uaetrail/api run cancel-coordless-participant-intents -- --dry-run
npm --workspace @uaetrail/api run cancel-coordless-participant-intents
```

Then re-run step 2 if needed and step 1 until counts are zero.

### 3. Confirm stub write off (default)

API code defaults **stub write off**. In API `.env` (or compose env), **remove** `PARTICIPANT_INTENT_STUB_WRITE=true` if present, or set:

```env
PARTICIPANT_INTENT_STUB_WRITE=false
```

Restart API only (no frontend rebuild required for this flag).

### 4. Strict gate (deploy blocker)

```bash
npm run seeking:storage-status -- --strict
```

Exit **0** required before sending traffic on that env. Fails when any active intent still lacks a seeking activity **or** stub write is still enabled.

### Staging sign-off (P1 — `MIG-SEEKING-READ`)

Run against **staging** Mongo (`MONGODB_URI` / compose env for staging — not local dev DB):

```bash
npm run seeking:deploy-gate
```

Record in the deploy ticket: date, commit SHA, and the JSON summary (`readyToDisableStubWrite`, `activeIntentsMissingSeekingActivity`). **Local gate green ≠ staging done** — both are required before marking P1 seeking migration complete.

## Local dev

- `.env.example` defaults `PARTICIPANT_INTENT_STUB_WRITE=false` — mirror in root `.env` after backfill.
- Find crew uses **`PUT /me/availability`**; legacy `/me/seeking-posts` returns **404**.

## G-manage smoke (staging UI)

After deploy, with two test accounts:

1. Joiner: request to join a **hosted** published activity.
2. Host: **Plan** → **Needs you** → open **Hosted** → manage sheet → approve.
3. Confirm URL stays on `/plan` (not `/host/requests`).

API regression (no browser): `apps/api/tests/g-manage-coordination-join-approve.test.ts`.

## Rollback

Set `PARTICIPANT_INTENT_STUB_WRITE=true` and restart API. **Not recommended post MIG-DISCO-REG** — product no longer mounts seeking-posts routes; rollback is DB restore only.

---

## Merge train to `main` (code promote)

**Branch:** `mig/disco-reg` → single PR to `origin/main` (train must not land on `main` without availability map slice).

| Order | Gate | Owner |
|-------|------|--------|
| 1 | CI / local: `npm run verify:system:quick` green on release SHA | Eng |
| 2 | Open PR; note **39+ commits** — discovery catalog, availability compose, seeking HTTP retired, ops scripts | Eng |
| 3 | Deploy **staging** API + FE from PR build (not prod yet) | Ops |
| 4 | Staging **ops** below (§ MIG-DISCO-REG) — migrate dry-run reviewed, migrate, `mig-disco-reg:ops:gate` exit 0 | Ops |
| 5 | Staging **smoke** — [`CREATE_FLOW.md`](../CREATE_FLOW.md) Mark availability (open + fixed); `/explore` availability pins; People browse + offer rideshare; `/list` crews looking rows | QA |
| 6 | Merge PR → `main`; deploy prod | Eng |
| 7 | Repeat ops steps **4** on **production** Mongo; record JSON + SHA in deploy ticket | Ops |

**Do not** run production migrate before staging gate is green and smoke signed off.

---

## MIG-DISCO-REG branch closure (`mig/disco-reg`)

**Product (code — done when PR merges):** `discovery-catalog-builder.ts` assembler; no new `activityMode: seeking` writes; `/me/seeking-posts/*` and `GET /explore/seeking-activities` retired; map `source: availability`; compose `seek:fixed:*` → availability publish; roster `availabilityOnMap` + `exploreItemId`; guards + `npm run verify:system`.

**Ops (every env — still required before calling storage “done”):**

**Atlas from a dev laptop:** if `TcpTestSucceeded` to `*.mongodb.net:27017` is false, run on the **VPS** (or add your IP to Atlas allowlist). Local Docker only: `MONGODB_URI=mongodb://127.0.0.1:27017/uaetrail_dev RUN_ENV=local npm run mig-disco-reg:ops:preflight`.

Run from repo root on the VPS/staging host (same `.env` as API), or `docker compose exec api npm run …` inside the API container:

```bash
git pull   # mig/disco-reg or merged release commit
npm run mig-disco-reg:ops:preflight    # status + migrate dry-run
MIG_DISCO_REG_OPS_CONFIRM=1 npm run mig-disco-reg:ops:migrate
# optional after review: MIG_DISCO_REG_OPS_CONFIRM=1 npm run mig-disco-reg:ops:migrate -- --cancel-seeking
npm run mig-disco-reg:ops:gate         # must exit 0
```

1. `npm run mig-disco-reg:ops:preflight` (or steps 2–2c in [`PRE_DEPLOY_CHECKLIST.md`](../PRE_DEPLOY_CHECKLIST.md)).
2. `MIG_DISCO_REG_OPS_CONFIRM=1 npm run mig-disco-reg:ops:migrate` (optional `--cancel-seeking`).
3. `npm run mig-disco-reg:ops:gate` → exit 0.
4. Legacy backfill if status shows `activeIntentsMissingSeekingActivity` (§2 above) — **before** step 2.

**Code (product):** Find crew = **`PUT /me/availability`** only; no `/me/seeking-posts`; `participant-intents-store` = **ops backfill** (`backfillSeekingActivitiesForActiveIntents`). Startup/mongo migration + **`npm run purge:seeking-legacy`** call `purgeRetiredSeekingStorage` (cancel seeking activities, drain intent rows). Guards: `participant-intent-residue-guard.test.ts`.

**After strict gate:** drop empty `participant_intent_requests` / fulfilled `participant_intents` from ops metrics; no product reads of `activityMode: seeking`.

---

## Residue cleanup (after migration — do not skip)

**Gate (all must be true on staging + prod):**

- `npm run seeking:storage-status -- --strict` exits **0** on every env for **≥30 days** with no rollback.
- `activeIntentsMissingSeekingActivity === 0` and no new `participant_intents` inserts in ops metrics.

**Then remove (code shipped):** stub insert path, archived seeking wishlist fan-out, map-pin deep links for seeking, leftover **`demand:`** pin ids. **Ops still:** cancel or migrate stale seeking activities; drain `participant_intents` via backfill until strict gate passes 30d. **`PARTICIPANT_INTENT_STUB_WRITE`** — removed from app code and `.env.example` (always off).

**Keep:** **`member_availability`** registry, Find crew FAB → `PUT /me/availability`, explore `source: availability` pins.
