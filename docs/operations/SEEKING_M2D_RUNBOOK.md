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

### 3. Flip M2d flag

In API `.env` (or compose env):

```env
PARTICIPANT_INTENT_STUB_WRITE=false
```

Restart API only (no frontend rebuild required for this flag).

### 4. Strict gate (deploy blocker)

```bash
npm run seeking:m2d-status -- --strict
```

Exit **0** required before sending traffic on that env. Fails when the DB is ready but stub write is still enabled.

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
