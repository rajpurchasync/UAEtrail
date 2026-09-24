# Engineering plan — production quality bar

**Goal:** A new developer should see intentional architecture, not accumulated experiments. This doc tracks the systematic cleanup after the create-flow / participation-mode work.

**Companion:** [`NORTHSTAR.md`](./NORTHSTAR.md) (product), [`CREATE_FLOW.md`](./CREATE_FLOW.md) (compose), [`NAVIGATION.md`](./NAVIGATION.md) (routes), [`DOMAIN_ADOPTION_PLAN.md`](./DOMAIN_ADOPTION_PLAN.md) (rename burn-down).

---

## Current diagnosis

| Strength | Gap |
|----------|-----|
| Strong product docs | Implementation mid-migration — parallel paths |
| `packages/shared-types` | Requirements strings still used as protocol |
| Explore compose URL contract | `ExploreExperience.tsx` still large (~1.4k lines) — splitting in progress |
| API integration tests on join/RSVP | Frontend ~4.5% test coverage on wizards |

**Root cause:** Spec and shims outpaced consolidation. Two ways to create activities, two detail renderers, alias sprawl.

---

## Phases

| Phase | Focus | Exit criteria |
|-------|--------|---------------|
| **0** | Baseline | CI lint rules, redirect table, this doc |
| **1** | Core loop | Detail unified, wizard tests, join hook started |
| **2** | Explore shell | Split `ExploreExperience`, sheet a11y |
| **3** | Publish contract | One payload builder (explore + host) |
| **4** | Routing hygiene | Signed-in home → `/explore`, single compose create |
| **5** | API cleanup | Split `user.ts`, burn `@deprecated` aliases — see [`CLEANUP_AUDIT.md`](./CLEANUP_AUDIT.md) |
| **6** | Design system | Copy lint, list rows, loading/error patterns |

---

## Phase 0 — done

- [x] `docs/ENGINEERING_PLAN.md` (this file)
- [x] Legacy redirect table in `NAVIGATION.md`
- [x] ESLint: `src/explore/**` must not import `utils/exploreRouting` shim
- [x] `src/content/copyGuard.test.ts` — block hardcoded guest CTAs in consumer surfaces

---

## Phase 1 — done

- [x] `organizeFlow.test.ts` — `validateDraftStep`, step titles
- [x] `ActivityDetail.tsx` → thin container over `ActivityDetailView`
- [x] `useActivityJoinContext` + `useActivityJoinActions` (explore + detail)
- [x] Participation-aware guest join copy

---

## Phase 2 — done

- [x] `ExploreJoinOverlays.tsx` — join modal, withdraw modal, guest sheet
- [x] `ExploreComposeHost.tsx` — FAB menu + organize/find/add wizards
- [x] `ExploreBrowsePanel` — list panel + filters (`exploreBrowsePanelCopy.ts`)
- [x] `ExploreResponsiveSheet` a11y parity with `Dialog` (`useModalA11y`)

---

## Phase 3 — done

- [x] `src/utils/activityPublishPayload.ts` — canonical `buildHostActivityPublishPayload` + participation requirement helpers
- [x] Explore compose (`organizeFlow.ts`) and host console (`activityFormState.ts`) use shared builder
- [x] Host saves now send `participationMode` (events default RSVP; others approval)
- [x] `activityPublishPayload.test.ts` — payload + requirement contract tests

---

## Phase 4 — done

- [x] Signed-in home → `/explore` (enforced in `Home.tsx`)
- [x] `exploreOrganizePath` + `legacyCreateParamToOrganizePath` in `explore/routing.ts`
- [x] `/activities?create=*` redirects to explore compose organize wizard
- [x] Personal hub create CTAs (`Activities`, `HostedSection`) → explore compose, not host modal
- [x] My activities back link → Explore (not marketing `/`)

---

## Phase 5 — done (initial)

- [x] Split `user.ts` (2,370 → ~1,510 lines): schemas + profile, notifications, buddies, groups modules under `apps/api/src/routes/user/`
- [x] Host application routes → `registerHostApplicationRoutes.ts`; host display parsing → `lib/host-display-details.ts`
- [x] Frontend dead-file pass — `docs/CLEANUP_AUDIT.md`; unified client entry `src/api/index.ts`
- [x] Removed deprecated `organizerDetailsSchema` alias (use `hostDetailsSchema`)
- [x] Removed unused `exploreVenuesPath` / `exploreLocationsPath` re-exports
- [x] Activity publish call sites use canonical `createHostActivity` / `publishHostActivity`

