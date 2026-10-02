# UAE Trail — Remediation Plan

Phased fixes from the CTO review. **Phases 1–6 and listed Phase 8 items:** complete. **Phase 7 (privacy / notification actor labels, smoke matrix):** partial — track remaining work in [`docs/HOST_CLEANUP_ROADMAP.md`](docs/HOST_CLEANUP_ROADMAP.md) § P2 and member-model verify (`npm run verify:host-member`). Product/doc truth: [`docs/DOCS_INDEX.md`](docs/DOCS_INDEX.md).

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

---

## Phase 5 — Cross-platform reliability + performance hardening (2026-08)

| # | Item | Status |
|---|------|--------|
| 5.1 | Cookie-based refresh + localStorage auth session persistence baseline | Done |
| 5.2 | Session-safe role switching with identity continuity (`/me/role/switch`) | Done |
| 5.3 | Organizer team and social-group member access toggles (`isActive`) | Done |
| 5.4 | Social content sanitization + batched post/reply/like read paths | Done |
| 5.5 | Mongo index hardening for favorites/social query paths | Done |
| 5.6 | Persisted handoff instructions for future agents/workspaces (`docs/PERFORMANCE_CROSS_PLATFORM_BUGFIX.md`) | Done |

---

## Phase 6 — Explore API architecture cleanup (backlog)

Prerequisite work from the explore/host-display audit. Complete these before Phase 7.

| # | Item | Status |
|---|------|--------|
| 6.1 | **Explore person model:** replace overloaded `hostName` / planned `requesterName` with `featuredPerson: { userId, displayName, avatarUrl, role }` where role is `host` \| `requester` \| `contact`; copy/UI derive labels from role | Done |
| 6.2 | Legacy demand title migration (remove read-time scrubbing in `participant-intents-store` + explore copy) | Done |
| 6.3 | Trip pricing consolidation (`packages/shared-types/src/trip-pricing.ts`; API zod schema + FE badge styling only) | Done |
| 6.4 | Remove `organizerName` from API DTO mappers (compat mirror only) | Done |
| 6.5 | Remove venue pin offset hack in `explore-map.ts` (`+= 0.004`) | Done |
| 6.6 | **Carpool consolidation:** rideshare supply = standalone `activityType: 'rideshare'` only; deprecate `rideshareEnabled` on hiking/camping/event, linked child carpools, and duplicate route fields (`rideshareFromLat` vs `meetingLat`/`startLat`) | Done (create/edit blocked; linked-carpool sync removed; orphaned `linked-carpool.ts` deleted; read-compat for existing linked carpools retained) |

**Completed in this track:** host resolution (shared-types), deprecated FE `organizerName` usage, explore cache invalidation, server-built `presentation`, join-instructions / explore-price / display coords in shared-types, demo accounts module.

**6.1 design (person + role, not name-per-role):** On `ExploreMapItemDTO`, one optional `featuredPerson` carries the user's display name and a contextual **role** (`host`, `requester`, `contact`). Headlines use name + role-driven templates (`"{name} is going Hiking"` vs `"{name} is looking for Hiking"`). Keep `ActivityDTO.hostName` / `hostUserId` as activity-domain fields; keep `tenantName` separate for org brand. Venues may omit `featuredPerson`.

**6.6 design (one rideshare supply model):** Published rideshare is `activityType: 'rideshare'` on the explore map. Legacy linked child carpools remain readable via `linkedRideshareActivityId` on parent activities; new linked carpool creation is blocked.

---

## Phase 7 — Privacy: profiles + activities (backlog)

Two **independent** privacy controls. Both mean **hidden from map discovery**, not fully hidden from the product.

### Locked product model

| Control | Setting | Still visible to | Share link (`/member/:id`, `/activity/:id`) | Explore map |
|--------|---------|------------------|---------------------------------------------|-------------|
| **Profile** | `profileVisibility: private` | Self; admin; **host** (join request/roster); **friends** (shared group); **accepted co-participants** on same trip; share link when authorized | Not anonymously browsable; **hosts still show on their activity card** | Hide **only** users who are private **and** host no published activity |
| **Activity** | `joinMode: private` (first-class field, not requirements text) | Host; approved/waitlisted participants; invited group members | Works for authorized viewers — host can copy/share activity URL | **No** — exclude from `explore/map` payload |

**Principles**

- **Private ≠ invisible.** It blocks **anonymous map/member browse** for users with **no hosted activity**. Hosts with published trips still appear on **activity cards** (name/avatar on that card is OK).
- **Private profile still viewable by:** activity host; **friends** (shared social group); **accepted co-participants** on the same trip; admin; self.
- **Share** = direct URL; recipient must pass authorization — not world-readable.
- Helpers: `resolveProfileViewerAccess` (who can open `/member/:id` and private media) and `shouldHideFromMapMemberDiscovery` (standalone member pins only).

