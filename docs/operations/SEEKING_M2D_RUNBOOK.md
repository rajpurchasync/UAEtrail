# Seeking storage M2d — operations runbook

**Goal:** Find posts and seeking joins use **`activities`** (`activityMode: seeking`) + **`activity_requests`** only. Legacy **`participant_intents`** stub rows are optional after backfill.

**Checklist mirror:** [`PRE_DEPLOY_CHECKLIST.md`](../PRE_DEPLOY_CHECKLIST.md) § Release gates (seeking + G-manage).

## Prerequisites

- API can reach the target MongoDB (`MONGODB_URI_*` for that env).
- Repo on the release commit; `npm run verify:system:quick` green in CI.

## Ordered steps (every environment)

Run from **repo root** on a machine that loads the same `.env` as the API (or `docker compose exec api` with env injected).

### 1. Readiness report

```bash
npm run seeking:m2d-status
```

**Deploy gate (step 4 in checklist):** `npm run seeking:deploy-gate` — same as `seeking:m2d-status -- --strict` (exit 0 required).

Inspect JSON:

| Field | Action if non-zero / false |
|-------|----------------------------|
| `activeIntentsMissingSeekingActivity` | Run backfill (step 2) before disabling stub write |
| `readyToDisableStubWrite` | Should become `true` after backfill |
| `participantIntentStubWriteEnabled` | Must be `false` in API env before calling production “done” |

### 2. Backfill (M1)

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

### 3. Confirm M2d flag (default off)

API code defaults **stub write off**. In API `.env` (or compose env), **remove** `PARTICIPANT_INTENT_STUB_WRITE=true` if present, or set:

```env
PARTICIPANT_INTENT_STUB_WRITE=false
```

Restart API only (no frontend rebuild required for this flag).

### 4. Strict gate (deploy blocker)

```bash
npm run seeking:m2d-status -- --strict
```

Exit **0** required before sending traffic on that env. Fails when any active intent still lacks a seeking activity **or** stub write is still enabled.

## Local dev

- `.env.example` defaults `PARTICIPANT_INTENT_STUB_WRITE=false` — mirror in root `.env` after backfill.
- Find flow still works via `/me/participant-intents` routes (read-through over seeking activities).

## G-manage smoke (staging UI)

After deploy, with two test accounts:

1. Joiner: request to join a **hosted** published activity.
2. Host: **Plan** → **Needs you** → open **Hosted** → manage sheet → approve.
3. Confirm URL stays on `/plan` (not `/host/requests`).

API regression (no browser): `apps/api/tests/g-manage-coordination-join-approve.test.ts`.

## Rollback

Set `PARTICIPANT_INTENT_STUB_WRITE=true` and restart API. Does not delete existing `activities` seeking rows; only re-enables dual-write on new Find posts.

---

## Residue cleanup (after migration — do not skip)

**Gate (all must be true on staging + prod):**

- `npm run seeking:m2d-status -- --strict` exits **0** on every env for **≥30 days** with no rollback.
- `activeIntentsMissingSeekingActivity === 0` and no new `participant_intents` inserts in ops metrics.
- Product still uses **map peek / explore cards** for Find — no parallel seeking UI was added.

**Then remove or rename (no “M2*” left in Tier-1 / runbooks):**

| Residue | Action |
|---------|--------|
| **M2a–M2d labels** in `API_ROUTING.md`, `DOMAIN.md`, `CREATE_FLOW.md` | Collapse to one **“Seeking storage (activity-canonical)”** subsection; drop phase letters |
| **`PARTICIPANT_INTENT_STUB_WRITE`** + `isParticipantIntentStubWriteEnabled` | Remove env flag and branch; delete `insertOne` stub path in `participant-intents-store` |
| **`participant_intents` collection** | Archive per retention policy; stop all reads except one-off admin export |
| **`/me/participant-intents/*` alias routes** | Deprecate with sunset; clients use `activityId` + standard activity/join APIs only |
| **`demand:` map id + `source: 'demand'` parse compat** | Remove after analytics show no `pin=demand:` traffic |
| **Ops scripts** | Rename `seeking-m2d-status` → `seeking-storage-status` (or fold into general deploy check); update `package.json` script |
| **Tests named `*m2*`, `*M2d*`** | Rename to `seeking-activity-canonical`, `participant-intent-stub-write` |
| **This runbook title “M2d”** | Rename file/heading to **Seeking storage ops**; keep one-line stub in `archive/` if needed |

**Keep (not migration residue):** `activityMode: seeking`, Find FAB, `exploreSeekingMapItemPath`, `seekingOnMap` roster field, **Available** vs **looking for** product split (`member-surfaces-implementation-plan` D14).

Track completion in [`member-surfaces-implementation-plan.md`](../experiment/member-surfaces-implementation-plan.md) §20 **P1 storage — residue cleanup**; run `npm run verify:system` after the pass.
