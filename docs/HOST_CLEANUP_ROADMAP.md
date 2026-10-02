# Host / explore cleanup roadmap

Tracks the **no big-bang** plan from the host-flow audit (Oct 2026). Member tiers and gates: [`MEMBER_MODEL.md`](./MEMBER_MODEL.md) · [`MEMBER_MODEL_PHASES.md`](./MEMBER_MODEL_PHASES.md).

**Enforcement (Oct 2026):** [`MEMBER_MODEL.md`](./MEMBER_MODEL.md) (§ Naming vocabulary) · `.cursor/rules/host-member-model.mdc` · **`npm run verify:host-member`** (in CI after `typecheck:api`).

**Status:** ✅ done · 🔄 partial · ⬜ queued

---

## P0 — Tenant access + buddy publish (ship blockers)

| Item | Status | Where |
|------|--------|--------|
| Tenant middleware: **owner OR membership** + backfill row | ✅ | `middleware/tenant.ts`, `buddy-host-tenant.ts` |
| Migration: missing owner `tenant_memberships` | ✅ | `mongo-migrations.ts` → `backfillTenantOwnerMemberships` |
| `canPublish` + `signupProfileComplete` on `/me/host-status` | ✅ | `member-host-status.ts` |
| Server enforce on create/publish | ✅ | `member-publish-gate.ts` |
| Product docs (`CREATE_FLOW`, `DOMAIN`, `NORTHSTAR` mechanisms) | ✅ | `DOMAIN`, `RELEASE_READINESS`, flow docs; archive index for historical plans |

---

## P1 — Deprecated fulfill + UX dead ends

| Item | Status | Where |
|------|--------|--------|
| `POST /host/.../fulfill` deprecated + `Deprecation` header | ✅ | `registerHostDemandFulfillLegacy.ts` |
| Explore `?fulfillIntent=` clears param; no third-party fulfill wizard | ✅ | `useExploreFulfillIntent.ts` |
| Publish links demand via `POST /me/.../link-activity` | ✅ | `organizeActivityPublish.ts`, `exploreApi` |
| FE guard: no `api.fulfillParticipantIntent` | ✅ | `apiLegacyGuard.test.ts` |
| Remove fulfill prefill props from compose (optional shrink) | ⬜ | `ExploreComposeHost` still accepts `fulfillIntentPrefill` for reorganize |

---

## P1 — Doc hygiene

| Item | Status | Where |
|------|--------|--------|
| Archive index for superseded docs | ✅ | [`docs/archive/README.md`](./archive/README.md) |
| README doc map (member model, API routing, cleanup) | ✅ | `README.md` |
| Experiment flow docs aligned to `/welcome` + Pro Membership | ✅ | `docs/experiment/flows/*`, `flows/README.md` |

---

## P2 — Route / client shrink

| Item | Status | Where |
|------|--------|--------|
| Extract legacy fulfill route from `host.ts` | ✅ | `routes/host/registerHostDemandFulfillLegacy.ts` |
| `GET /me/host-status` in dedicated registrar | ✅ | `registerMemberHostStatusRoutes.ts` |
| Split `host.ts` — team + activity request queue | ✅ | `registerHostTeamRoutes`, `registerHostActivityRequestRoutes` (`/host/requests`) |
| Split remainder of `host.ts` (activities CRUD, check-in, places) | ⬜ | `tenantActivitiesRouter` still in `host.ts` |
| Shrink `legacyApi` / remove unused FE shims | ✅ | `legacyApi.ts` removed; canonical `api` only — `services.domain-aliases.test.ts` |

---

## P2 — Privacy 7.6 (REMEDIATION)

| Item | Status | Where |
|------|--------|--------|
| Public profile + media presign | ✅ | `profile-viewer-access`, `media.ts` |
| Join queue: host sees requester identity | ✅ | By design (activity host) |
| Notifications actor names respect `profileVisibility` | ✅ | `notification-actor-label.ts` (buddy, follow, group, publish fan-out) |
| Favorites profile hydration PII | ✅ | `listUserFavoritesWithDetails` + `profileVisibility` |
| 7.7 FE smoke matrix | ⬜ | `REMEDIATION.md` Phase 7 |

---

## P3 — Local dev empty map

| Item | Status | Where |
|------|--------|--------|
| `dev:local` console hint for seed + runbook | ✅ | `scripts/dev-local.mjs`, `DEV_RUN.md` |
| Opt-in auto-seed when map empty | ⬜ | Needs API health probe; use manual `SEED_DATA=true` for now |

---

## Out of scope (other tracks)

- Explore catalog density, wishlist E11, full `host.ts` modularization.
- Pro **billing** (flags only today).
