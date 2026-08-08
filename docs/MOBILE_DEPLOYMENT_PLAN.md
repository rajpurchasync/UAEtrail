# UAE Trail — Mobile & Store Deployment Plan

**Status:** Repo-side work complete. Remaining items need your VPS, Apple/Google accounts, and credentials.

See **[PRE_DEPLOY_CHECKLIST.md](PRE_DEPLOY_CHECKLIST.md)** for the go-live runbook.

---

## Auth strategy (v1)

| Surface | Email | Google |
|---------|-------|--------|
| Desktop / mobile web | Yes | Yes |
| Android native | Yes | Yes |
| iOS native | Yes | **No** (email-only, App Store 4.8) |

Cross-platform reliability baseline for auth/session/access is persisted in `docs/PERFORMANCE_CROSS_PLATFORM_BUGFIX.md` and should be treated as required during mobile releases.

---

## Phase 1 — Production web — **Repo complete**

- [x] Docker build args, nginx security, HTTPS example
- [x] PWA PNG icons + manifest
- [x] Account deletion + data export
- [x] Content reporting (messages, posts, replies, reviews)
- [x] Admin audit filter for reports
- [x] Env validation script + `.env.production.example`
- [x] Deep link templates (`.well-known/`)
- [ ] **You:** HTTPS on VPS, SMTP, OAuth keys

## Phase 2 — Store policy — **Docs ready**

- [x] Play listing copy → `PLAY_STORE_LISTING.md`
- [x] iOS guide (email-only) → `IOS_RELEASE.md`
- [x] Moderation guide → `MODERATION.md`
- [ ] **You:** Play Console, App Store Connect, data safety forms
- [ ] **You:** IAP/Play Billing if selling digital unlock in native apps

## Phase 3 — Native shell — **Android ready**

- [x] Capacitor config + `@capacitor/app` deep links
- [x] Android project + icons + signing template
- [x] Android App Links intent filter
- [x] `npx cap add ios` + `npx cap add android` (open Xcode/Android Studio to build)
- [ ] **You:** Replace SHA256 / TEAM_ID in `.well-known` files after keystores

## Phase 4 — Polish (optional)

- [ ] Custom brand icon SVG → `npm run icons:generate`
- [ ] Sentry / analytics
- [ ] Native FCM/APNs push

---

*Last updated: June 2026*
