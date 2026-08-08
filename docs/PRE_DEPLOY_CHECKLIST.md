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
- [ ] `docker compose exec api npm --workspace @uaetrail/api run seed` (with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` in production)
- [ ] `curl https://uaetrail.ae/health` returns OK

## HTTPS

- [ ] Certbot or upload certs to `nginx/certs/`
- [ ] `cp nginx/ssl-server.conf.example nginx/conf.d/ssl.conf`
- [ ] Uncomment SSL volume in `docker-compose.yml`
- [ ] `docker compose up -d --build frontend`
- [ ] HTTP redirects to HTTPS

## OAuth & email (external — you do next)

- [ ] Google Cloud Console: Web OAuth client for `https://uaetrail.ae`
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

## Smoke test (production)

- [ ] Sign up → verify email → sign in
- [ ] Google sign-in (web/Android)
- [ ] Join trip flow
- [ ] Profile → Export data → Delete account (test user)
- [ ] Report content on community post
- [ ] Admin → Audit log → filter `content_report`
- [ ] Sign-in survives refresh/reload (cookie refresh + bearer retry flow)
- [ ] Role switch (`visitor` <-> `original`) preserves same account identity

Reference persisted baseline: `docs/PERFORMANCE_CROSS_PLATFORM_BUGFIX.md`.

---

*Validate locally anytime:* `npm run validate:env -- --file .env.production.example` (expect warnings on CHANGE_ME values).
