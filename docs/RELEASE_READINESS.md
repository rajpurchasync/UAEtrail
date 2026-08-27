# UAE Trails — Release Readiness & User Testing

**Owner:** Engineering lead / launch captain  
**Audience:** Anyone deciding go / no-go for production web (then stores)  
**Related:** [PRE_DEPLOY_CHECKLIST.md](PRE_DEPLOY_CHECKLIST.md) · [DEPLOYMENT.md](DEPLOYMENT.md) · [MOBILE_DEPLOYMENT_PLAN.md](MOBILE_DEPLOYMENT_PLAN.md) · [MODERATION.md](MODERATION.md)

This document is the **quality gate** before public traffic. CI green is necessary but not sufficient. Launch when P0 gates pass on staging (then production smoke), not when the UI “looks done.”

---

## 1. Principles

1. **Risk over coverage** — Prove what loses trust, money, or store approval if it breaks.
2. **Staging parity** — UAT and load tests run on staging that mirrors production Docker + separate MongoDB. Do not run destructive UAT on shared Atlas `uaetrail` used by the team.
3. **Binary gates** — Each P0 item is PASS or FAIL. Deferrable items need an owner and a date within 30 days.
4. **Phased blast radius** — Internal dogfood → closed beta → public web → Android → iOS / IAP.
5. **Named launch captain** — One person owns go/no-go, rollback, and the 48h watch window.

---

## 2. Roles & surfaces under test

| Product role | Auth role(s) | Primary UI | Seed account (dev/staging only) |
|--------------|--------------|------------|----------------------------------|
| Visitor | `visitor` | Bottom nav: Explore → Trips → Community → Shop → Profile | `visitor@uaetrails.app` |
| Organizer owner | `tenant_owner` | `/organizer/*` | `organizer@uaetrails.app` |
| Guide | `tenant_guide` | `/organizer/*` (scoped) | `guide@uaetrails.app` |
| Platform admin | `platform_admin` | `/admin/*` | `admin@uaetrails.app` |

**Surfaces:** mobile web (primary), desktop web, Capacitor Android (phase 2), iOS (phase 3).

**Never** use seed passwords in production. Production admin comes from `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` on first seed only.

---

## 3. Go / no-go gates

| # | Gate | Pass criteria | Blocking? |
|---|------|---------------|-----------|
| G1 | Critical journeys | All P0 rows in §4 PASS on staging | Yes |
| G2 | Roles / RBAC | Visitor cannot hit organizer/admin APIs or routes; guide cannot do owner-only actions if product defines them | Yes |
| G3 | Trust & compliance | Report content, data export, delete account work; Privacy/Terms reachable | Yes |
| G4 | Auth & email | Sign up → verify OTP/email → sign in; forgot password; Google OAuth on web (staging client) | Yes |
| G5 | Ops | `validate:env:prod` clean; `/health` OK; HTTPS; JWT secrets not defaults; rollback known | Yes |
| G6 | Money | Stripe Checkout + webhook in **test mode**, or explicitly deferred with owner + date | Yes if shipping shop checkout |
| G7 | Observability | Error tracking (e.g. Sentry) on FE + API, or deferred with owner + date | Soft for closed beta; hard before public marketing |
| G8 | Mobile stores | Android/iOS checklists in mobile docs; deep links SHA/TEAM_ID filled | Only when shipping that store |

**Ship rule:** Any Yes-blocking FAIL → no public launch. Soft fails may ship only if logged in “Known deferred” (§10).

---

## 4. P0 journey matrix

Map each journey to UI, API area, and current automation. Expand API/E2E coverage before relying on manual-only rows for every release.

