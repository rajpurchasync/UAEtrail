# Pre-deploy checklist (no external connections required in repo)

Complete these **on the VPS** when you connect. Use this list to track progress.

## Before first deploy

- [ ] Copy `.env.production.example` → `.env` and fill all values
- [ ] Run `npm run validate:env:prod` on the server (must pass with zero errors)
- [ ] Generate JWT secrets (`openssl rand -hex 64` × 2)
- [ ] Set `RUN_ENV=production`, `MONGODB_URI_PROD`, and MinIO credentials
- [ ] Point domain DNS A record to VPS IP

## Docker deploy

- [ ] `./run-project.sh`
- [ ] Do **not** run demo seed in production; leave `DEMO_ACCOUNT_PASSWORD` unset on the VPS
- [ ] Staging: set `ALLOW_DEMO_LOGIN=true` only if demo-login is required; never in production
- [ ] Production ops: set `PLATFORM_ADMIN_MFA_SECRET` (base32 TOTP) and use `totp` on `POST /auth/login` for platform-admin accounts (S10g)
- [ ] First-time dev/staging only (if needed): `SEED_DATA=true docker compose exec -T api npm --workspace @uaetrail/api run seed`
- [ ] `curl https://uaetrail.com/health` returns OK
- [ ] After deploy, API startup runs Mongo migrations (`schema_meta.migrations`); if upgrading past GW-7, expect version **2025112502** and log line `[mongo] Stale notification bookmark path(s)` (`DEPLOYMENT.md` § Updating)

## HTTPS

- [ ] Certbot or upload certs to `nginx/certs/`
- [ ] `cp nginx/ssl-server.conf.example nginx/conf.d/ssl.conf`
- [ ] Uncomment SSL volume in `docker-compose.yml`
- [ ] `docker compose up -d --build frontend`
- [ ] HTTP redirects to HTTPS

## OAuth & email (external — you do next)

- [ ] Google Cloud Console: Web OAuth client for `https://uaetrail.com`
- [ ] Set `GOOGLE_CLIENT_ID` + `VITE_GOOGLE_CLIENT_ID`, rebuild frontend
- [ ] SMTP or SendGrid configured; test signup email
- [ ] Optional: `npx web-push generate-vapid-keys` → `.env`

## Deep links (after release keystore exists)