### Phase 7A — Private member profiles

| # | Item | Status |
|---|------|--------|
| 7.1 | **Domain + API:** `resolveProfileViewerAccess` + `buildPublicMemberProfile(viewerContext)` | Done |
| 7.2 | **Shared contract:** `PublicMemberProfileDTO` — `full`, `private` (*"User has set their account private"*), `not_found`; no PII when denied | Done |
| 7.3 | **Settings UI:** profile visibility toggle (Public / Group members / Private) in Security & privacy | Done |
| 7.4 | **Contextual access:** host, friends group, accepted co-participants; anonymous browse denied | Done |
| 7.5 | **Map redaction:** `shouldHideFromMapMemberDiscovery` — private + no hosted activity only; activity cards keep host identity | Done |
| 7.6 | **Downstream wiring:** media presign, join-request review, notifications, favorites — same helper | Partial (media + public profile + host join queue + notification actor labels + **saved profile favorites**; spot-check remaining notification kinds ⬜) |
| 7.7 | **Tests:** API matrix (visibility × viewer); FE smoke for private profile page | Partial (API unit tests done) |

**Current baseline:** `profileVisibility` on user profile; `resolveProfileViewerAccess` gates `/users/:id/public-profile`, brief, and media. Demand map pins filtered for private users with no hosted activities. Activity cards still show host identity. Settings toggle in Security & privacy.

### Phase 7B — Private activities (map-hidden, link-accessible)

| # | Item | Status |
|---|------|--------|
| 7.8 | **Domain field:** `joinMode: 'open' \| 'private'` on activity (migrate from requirements string hack) | Done |
| 7.9 | **Explore map:** filter `joinMode: private` out of `buildExploreMapPayload` | Done |
| 7.10 | **Activity detail:** `resolveActivityViewerAccess` — host, participant, pending invite, group member | Done |
| 7.11 | **Create/edit flows:** persist `joinMode` from mobile + desktop forms | Done |
| 7.12 | **Share UX:** copy activity URL; detail page works for authorized viewers only | Done |

**Current baseline:** `joinMode` stored on activities with migration from legacy requirements text. Private activities excluded from explore map and public activity lists. `/activities/:id` returns a private stub for unauthorized viewers; authorized hosts, staff, participants, waitlisted requesters, and activity group members see full detail. Mobile create sends `joinMode`; desktop host payload includes inferred/stored mode.

---

## Phase 8 — Buddy connections

First-class 1:1 buddy relationships with messaging and profile privacy integration.

| # | Item | Status |
|---|------|--------|
| 8.1 | **Domain model:** `buddy_requests` (pending / accepted / declined / cancelled) + derived accepted **buddy pairs** (canonical user-pair key, unique index) | Done |
| 8.2 | **Store + indexes:** Mongo collection, migrations, idempotent accept/decline, block duplicate pending requests | Done |
| 8.3 | **API routes:** send request, accept, decline, cancel, list incoming/outgoing, list buddies (`/me/buddies`, `/me/buddy-requests`) | Done |
| 8.4 | **Shared-types DTOs:** `BuddyRequestDTO`, `BuddySummaryDTO`, status enums — consumed by web/mobile, not duplicated in FE | Done |
| 8.5 | **Notifications:** request received, accepted (reuse notification pipeline + copy module) | Done |
| 8.6 | **Chat policy:** extend `assertCanMessageUser` — accepted buddies may message regardless of trip/join-request link | Done |
| 8.7 | **Profile UX:** "Add buddy" / "Request sent" / Accept·Decline on member profile; buddies list from profile quick actions (`/buddies`) | Done |
| 8.8 | **Privacy interaction:** respect Phase 7 private profiles — buddy request may still be sent; full profile visible only after accept (or per visibility rules) | Done |
| 8.9 | **Tests:** request lifecycle, duplicate prevention, chat gate after accept/unfriend, notification triggers | Partial (pair key + profile access + unfriend chat block; full lifecycle suite still thin) |

**Current baseline:** First-class 1:1 buddy connections via `buddy_requests` + `buddy_pairs`. Profile quick action opens `/buddies` (view, message, unfriend). Member profile supports add/accept/decline. Accepted buddies can message and view private profiles; unfriend is silent and revokes buddy-only access.

**Architecture**

- Distinct from **social groups** (`family` / `friends` group type and in-group `admin` \| `buddy` **roles**) — Phase 8 is **1:1 user relationships**, not group membership.
- Buddy acceptance creates a durable relationship record; chat policy reads it — do not infer buddies from message threads alone.
- Optional future: show buddies in "who's going" or explore — out of scope until core flow is stable.

**Implementation order:** Phase 6 → Phase 7 → Phase 8.