| ID | Journey | Role | UI routes | API / domain | Automation today | Manual UAT |
|----|---------|------|-----------|--------------|------------------|------------|
| J1 | Sign up → verify → sign in | Visitor | `/signup` → `/verify` → `/signin` | `/auth` | Partial (`auth.test.ts`) | Required |
| J2 | Forgot / reset password | Visitor | `/forgot-password` → `/verify` | `/auth` | Partial | Required |
| J3 | Google sign-in (web) | Visitor | `/signin` | Google OAuth | None | Required (staging + prod clients) |
| J4 | Discover trail/camp | Anyone | `/` `/discovery` `/trail/:id` `/camp/:id` | locations / discovery | Partial (`locations-list`, `location-query`) | Required |
| J5 | Browse & open trip | Anyone | `/trips` `/trip/:id` | events | Partial | Required |
| J6 | Request to join trip | Visitor | `/trip/:id` → `/my-requests` | join requests | Strong (`join-request*.ts`, `capacity.ts`) | Required E2E |
| J7 | Waitlist when full → promote | Visitor + Organizer | `/my-requests` `/organizer/requests` | waitlist promotion | Strong (capacity / join flow) | Required |
| J8 | Organizer approve / reject | Organizer | `/organizer/requests` | join request status | Partial | Required |
| J9 | Organizer create / edit event | Organizer | `/organizer/events` `/organizer/events/new` | `/organizer` | Partial (`event-schedule`) | Required |
| J10 | Check-in → review prompt | Organizer + Visitor | organizer events + notifications | check-in, `REVIEW_PROMPT` | Partial | Required |
| J11 | Chat visitor ↔ organizer | Both | `/messages` `/organizer/messages` | `/chat`, SSE ticket | Partial (`chat-*`, `sse-ticket`) | Required (real-time) |
| J12 | Notifications list | Multi | `/notifications` | notifications | Partial | Smoke |
| J13 | Community post + report | Visitor + Admin | `/community` `/admin/audit-log` | `/social`, reports | None FE | Required |
| J14 | Export data + delete account | Visitor | `/profile` | account deletion | Strong (`account-deletion.test.ts`) | Required (staging only) |
| J15 | Admin moderation audit | Admin | `/admin/audit-log` (filter `content_report`) | `/admin` | None | Required |
| J16 | Shop browse | Anyone | `/shop` `/product/:id` | `/shop` | None | Smoke |
| J17 | Stripe checkout | Visitor | product → checkout | checkout + webhook | Partial (`premium.test.ts` area) | Required if G6 not deferred |
| J18 | Become host / organizer | Visitor | `/become-host` | organizer application | None | Smoke / P1 |
| J19 | Guide scoped access | Guide | `/organizer/*` | tenant RBAC | Weak | Required RBAC spot-check |
| J20 | Health & public SEO pages | Anyone | `/health` (via edge) `/terms` `/privacy` `/faq` | health | `health.test.ts` | Smoke |

### Suggested Playwright E2E set (add next)

Automate first: **J1, J6, J8, J11, J13, J14**. Keep the rest scripted manual until flaky-cost is justified.

---

## 5. Environments

| Env | Purpose | Database | External services |
|-----|---------|----------|-------------------|
| Local | Dev | Atlas shared **or** local mongo | Redis + MinIO via compose |
| Staging | UAT, load, E2E | **Separate** Atlas DB e.g. `uaetrail_staging` | Stripe **test**, SMTP sandbox, Google OAuth staging client, same Docker images as prod |
| Production | Real users | `uaetrail` (prod) | Live Stripe/OAuth/SMTP only after G5 |

**Rules**

- Destructive flows (delete account, moderation, waitlist edge cases) → staging only.
- Team shared Atlas is for collaboration, not launch certification.
- Feature flags in root `.env` (`VITE_USE_API_*`) must match the environment under test.

**Staging bring-up (checklist)**

- [ ] Clone production compose / env pattern; set distinct `MONGODB_URI`
- [ ] `npm run validate:env` against staging `.env`
- [ ] Seed staging; rotate seed passwords away from README defaults if exposed
- [ ] Point staging hostname (or tunnel) at stack; HTTPS optional for internal UAT but preferred
- [ ] Configure staging Google redirect URIs and Stripe webhook to staging API

---

## 6. Test strategy (pyramid)

```text
        ▲ Exploratory + role UAT (§7)     ~1–2 days per release candidate
       ▲▲ Playwright P0 E2E               6–12 journeys
      ▲▲▲ API integration (Vitest)        expand apps/api/tests
     ▲▲▲▲ Domain unit                     capacity, jwt, datetime, auth redirects
```

### Already in CI (`.github/workflows/ci.yml`)

- Frontend + API typecheck, lint, build
- `npm run test:api` / `npm run test:frontend`
- Docker API image build

### Gaps to close before public launch

| Gap | Action |
|-----|--------|
| FE journey coverage | Add Playwright against staging; keep Vitest for pure utils |
| RBAC | API tests: visitor token denied on `/organizer` and `/admin` |
| Stripe webhook | Idempotency + signature failure cases |
| Contract drift | Spot-check shared-types DTOs vs live OpenAPI (`/api/openapi.json`) |
| Load | k6/Artillery: discovery list + trip detail (~50–100 concurrent) on staging |

Commands (local/CI):

