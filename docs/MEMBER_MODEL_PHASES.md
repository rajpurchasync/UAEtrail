# Member / host model — implementation phases

**Canonical map:** [`MEMBER_MODEL.md`](./MEMBER_MODEL.md) · **Product domain:** [`DOMAIN.md`](./DOMAIN.md) § accounts.

Tracks work from host/buddy promotion (Oct 2026) and earlier explore audits. **Status key:** ✅ done · 🔄 in progress · ⬜ queued.

---

## Phase 1 — Single resolver (API) ✅

| Item | Status |
|------|--------|
| `tenants.publishingPurpose` (`community` \| `professional` \| `business`) | ✅ |
| `resolveMemberHostStatus` → `GET /me/host-status` | ✅ |
| Buddy tenant + owner membership backfill | ✅ |
| `HostStatusDTO.hostTiers`, `profileRoleLabel`, `canAccessHostConsole` | ✅ |
| `docs/MEMBER_MODEL.md` spider map | ✅ |

---

## Phase 2 — Client uses wire contract (no `UserRole` product gates) ✅

| Item | Status |
|------|--------|
| `api.getMemberHostStatus()` (canonical client) | ✅ |
| `useMemberHostStatus` / thin `useOrganisationGate` | ✅ |
| `memberProfileRoleLabel()` for display strings | ✅ |
| Profile page uses `profileRoleLabel` from API | ✅ |
| Activities / mobile header → `canAccessHostConsole` | ✅ |
| Organize gate → `/welcome` via `organizePublishGateHref` | ✅ |
| Pro onboarding → `/profile/pro-membership` | ✅ |
| `/become-host` → redirect to Pro Membership | ✅ |
| Remaining `/become-host` links → `PRO_MEMBERSHIP_PATH` | ✅ |
| Buddies `/host/messages` via `canAccessHostConsole` | ✅ |
| `notificationRouting` → Pro Membership for reject/suspend | ✅ |
| `src/config/memberRoutes.ts` | ✅ |

---

## Phase 3 — Public profile + tests ✅

| Item | Status |
|------|--------|
| Shared `resolveMemberProfileRoleLabel` (API domain) | ✅ |
| Public member DTO `profileRoleLabel` aligned with `/me/host-status` | ✅ |
| `member-profile-label.test.ts` | ✅ |
| `member-hub-stats` defaults for older API consumers | ✅ (fields on wire) |

---

## Phase 4 — Publish enforcement & ops ✅

| Item | Status |
|------|--------|
| `POST /host/activities` / publish re-check `signupProfileComplete` | ✅ (`member-publish-gate`) |
| `DEV_RUN` / `SEED_DATA=true` note in dev docs | ✅ |
| Deprecate `POST /host/.../fulfill` call sites (prefer `link-activity`) | ✅ (publish flow uses `link-activity`; legacy guard + `Deprecation` header) |

---

## Phase 5 — Naming cleanup (non-breaking) ✅

| Item | Status |
|------|--------|
| Prefer **host** over **organisation** in new client modules | 🔄 (`memberApi`, `useMemberHostStatus`) |
| Keep `organisationApi` aliases; document in `MEMBER_MODEL.md` | ✅ |
| `GET /me/host-status` → `registerMemberHostStatusRoutes.ts` | ✅ |
| Public profile uses `profileRoleLabel` wire field | ✅ |
| Broader cleanup tracker | [`HOST_CLEANUP_ROADMAP.md`](./HOST_CLEANUP_ROADMAP.md) |

---

## Out of scope here (other threads)

- Explore catalog / OSM venue density (see `EXPLORE_MAP_RUNBOOK`, curated import).
- Wishlist E11 (`WISHLIST_MAP_ALERTS.md`).
- Pro **billing** (tier flags exist; payments later).
