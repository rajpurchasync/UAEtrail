# Host / explore cleanup roadmap

Tracks the **no big-bang** plan from the host-flow audit (Oct 2026). Member tiers and gates: [`MEMBER_MODEL.md`](./MEMBER_MODEL.md).

**Enforcement (Oct 2026):** [`MEMBER_MODEL.md`](./MEMBER_MODEL.md) (§ Naming vocabulary) · `.cursor/rules/host-member-model.mdc` · **`npm run verify:host-member`** (in CI after `typecheck:api`).

**Status:** ✅ done · 🔄 partial · ⬜ queued

---

## P0 — Tenant access + buddy publish (ship blockers)

| Item | Status | Where |
|------|--------|--------|
| Tenant middleware: **owner OR membership** + backfill row | ✅ | `middleware/tenant.ts`, `buddy-host-tenant.ts` |
| Migration: missing owner `tenant_memberships` | ✅ | `mongo-migrations.ts` → `backfillTenantOwnerMemberships` |
| `canPublish` + `profileComplete` on `/me/status` | ✅ | `member-status.ts` |
| Server enforce on create/publish | ✅ | `member-publish-gate.ts` |
| Product docs (`CREATE_FLOW`, `DOMAIN`, `NORTHSTAR` mechanisms) | ✅ | Tier-1 only; [`archive/README.md`](./archive/README.md) for removed plans |

---

## P1 — Deprecated fulfill + UX dead ends

| Item | Status | Where |
|------|--------|--------|
| `POST /host/.../fulfill` deprecated + `Deprecation` header | ✅ | `registerHostDemandFulfillLegacy.ts` |
| Explore `?fulfillIntent=` clears param; no third-party fulfill wizard | ✅ | `useExploreFulfillIntent.ts` |
| Publish graduates find crew via `POST /me/.../link-activity` (non-rideshare only) | ✅ | `organizeActivityPublish.ts`, `exploreApi` |
| **S12** hosted + seeking coherence (transport parent id, unified host peek) | ✅ | [`CREATE_FLOW.md`](./CREATE_FLOW.md), [`SYSTEM_COHERENCE.md`](./SYSTEM_COHERENCE.md) §8.2 — **S12a–d done** |
| FE guard: no `api.fulfillParticipantIntent` | ✅ | `apiLegacyGuard.test.ts` |
| Remove legacy fulfill prefill wiring from explore selection/compose | ✅ | `organizeWizardPrefill` only; `useExploreFulfillIntent` clears deep links |

---

## P1 — Doc hygiene

| Item | Status | Where |
|------|--------|--------|
| Archive index for superseded docs | ✅ | [`docs/archive/README.md`](./archive/README.md) |
| README doc map (member model, API routing, cleanup) | ✅ | `README.md` |
| Compose gates aligned to `/welcome` + Pro Membership | ✅ | `CREATE_FLOW.md`, `composeFlowCatalog.ts` |

---

## P2 — Route / client shrink

| Item | Status | Where |
|------|--------|--------|
| Extract legacy fulfill route from `host.ts` | ✅ | `routes/host/registerHostDemandFulfillLegacy.ts` |
| `GET /me/status` in dedicated registrar | ✅ | `registerMemberStatusRoutes.ts` |
| Split `host.ts` — team + activity request queue | ✅ | `registerHostTeamRoutes`, `registerHostActivityRequestRoutes` (`/host/requests`) |
| Split remainder of `host.ts` (activities CRUD, roster) | ✅ | `registerHostActivityRoutes.ts`, `registerHostActivityParticipantRoutes.ts` |
| Host submitted locations (`GET/POST /host/locations`) | ✅ | `registerHostSubmittedLocationRoutes.ts` |
| Admin host-application review routes | ✅ | `registerAdminHostApplicationRoutes.ts` |
| Admin activity moderation (`/admin/activities/*`) | ✅ | `registerAdminActivityModerationRoutes.ts` |
| Admin place CRUD (`/admin/places`, `/admin/locations`) | ✅ | `registerAdminPlaceRoutes.ts` |
| Admin dashboard metrics (`GET /admin/metrics`) | ✅ | `registerAdminMetricsRoutes.ts` |
| Admin user list/detail/status (`/admin/users/*`) | ✅ | `registerAdminUserRoutes.ts` |
| Admin tenant oversight (`/admin/tenants/*`) | ✅ | `registerAdminTenantRoutes.ts` |
| Admin social groups (`/admin/groups/*`) | ✅ | `registerAdminGroupRoutes.ts` |
| Admin reports, audit, notifications, products | ✅ | `registerAdminContentReportRoutes.ts`, `registerAdminAuditRoutes.ts`, `registerAdminNotificationRoutes.ts`, `registerAdminProductRoutes.ts` |
| Platform staff grant/revoke (master only) | ✅ | `registerAdminPlatformStaffRoutes.ts` + `platform-master-admin.ts` |
| `admin.ts` mount shell | ✅ | Registers modular `registerAdmin*` only |
| Shrink `legacyApi` / remove unused FE shims | ✅ | `legacyApi.ts` removed; canonical `api` only — `services.domain-aliases.test.ts` |

---

## P2 — Privacy & notification actor labels

