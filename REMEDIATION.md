# UAE Trail — Remediation Plan

Phased fixes from the CTO review. **All planned remediation items complete.**

---

## Phase 1 — Stop the bleeding (Week 1)

| # | Item | Status |
|---|------|--------|
| 1.1 | Gate premium unlock behind Stripe checkout (free unlock only when `unlockPriceAed === 0`) | Done |
| 1.2 | Remove `resetToken` from organizer team invite API; email invite link instead | Done |
| 1.3 | Fix auth state desync (no session → clear user) | Done |
| 1.4 | Honor `?redirect=` on sign-in / sign-up | Done |
| 1.5 | Google sign-in error handling | Done |
| 1.6 | `downloadAuthenticatedFile` 401 refresh retry | Done |
| 1.7 | Add `/terms` and `/privacy` pages + routes | Done |
| 1.8 | Lock down local media routes outside dev / without S3 | Done |

---

## Phase 2 — Business integrity (Weeks 2–3)

| # | Item | Status |
|---|------|--------|
| 2.1 | Pessimistic locking on event approval (capacity races) | Done |
| 2.2 | Stripe webhook idempotency (shop + location unlock) | Done |
| 2.3 | Hash email verification / password-reset tokens in DB | Done |
| 2.4 | Consolidate duplicate migration timestamps | Done |
| 2.5 | Stop overwriting global `User.role` on team upsert | Done |
| 2.6 | `users/search` — mask or restrict email exposure | Done |
| 2.7 | Google OAuth explicit link consent | Done |
| 2.8 | Validate Stripe / webhook env at startup | Done |
| 2.9 | `trust proxy` for correct IP behind load balancers | Done |

---

## Phase 3 — Platform maturity (Month 2)

| # | Item | Status |
|---|------|--------|
| 3.1 | TanStack Query for server state (hub hooks) | Done |
| 3.2 | Unify organizer navigation (`OrganizerShell`) | Done |
| 3.3 | Split `Trips.tsx`; remove dead pages | Done |
| 3.4 | Integration + frontend smoke tests | Done |
| 3.5 | `ProtectedRoute` for `/profile`, `/my-rewards` | Done |
| 3.6 | Accessible `Dialog` + key modals (`AccountEditModal`, `CreateTripModal`, `WithdrawRequestModal`, `BookingModal`) | Done |
| 3.7 | Hide `/membership` nav when feature flag off | Done |
| 3.8 | Location geo filter — DB-side query | Done |
| 3.9 | Chat spam controls / relationship checks | Done |

---

## Phase 4 — Scale & polish (ongoing)

| # | Item | Status |
|---|------|--------|
| 4.1 | WebSocket / SSE for chat | Done |
| 4.2 | Presign key tracking in Redis for media commit | Done |
| 4.3 | OpenAPI spec gated in production | Done |
| 4.4 | Graceful Redis disconnect on shutdown | Done |
| 4.5 | Reduce `lastActiveAt` write amplification | Done |