```bash
npm run ci                 # full local gate
npm run test:api
npm run test:frontend
npm run validate:env:prod  # on server with real .env
```

---

## 7. Role-based UAT scripts

Give each tester: account, device, script, pass/fail column, severity key (P0–P3). No unscripted “demo” as the only evidence.

### 7.1 Visitor (mobile web, ~45 min)

1. Cold open `/` — can browse without login.
2. Sign up with new email → verify → land signed in (**J1**).
3. Discovery → open a trail and a camp (**J4**).
4. Trips → open a trip with capacity → Request to join (**J6**).
5. Open `/my-requests` and `/my-requests/:id` — status visible.
6. Message organizer from trip/operator profile (**J11**).
7. Community: view feed; create post if allowed; **Report** a post (**J13**).
8. Profile: export data; delete **this test account** on staging only (**J14**).
9. Angry paths: wrong password; join when full (expect waitlist **J7**); reload mid-flow.

**Devices:** one Android Chrome, one iOS Safari (or two phones).

### 7.2 Organizer (`tenant_owner`, ~45 min)

1. Sign in → `/organizer/overview`.
2. Create event with date/time/capacity/location (**J9**).
3. Approve one request; reject one (**J8**).
4. Fill event until waitlist; free a slot; confirm oldest waitlisted promoted (**J7**).
5. Check-in participant; confirm visitor gets review prompt / notification (**J10**).
6. Reply in `/organizer/messages` (**J11**).

### 7.3 Guide (`tenant_guide`, ~20 min)

1. Confirm allowed organizer screens work.
2. Confirm blocked actions (if any) fail in UI **and** return 401/403 from API.
3. Spot-check cannot open `/admin/*`.

### 7.4 Platform admin (~20 min)

1. `/admin/overview` loads.
2. Report from visitor appears; filter audit log `content_report` (**J15**).
3. Sanity: locations / events / users lists load (deep CRUD can be P1).

### 7.5 Cross-cutting sessions

| Session | Focus |
|---------|--------|
| Returning user | Existing join + messages persist after refresh |
| Poor network | Throttle to Slow 3G; join + chat degrade without white screen |
| Desktop | Organizer tables usable at ≥1280px |
| Capacitor Android | Install staging/prod build; deep link into `/trip/:id` when configured |

---

## 8. Non-functional checklist

### Security

- [ ] Production JWT secrets generated (`openssl rand -hex 64` × 2); not CI placeholders
- [ ] Seed README passwords **not** valid in production
- [ ] Google OAuth client restricted to prod origins / redirect URIs
- [ ] Stripe webhook signature verified; test mode keys never in prod
- [ ] MinIO/S3 credentials rotated; buckets not world-writable
- [ ] Auth/OTP endpoints rate-limited (helmet + global limiter already in API — verify behavior under abuse)
- [ ] CORS / cookie settings correct for `https://uaetrail.com`

### Performance & resilience

- [ ] Staging load smoke on discovery + trip detail
- [ ] Mongo indexes adequate for location/event list queries (watch slow queries during load)
- [ ] Brief Redis or MinIO outage: API returns clear errors; FE shows recoverable UI
- [ ] SSE chat: several concurrent connections without API hang

### Compatibility

- [ ] Chrome Android, Safari iOS, desktop Chrome/Firefox/Safari latest-1
- [ ] Capacitor Android smoke if shipping Play build

### Observability & ops

- [ ] `/health` monitored (uptime check)
- [ ] Structured logs + trace id usable for join + checkout incidents
- [ ] Sentry (or equivalent) on FE + API — or deferred in §10
- [ ] Atlas backup / restore drill once
- [ ] Rollback: previous Docker image tag + `docker compose up -d` procedure written

---

## 9. Phased ship plan

| Phase | Scope | Exit criteria |
|-------|--------|---------------|
| 0 — Dogfood | Team on staging, 3–5 days | P0 journeys PASS; bug burn-down to zero P0 |
| 1 — Closed beta | 10–20 invited users on **production web** | G1–G5 PASS; no Sev-1 in 48h |
| 2 — Public web | Marketing / SEO open | G7 addressed; launch captain on-call |
| 3 — Android | Play track | [ANDROID_RELEASE.md](ANDROID_RELEASE.md) + deep links |
| 4 — iOS / IAP | App Store | [IOS_RELEASE.md](IOS_RELEASE.md); IAP if digital unlock |

Do not open stores until Phase 1 is calm.

---

## 10. Known deferred (template)

Only allowed for non-blocking or explicitly soft gates. Copy into the release ticket.

