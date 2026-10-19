# Seeking storage — operations runbook

**Goal:** Find posts and seeking joins use **`activities`** (`activityMode: seeking`) + **`activity_requests`** only. Legacy **`participant_intents`** stub rows are optional after backfill.

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
- Find flow uses `/me/seeking-posts` (activity-canonical; legacy `participant_intents` read-only).

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

- `npm run seeking:storage-status -- --strict` exits **0** on every env for **≥30 days** with no rollback.
- `activeIntentsMissingSeekingActivity === 0` and no new `participant_intents` inserts in ops metrics.

**Then remove:** `PARTICIPANT_INTENT_STUB_WRITE`, stub insert path, phase-letter labels in Tier-1, `demand:` compat — see [`API_ROUTING.md`](../API_ROUTING.md) seeking-posts section.

**Keep:** `activityMode: seeking`, Find FAB, explore seeking pins, Available vs looking-for split.