- [ ] Get SHA-256 fingerprint: `keytool -list -v -keystore uaetrail-release.keystore`
- [ ] When the Android release keystore exists, add the real SHA-256 statement to `public/.well-known/assetlinks.json` (keep `[]` until then — a placeholder fingerprint makes Chrome and Edge report that the app cannot be installed)
- [ ] Apple: replace `TEAM_ID` in `public/.well-known/apple-app-site-association`
- [ ] Verify: [Google Asset Links tester](https://developers.google.com/digital-asset-links/tools/generator)

## Mobile apps

- [ ] `npm run icons:generate && npm run cap:sync`
- [ ] Android: see `docs/ANDROID_RELEASE.md`
- [ ] iOS (Mac): `npx cap add ios` → `docs/IOS_RELEASE.md`

## SLO baseline (P5 — staging before prod promote)

CI / no live API: `npm run p5:slo-preflight` (wired into `verify:domain`). Record staging results from `BASE_URL=https://staging-host npm run p5:slo-smoke` (optional `P5_SLO_SAMPLES=10`). Local API dev: `BASE_URL=http://localhost:4000 npm run p5:slo-smoke` (API must be running; default port matches `apps/api` `PORT`). With **S10e** bbox on staging API, add `P5_EXPLORE_MAP_BBOX=1` (optional `P5_EXPLORE_MAP_BBOX_QUERY=55,25,56,26`). Public L3 read: set `P5_ACTIVITY_ID` (or reuse `P5_JOIN_ACTIVITY_ID`) for guest `GET /api/activities/:id` latency samples. Overlay + join probes: `P5_SMOKE_EMAIL`, `P5_SMOKE_PASSWORD`; join also needs `P5_JOIN_ACTIVITY_ID` (open RSVP or approval outing). Join POST body is JSON `note` (not leftover `message`); success is HTTP 201 or 409. Targets from `scripts/governance/platform-governance.json` P5 `slos[]`:

- [ ] **SLO-EXPLORE-MAP** — `GET /api/explore/map` p95 latency noted (compare full map vs bbox when **S10e** flags on)
- [ ] **SLO-EXPLORE-OVERLAY** — `GET /api/me/discover/overlay` p95 when smoke email/password set (COH-08)
- [ ] **SLO-JOIN** — guest activity detail samples OK when `P5_ACTIVITY_ID` set; join probe exits 0 (RSVP or request POST JSON `note`; HTTP 201 or 409)
- [ ] **SLO-API-ERR** — smoke run reports 5xx rate &lt;0.1%; confirm rolling 24h in staging (or first prod week)

## MIG-DISCO-REG merge train (when promoting `mig/disco-reg`)

- [ ] `npm run verify:system:quick` green on the PR HEAD commit
- [ ] Staging deploy from PR build
- [ ] Staging ops + smoke complete per [`operations/SEEKING_STORAGE_RUNBOOK.md`](./operations/SEEKING_STORAGE_RUNBOOK.md) § **Merge train** and § **MIG-DISCO-REG**
- [ ] Merge to `main`; production deploy; production ops (same ordered steps as staging §2–2c)

## Release gates (before traffic)

- [ ] Side-effect outbox: production API runs with `NODE_ENV=production` (outbox on by default — do **not** set `SIDE_EFFECT_OUTBOX=0`); confirm outbox drain logs on startup
- [ ] `npm run verify:system` (or `verify:system:quick` on CI) on the release commit
- [ ] **Release ops wiring (CI):** `npm run release:ops:checklist` — then complete staging-only gates below (P5 SLO, S10e, S10f, MIG-DISCO-REG)
- [ ] Optional hot-path snapshot (API running locally or staging): `npm run perf:api -- --label staging` — compare with `npm run perf:api:compare` after updating `scripts/dev/perf-results/*.json`
- [ ] **Catalog CPC (places + facilities):** after deploy, if amenity pins are missing on explore map, run `npm --workspace @uaetrail/api run seed:catalog-facilities` (see [`operations/EXPLORE_MAP_RUNBOOK.md`](./operations/EXPLORE_MAP_RUNBOOK.md)); smoke `GET /api/facilities/catalog` and `/place/:id` + `/facility/:id` on staging
- [ ] `npm run test:explore-alignment` when explore/FAB changed (S10e automated gate before C19 promote)
- [ ] **Explore map bbox promote (S10e / C19):** `npm run s10e:staging-checklist` (add `--verify` for quick system gate); then set `EXPLORE_MAP_BBOX=1` (API) and `VITE_EXPLORE_MAP_BBOX=1` (FE build) on **staging only**; smoke per [`operations/EXPLORE_MAP_RUNBOOK.md`](./operations/EXPLORE_MAP_RUNBOOK.md) § bbox bbox fetch; do **not** enable in production until p95 metrics pass
- [ ] Staging smoke aligned with [`NAVIGATION.md`](./NAVIGATION.md) (explore-first IA — not legacy organizer/community nav)
- [ ] **Consumer detail + notifications (S9 / S10f):** `npm run s10f:ops:checklist` (CI wiring), then `BASE_URL=https://staging-host npm run s10f:ops:print-routes` (prints QA routes + S10f notification edge checklist; matrix in `consumerDetailQaMatrixGuard`)
- [ ] **Staging ops (ordered, per env)** — detail: [`operations/SEEKING_STORAGE_RUNBOOK.md`](./operations/SEEKING_STORAGE_RUNBOOK.md). On the server with production `.env` / compose API container:
  1. `npm run seeking:storage-status` — read JSON; fix any `activeIntentsMissingSeekingActivity` before step 2
  2. `npm --workspace @uaetrail/api run backfill-seeking-activities -- --dry-run`, then without `--dry-run` until step 1 reports zero missing
  2b. If `activeIntentsMissingCoordsSkippedByBackfill` &gt; 0: fix coordinates or `npm --workspace @uaetrail/api run cancel-coordless-participant-intents` (after `--dry-run`), then repeat step 2 if needed
  2c. **MIG-DISCO-REG:** `npm run mig-disco-reg:ops:preflight`, then `MIG_DISCO_REG_OPS_CONFIRM=1 npm run mig-disco-reg:ops:migrate` (optional `--cancel-seeking`) — see [`operations/SEEKING_STORAGE_RUNBOOK.md`](./operations/SEEKING_STORAGE_RUNBOOK.md) § MIG-DISCO-REG
  3. Set `PARTICIPANT_INTENT_STUB_WRITE=false` in API env, restart API (`docker compose up -d --build api` or your deploy script)
  4. `npm run seeking:deploy-gate` (alias for `seeking:storage-status -- --strict`) — must exit 0 before traffic
- [ ] **G-manage** (staging UI): second account requests join on a hosted outing → host sees **Plan → Needs you** → **Hosted** → manage sheet → approve; URL stays on `/plan` (not `/publishing/requests`). API regression: `g-manage-coordination-join-approve.test.ts` (coordination `host_join_queue` + `PATCH /publishing/requests/:id`).

## Smoke test (production)

- [ ] Sign up → verify email → sign in
- [ ] Google sign-in (web/Android)
- [ ] Join trip flow
- [ ] Profile → Export data → Delete account (test user)
- [ ] Report content on review or message (legacy `post` reports in audit log only)
- [ ] Admin → Audit log → filter `content_report`
- [ ] Sign-in survives refresh/reload (cookie refresh + bearer retry flow)
- [ ] Role switch (`visitor` <-> `original`) preserves same account identity

Auth/session checks: [`DEV_RUN.md`](./DEV_RUN.md) § Auth & session baseline.

---

*Validate locally anytime:* `npm run validate:env -- --file .env.production.example` (expect warnings on CHANGE_ME values).