| Item | Why deferred | Owner | Due (≤30 days) | Risk if slips |
|------|--------------|-------|----------------|---------------|
| e.g. Native FCM push | Web push enough for v1 | | | Missed re-engagement |
| e.g. Stripe live checkout | Affiliate links only at launch | | | No in-app paid shop |

---

## 11. Two-week execution plan

### Week 1 — Stabilize & prove

| Day | Focus |
|-----|--------|
| 1–2 | Freeze P0 list (§4); map owners; stand up staging DB + OAuth/SMTP/Stripe test |
| 2–3 | Expand API tests: RBAC denies, join/waitlist edges, webhook |
| 3–4 | Add Playwright for J1, J6, J8, J11, J14 |
| 5 | Security + secrets audit; fix launch blockers |

### Week 2 — Humans & deploy

| Day | Focus |
|-----|--------|
| 1–2 | Full role UAT (§7) on staging; file bugs P0–P3 |
| 3 | Fix P0/P1; re-run CI + P0 E2E + smoke |
| 4 | Production deploy per [PRE_DEPLOY_CHECKLIST.md](PRE_DEPLOY_CHECKLIST.md); production smoke |
| 5–6 | 48h watch; then closed beta → public per §9 |

**Daily (15 min):** P0 open count, staging green?, external blockers (DNS, OAuth, SMTP) only.

---

## 12. Production smoke (after deploy)

Run immediately on production (non-destructive where possible). Prefer a dedicated smoke account, not personal admin.

- [ ] `curl https://uaetrail.com/health` (or documented health URL) OK
- [ ] Sign up → verify email → sign in (**J1**)
- [ ] Google sign-in web (**J3**)
- [ ] Join trip happy path (**J6**) — use a throwaway trip if needed
- [ ] Report a community post (**J13**)
- [ ] Admin audit log filter `content_report` (**J15**)
- [ ] Export data on smoke user; **delete only a labeled smoke user** (**J14**)

Full VPS steps remain in [PRE_DEPLOY_CHECKLIST.md](PRE_DEPLOY_CHECKLIST.md).

---

## 13. Severity & triage

| Sev | Definition | Launch impact |
|-----|------------|---------------|
| P0 | Blocks core journey, data loss, security, or store rejection | Must fix before go |
| P1 | Major flow broken with workaround missing | Fix before public; OK for dogfood only if rare |
| P2 | Broken edge / UX polish | May defer with §10 |
| P3 | Cosmetic / nice-to-have | Backlog |

---

## 14. Sign-off

| Role | Name | Date | Verdict |
|------|------|------|---------|
| Launch captain | | | GO / NO-GO |
| Eng (API) | | | |
| Eng (FE / mobile) | | | |
| Product / ops (UAT) | | | |

**Release candidate:** git SHA _______________ · staging URL _______________ · prod URL `https://uaetrail.com`

---

## Appendix A — Quick route map (FE)

| Area | Paths |
|------|--------|
| Public | `/` `/discovery` `/trail/:id` `/camp/:id` `/trips` `/trip/:id` `/community` `/shop` `/product/:id` `/operator/:id` |
| Auth | `/signup` `/signin` `/verify` `/forgot-password` |
| Visitor app | `/profile` `/my-requests` `/messages` `/notifications` `/my-rewards` |
| Organizer | `/organizer/overview` `events` `requests` `team` `profile` `locations` `history` `messages` |
| Admin | `/admin/overview` `locations` `organizers` `events` `users` `audit-log` `settings` `shop` |
| Legal | `/terms` `/privacy` `/faq` |

## Appendix B — API areas (from architecture)

| Mount | Responsibility |
|-------|----------------|
| `/auth` | JWT + refresh, verify, password |
| `/` user router | Discovery, join requests, `/me/*` |
| `/organizer` | Events, check-in, approvals (`x-tenant-id`) |
| `/admin` | Platform ops + audit |
| `/shop` | Products, Stripe checkout |
| `/social` | Posts, reviews, favorites, reports |
| `/chat` `/media` | Messaging + uploads |

## Appendix C — Existing API test files

`auth`, `jwt`, `health`, `capacity`, `join-request`, `join-request-flow`, `chat-policy`, `chat-stream`, `sse-ticket`, `premium`, `account-deletion`, `user-activity`, `event-schedule`, `datetime`, `locations-list`, `location-query`.

Frontend Vitest today: util-level only (`authRedirect`, `locationSearch`) — not a substitute for journey UAT.