| Item | Status | Where |
|------|--------|--------|
| Public profile + media presign | ✅ | `profile-viewer-access`, `media.ts` |
| Join queue: host sees requester identity | ✅ | By design (activity host) |
| Notifications actor names respect `profileVisibility` | ✅ | `notification-actor-label.ts` (buddy, follow, group, publish fan-out) |
| Wishlist profile hydration PII | ✅ | `listWishlistItemsWithDetails` + `profileVisibility` |
| FE smoke matrix (notification + profile edge cases) | ✅ guards | API: `notification-actor-label.test.ts`; FE: `notificationRouting.test.ts`, `notificationConsumerGuard` (bell, inbox, admin, host overview → `inferNotificationPath`); manual QA for edge kinds only |

---

## P3 — Local dev empty map

| Item | Status | Where |
|------|--------|--------|
| `dev:local` console hint for seed + runbook | ✅ | `scripts/dev-local.mjs`, `DEV_RUN.md` |
| Opt-in auto-seed when map empty | ⬜ | Needs API health probe; use manual `SEED_DATA=true` for now |

---

## P4 — Publishing console wire migration (`/operator/*`)

| Item | Status | Where |
|------|--------|--------|
| Canonical FE routes `/operator/*`; legacy `/host/*` + `/organizer/*` redirect | ✅ | `App.tsx`, `surfacePaths.ts` |
| API tenant router `/operator` only; legacy `/host/*` rewritten + deprecation headers | ✅ | `legacy-host-api-rewrite.ts`, `routes/operator/` |
| FE HTTP client uses `/operator/…` for tenant CRUD | ✅ | `src/api/domains/activities.ts`, `organisation.ts`, `places.ts` |
| Chat stays `/chat` only (`/host/messages` redirect) | ✅ | `App.tsx`, `NAVIGATION.md` |
| **`GET /me/status`** (legacy `/me/host-status`, `/me/operator-status` rewritten — no parallel handlers) | ✅ | `registerMemberStatusRoutes.ts`, `legacy-member-status-path-rewrite.ts`, `memberApi.getMemberStatus` |
| Explore map `featuredPerson.role: organizer` (wire `host` compat) | ✅ | `explore-person.ts` |
| `src/pages/operator/*` + `useMemberStatus` | ✅ | `useHostStatus` / `useOperatorStatus` / `pages/host` removed |
| `publish.canAccessPublishingWorkspace` on `/me/status` | ✅ | Wire `canAccessHostConsole` compat on DTO |
| `registerOperatorActivityRoutes` (no `registerHost*` under `routes/operator/`) | ✅ | SN-8 |
| `Deprecation` + `Link` (`rel=alternate`) on legacy `/host/*` and legacy member status URLs | ✅ | `legacy-publishing-path-deprecation.ts` |
| `apiLegacyGuard` bans `api.listHostActivities` / `createHostActivity` / `getHostActivityJoinRequests` outside `src/api` | ✅ | Use tenant-scoped **activity** methods (see SN-3; interim `*Operator*` on `api`) |
| `operatorActivityClientApi` import facade (ban `hostActivityClientApi` outside shim files) | ✅ | `hostMemberGuard`, `publishingConsoleHookGuard` — **rename** to tenant activity client in SN-3 |
| `HostStatusDTO` field rename + drop legacy `/host` API mount | ⬜ | After clients consume `/operator` only |

---

## P5 — Structural naming (bounded context — not Host→Organizer swaps)

**Policy:** [`DOMAIN_CANONICALS.md`](./DOMAIN_CANONICALS.md) §13 · **Guard:** `src/config/moduleNamingGuard.test.ts`

| Phase | Outcome | Status |
|-------|---------|--------|
| **SN-1** | Communication: `MessageMemberButton`; remove `isHostMessages`; shims for `HostMessageButton` / `OrganizerMessageButton`; `COMMUNICATION.md` one inbox | ✅ |
| **SN-2** | Activity manage: `src/activity/*` + `components/activity/*` (no `components/host`, `activity-manage`, or `activity/manage` trees) | ✅ |
| **SN-3** | **Activity-centric client:** `tenantActivityClientApi`, `useMemberStatus`; legacy `operatorActivityClientApi` / status shims only — see [`DOMAIN_CANONICALS.md`](./DOMAIN_CANONICALS.md) §13.2.1 | ✅ |
| **SN-4** | API `routes/operator/` + `operator.ts` mount; `/host` API prefix rewritten (no dual mount) | ✅ |
| **SN-5** | **`GET /me/status`** + `MemberStatusDTO.publish`; client `useMemberStatus` / `getMemberStatus` (legacy `/me/host-status` + shims) | ✅ wire flatten → SN-8 |
| **SN-6** | Explore/Plan/List: no new `Explore*` / `Plan*` / `Browse*` / `List*` exports outside owning folders (`moduleNamingGuard.test.ts`) | ✅ |
| **SN-7** | `App.tsx` lazy symbols `Operator*` not `Host*` for console pages | ✅ |
| **SN-8** | Delete deprecated shims + `registerHost*` operator registrars; canonical `member-status` / `registerOperator*` | ✅ |

**Explicitly out of scope for P5:** renaming Mongo collections; changing public SEO URLs; consumer copy in `workspaceVocabulary.ts` (already separate).

---

## Out of scope (other tracks)

- Explore catalog density, wishlist E11.
- Pro **billing** (flags only today).