---

## Phase 6 — done

- [x] `ConsumerFeedback.tsx` — shared error card, loading spinner, skeleton, inline empty
- [x] `requestStatusClassName` in `joinRequestUi.ts` — one badge palette for hub rows
- [x] Joined / Hosted / Profile hub sections use shared feedback + list row patterns
- [x] Profile / Activities hub sections use shared feedback + list row patterns (`ActivitiesHubView`, explore list rows)
- [x] `PRODUCT_LOAD_ERROR` / `PRODUCT_RETRY_LABEL` in `productNorthStar.ts`
- [x] Extended `copyGuard.test.ts` — profile, explore UI, canonical CTA literals

---

## Phase 7 — mobile tab shell (done)

- [x] Signed-in mobile bottom nav: Map · Activities · Messages (`MobileBottomNav`, `useMobileBottomNav`)
- [x] Activities hub at `/activities?tab=joined` — Upcoming carousel + Suggested rail + sub-views
- [x] Messages inbox — search, All/Unread/Groups/Outings pills, unified `inboxThreads` model
- [x] Unread badge on Messages tab (`useInboxUnreadCount`)
- [x] `MobileTabTitleBar` for Activities/Messages (title left, compose `+` right)
- [x] Seed: `seedMobileInboxDemo` + `SEED_MOBILE_INBOX=true` incremental path
- [x] `docs/NAVIGATION.md` — mobile tab shell section

---

## Phase 8 — member signup profile (done)

- [x] Four-step wizard on `/welcome` (DOB, gender, emirate, languages) — aligned copy with profile management
- [x] `profile.languages` on auth user; `isSignupProfileComplete` server + client
- [x] `MemberDetailsEditFields` shared by signup steps, Edit profile, Settings member details
- [x] Map: emirate fallback center + optional explore location prompt + locate control
- [x] `ProtectedRoute` signup gate for `participant` / `merchant_admin`

---

## Phase 9 — polish (in progress)

- [x] Signup wizard reuses `MemberDetailsEditFields` (`layout="step"`) — one field model with settings / edit profile
- [x] Seed: second demo merchant profile no longer duplicates `tenantId` on `merchant_profiles`
- [x] Post-auth welcome redirect for `participant` + `merchant_admin` (incl. deep-link return targets)
- [x] Seed: `visitor@` / `shop@` have complete member details; `visitor2@` stays incomplete for wizard QA
- [x] Signup gate query invalidated from Profile edit save
- [x] copyGuard scans signup/account surfaces; bans legacy “Confirm your profile”
- [ ] Manual smoke: incomplete member → `/welcome` → explore location prompt → settings edit

---

1. **Spec-first PRs** — user-facing flow changes update `CREATE_FLOW.md` status table.
2. **No new god files** — explore/page components target &lt;400 lines.
3. **One way to do X** — PR checklist: parallel create/join/nav path?
4. **Contract tests** — shared-types changes include API fixture update.
5. **Deprecation budget** — net `@deprecated` count decreases monthly.

---

## Decision log

| Date | Decision |
|------|----------|
| 2026-09-23 | Start Phase 0–1 after participation-mode ship |
| 2026-09-23 | `ActivityDetailView` is canonical detail renderer; page owns fetch + modals |
| 2026-09-23 | Extract `ExploreJoinOverlays` + `ExploreComposeHost` from explore shell |
| 2026-09-23 | Unified activity publish payload in `activityPublishPayload.ts` (explore + host) |
| 2026-09-23 | Consumer create routes through `/explore?compose=organize…`; host console stays on `/host/*` |
| 2026-09-23 | Split `user.ts` into `routes/user/*` modules (schemas, profile, social) |
| 2026-09-23 | Shared consumer feedback + copy guard for hub sections (Phase 6) |
| 2026-09-24 | Member signup profile wizard + profile/settings alignment + route gate (Phase 8) |
