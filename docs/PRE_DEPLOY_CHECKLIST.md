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
- [ ] First-time dev/staging only (if needed): `SEED_DATA=true docker compose exec -T api npm --workspace @uaetrail/api run seed`
- [ ] `curl https://uaetrail.com/health` returns OK

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
- [ ] Replace placeholder in `public/.well-known/assetlinks.json`
- [ ] Apple: replace `TEAM_ID` in `public/.well-known/apple-app-site-association`
- [ ] Verify: [Google Asset Links tester](https://developers.google.com/digital-asset-links/tools/generator)

## Mobile apps

- [ ] `npm run icons:generate && npm run cap:sync`
- [ ] Android: see `docs/ANDROID_RELEASE.md`
- [ ] iOS (Mac): `npx cap add ios` → `docs/IOS_RELEASE.md`

## Release gates (before traffic)

- [ ] `npm run verify:system` (or `verify:system:quick` on CI) on the release commit
- [ ] `npm run test:explore-alignment` when explore/FAB changed (S10e automated gate before C19 promote)
- [ ] **Explore map vNext promote (S10e / C19):** `npm run s10e:staging-checklist` (add `--verify` for quick system gate); then set `EXPLORE_MAP_VNEXT=1` (API) and `VITE_EXPLORE_MAP_VNEXT=1` (FE build) on **staging only**; smoke per [`operations/EXPLORE_MAP_RUNBOOK.md`](./operations/EXPLORE_MAP_RUNBOOK.md) § vNext bbox fetch; do **not** enable in production until p95 metrics pass
- [ ] Staging smoke aligned with [`NAVIGATION.md`](./NAVIGATION.md) (explore-first IA — not legacy organizer/community nav)
- [ ] **Consumer detail + notifications (S9 / S10f):** `BASE_URL=https://staging-host npm run consumer-detail:qa-routes` (prints §8 routes + S10f notification edge checklist) then run §8 matrix in [`experiment/consumer-detail-surfaces-plan.md`](./experiment/consumer-detail-surfaces-plan.md) (substitute seed ids)
- [ ] **Staging ops (ordered, per env)** — detail: [`operations/SEEKING_STORAGE_RUNBOOK.md`](./operations/SEEKING_STORAGE_RUNBOOK.md). On the server with production `.env` / compose API container:
  1. `npm run seeking:storage-status` — read JSON; fix any `activeIntentsMissingSeekingActivity` before step 2
  2. `npm --workspace @uaetrail/api run backfill-seeking-activities -- --dry-run`, then without `--dry-run` until step 1 reports zero missing
  2b. If `activeIntentsMissingCoordsSkippedByBackfill` &gt; 0: fix coordinates or `npm --workspace @uaetrail/api run cancel-coordless-participant-intents` (after `--dry-run`), then repeat step 2 if needed
  3. Set `PARTICIPANT_INTENT_STUB_WRITE=false` in API env, restart API (`docker compose up -d --build api` or your deploy script)
  4. `npm run seeking:deploy-gate` (alias for `seeking:storage-status -- --strict`) — must exit 0 before traffic
- [ ] **G-manage** (staging UI): second account requests join on a hosted outing → host sees **Plan → Needs you** → **Hosted** → manage sheet → approve; URL stays on `/plan` (not `/host/requests`). API regression: `g-manage-coordination-join-approve.test.ts` (coordination `host_join_queue` + `PATCH /host/requests/:id`).

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
