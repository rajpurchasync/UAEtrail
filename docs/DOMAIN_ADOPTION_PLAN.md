# Domain naming adoption plan

> **Status: execution largely complete (checklist archive).** For **current** routes, buddy Organize (`canPublish`), and Pro/business entry, use [`MEMBER_MODEL.md`](./MEMBER_MODEL.md) (§ Naming vocabulary) and [`NAVIGATION.md`](./NAVIGATION.md). Rows below that mention `/become-host` as a product surface are **historical** rename notes, not the live entry map (`/profile/pro-membership`).

Companion to [`DOMAIN.md`](./DOMAIN.md). Goal: converge **frontend symbols and file names** on Place · Activity · Organisation · Person without breaking URLs, API paths, or Mongo collections.

## Principles

1. **Routes and API paths stay stable** unless there is a deliberate migration (not in this plan).
2. **Rename files/exports, not behavior** — each PR should be mechanical where possible.
3. **Aliases before breaking changes** — keep `LocationDTO` etc. in shared-types; add domain names and migrate imports.
4. **One concept per PR** — easier review, easier rollback.
5. **New code uses domain names** — legacy names only in untouched files until their phase lands.

## What we will not rename (stable layer)

| Layer | Keep as-is |
|-------|------------|
| Mongo collections | `locations`, `activities`, `tenants`, `merchant_profiles`, `users` |
| HTTP paths | `/locations`, `/host/*`, `/admin/locations`, `/shop/merchant/*`, `/operator/:id` |
| Auth / roles | `tenant_owner`, `merchant_admin`, `x-tenant-id` |
| Public URLs | `/trail`, `/camp`, `/event`, `/activity`, `/shop`, `/member` |
| Activity naming | Already aligned — touch only for consistency sweeps |

## Target end state (frontend)

| Domain | Preferred types | Preferred components/pages | Legacy shim (temporary) |
|--------|-----------------|----------------------------|-------------------------|
| Place | `PlaceDTO`, `PlaceStatus` | `PlaceSelect`, `SubmitPlaceForm`, … | re-export `LocationDTO = PlaceDTO` optional |
| Activity | `ActivityDTO` | (unchanged) | — |
| Organisation | `OrganisationProfile`, shop uses `ShopOrganisationDTO` | `organisation/*`, `OrganisationConsole*` | `Host*` re-exports, `/host/*` routes |
| Person | `PersonProfile` (public), keep `User` for auth | `MemberProfile` route OK | `UserDTO` for auth/admin |

---

## Phase 0 — Guardrails (done)

- [x] `docs/DOMAIN.md` glossary
- [x] Page renames: `AdminPlaces`, `HostPlaces`, `OrganisationProfile`, `OrganisationManage`
- [x] Type aliases: `PlaceDTO`, `PlaceStatus`, `ShopOrganisationDTO`
- [x] Unified `/organisation/manage`

**Next:** add this plan; link from `DOMAIN.md`; optional ESLint comment rule in PR checklist only.

---

## Phase 1 — Types & client facade aliases

**Goal:** Domain names usable everywhere in `src/` without touching the network layer.

**Status:** Done (2026-03).

**Scope**

1. **shared-types** — done
2. **`src/api/services.ts`** — done (aliases + `@deprecated` on legacy names)
3. **Call sites migrated:** `AdminPlaces`, `HostPlaces`, `OrganisationProfile`, `ShopOrganisationPanel`

**PR size:** 1 PR  
**Risk:** Low  
**Done when:** New code can import domain names; typecheck passes; zero behavior change.

---

## Phase 2 — Place components & path unification

**Status:** Done (2026-03).

**Scope completed**

- Renamed UI components: `PlaceSelect`, `PlaceDetailTabs`, `PlacesMap`, `SubmitPlaceForm`, etc.
- Legacy `Location*` / `ExploreLocation*` names re-export from new files (nothing removed).
- Canonical paths: `src/utils/placePaths.ts`; `share.ts` and `venueDetailDisplay.ts` delegate there.
- Explore: `explorePlacesPath()` (URL panel still `venues`); map search copy → “Search places…”.
- Activity scheduling: `placeOptions` prop (+ deprecated `venueLocations`); labels → “Place”.

**Rename map (file → file)**

| Current | Target |
|---------|--------|
| `SubmitLocationForm.tsx` | `SubmitPlaceForm.tsx` |
| `LocationSelect.tsx` | `PlaceSelect.tsx` |
| `LocationDetailTabs.tsx` | `PlaceDetailTabs.tsx` |
| `LocationCardActions.tsx` | `PlaceCardActions.tsx` |
| `LocationCatalogCardFrame.tsx` | `PlaceCatalogCardFrame.tsx` |
| `LocationDirectionLinks.tsx` | `PlaceDirectionLinks.tsx` |
| `LocationsMap.tsx` | `PlacesMap.tsx` |
| `MapLocationPicker.tsx` | `MapPlacePicker.tsx` (or keep — map picker is generic) |
| `ActivityLocationPinField.tsx` | `ActivityPlacePinField.tsx` |
| `ExploreLocationMapPreview.tsx` | `ExplorePlaceMapPreview.tsx` |
| `CreatePlacePicker.tsx` | explore compose map pin picker |

**Also**

- Migrate `AdminPlaces`, `HostPlaces`, trail/camp/event detail pages to import `PlaceDTO` instead of `LocationDTO`.
- Rename local variables `locations` → `places` in admin/host place pages (readability).
- Update `src/components/ui/index.ts` barrel exports + re-export shims:
  - `export { PlaceSelect as LocationSelect }` for one release if needed.

**PR size:** 2–3 PRs (ui/ → explore/ → page variable cleanup)  
**Risk:** Medium (many imports)  
**Done when:** No `Location*` component filenames except deprecated re-export stubs (then remove stubs in Phase 2b).

---

## Phase 3 — Organisation frontend

**Goal:** Product language “organisation” for business hosts; `/host/*` routes unchanged.

### 3a — Public & manage (small)

- [x] `OrganisationProfile`, `OrganisationManage` (done)
- [x] Rename `HostPublicProfile` → `OrganisationPublicProfile` (file + export); keep prop `mode: 'public' | 'owner'`.
- [x] `OrganisationProfile` uses `OrganisationPublicProfile` + `getOrganisationProfile()`.
- Shop panel: use `ShopOrganisationDTO` in `ShopOrganisationPanel`.

### 3b — Host console framing (medium)

Rename **pages** (routes unchanged):

| Current | Target | Route | Status |
|---------|--------|-------|--------|
| `HostOverview.tsx` | `OrganisationConsoleOverview.tsx` | `/host/overview` | done |
| `HostActivities.tsx` | `OrganisationActivities.tsx` | `/host/activities` | done |
| `HostRequests.tsx` | `OrganisationJoinRequests.tsx` | `/host/requests` | done |
| `HostTeam.tsx` | `OrganisationTeam.tsx` | `/host/team` | done |
| `HostProfile.tsx` | `OrganisationPublicProfileEdit.tsx` | `/host/profile` | done |
| `HostHistory.tsx` | `OrganisationHistory.tsx` | `/host/history` | done |
| `HostPlaces.tsx` | (done) | `/host/locations` | done |

Rename **layout shell:**

| Current | Target | Status |
|---------|--------|--------|
| `HostShell.tsx` | `OrganisationConsoleShell.tsx` | done (legacy re-export) |
| `HOST_DASHBOARD_LINKS` | `ORGANISATION_CONSOLE_LINKS` (same URLs) | done |

Rename **folder** (optional, one PR):

- `src/components/host/` → `src/components/organisation-console/` for console-specific pieces
- Keep `become-host` flow name OR rename to `become-organisation` page file with route `/become-host`

### 3c — Become-host flow copy (small)

- [x] UI strings use **Host** / **Guide** / **Agency** / **Shop** in product copy (see `hostCopy.ts`, `DOMAIN.md`).
- Keep “guide” as subtype label for individual hosts.
- [x] File names: `MobileBecomeHostFlow` → `MobileBecomeOrganisationFlow` (route unchanged; legacy re-export kept).

**PR size:** 3–4 PRs  
**Risk:** Medium (routing imports, mobile menu, profile chips)  
**Done when:** No user-facing “Manage host” for org console; `Host*` page filenames gone; `/host/*` still works.

**Phase 3 status:** complete (2026-09-13).

---

## Phase 4 — Person terminology (light touch)

**Goal:** Clarify Person vs auth User without renaming auth.

**Do**

- [x] Document in `DOMAIN.md`: `User` = auth account; `Person` = member identity in product copy.
- [x] Public profile: `PersonPublicProfileDTO` alias for `PublicMemberProfileDTO`; `getPersonPublicProfile()` alias.
- [x] Admin: keep `AdminUsers` — nav label renamed to “Members”.
- Explore: already uses `ExploreMapPersonDTO` — keep expanding there.

**Do not**

- Rename `UserDTO`, `AuthContext`, `/auth/*`, or role enums in this phase.

**PR size:** 1 PR (mostly copy + optional alias)  
**Risk:** Low  
**Done when:** Glossary + nav labels consistent; no auth renames.

**Phase 4 status:** complete (2026-09-13).

---

## Phase 5 — Admin & legacy sweep

**Goal:** Admin UI matches domain vocabulary.

| Current | Target | Route | Status |
|---------|--------|-------|--------|
| `AdminHosts.tsx` | `AdminOrganisations.tsx` | `/admin/hosts` | done |
| Admin nav “Hosts” | “Organisations” | | done |
| `AdminShop.tsx` | keep or `AdminShops` | `/admin/shop` | unchanged |

- [x] Migrate remaining `getAdminLocations` call sites → `getAdminPlaces` (`AdminActivities`).
- [x] Remove deprecated `Location*` component re-exports from `src/components/ui/index.ts`.
- [x] Update `IMPLEMENTATION_GUIDE.md` references (stale page names).

**PR size:** 1–2 PRs  
**Risk:** Low  
**Done when:** Admin console labels match domain; no stale docs for renamed pages.

**Phase 5 status:** complete (2026-09-13).

---

## Phase 6 — Backend (optional, long-term)

**Frontend migration complete.** Phase 6a adds an explicit link without breaking `merchantId`-keyed commerce data.

### 6a — Explicit tenant ↔ merchant link (done)

- [x] Add optional `tenantId` on `merchant_profiles` (domain type + Mongo).
- [x] Set `tenantId` on become-host shop approval and ShopManage sync.
- [x] Backfill migration: shop tenants ↔ merchants by `ownerId`.
- [x] Sparse unique index on `merchant_profiles.tenantId`.
- [x] Expose `tenantId` on `MerchantProfileDTO` / shop API responses.
- [x] Helpers: `linkMerchantProfileToShopTenant`, `findMerchantProfileByTenantId`.

### 6b — API wire aliases

- [x] **6b-i** Tenant profile JSON: dual keys `hostDetails` + `organizerDetails`, `shopId` + `merchantId`.
- [x] **6b-i** `/me/host-details` PATCH: returns domain keys alongside legacy keys.
- [x] **6b-i** Frontend reads `hostDetails` / `shopId` first with legacy fallbacks.
- [x] **6b-ii** Admin place routes: `GET|POST /admin/places`, `PATCH|DELETE /admin/places/:id` (legacy `/admin/locations*` kept).
- [x] **6b-ii** Store alias `listAdminPlacesPaged`; frontend `getAdminPlaces` uses `/admin/places`.
- [x] **6b-iii** OpenAPI domain tags (`Places`, `Host`, `Shop`, `Members`, …) + documented `/admin/places`.
- [x] **6b-iv** Shop wire aliases: dual keys `shopId`/`merchantId` on profile + public shop JSON; scope queries accept `shopId`/`tenantId`.
- [x] **6b-iv** Routes `/shop/organisation/*` (manage) and `/shop/shops/:id` (public) alongside legacy `/shop/merchant/*` and `/shop/merchants/:id`.
- [x] **6b-iv** Frontend shop organisation client uses `/shop/organisation/*` and `shopId` body/query keys.
- [ ] Collapse `merchant_profiles` into `tenants` (data migration + product FK changes).

**Phase 6b-i status:** complete (2026-09-13).

**Phase 6b-ii/iii status:** complete (2026-09-13).

**Phase 6b-iv status:** complete (2026-09-13).

**Phase 6a status:** complete (2026-09-13).

---

## Phase 7 — Terminology alignment (UI + exports)

**Goal:** Stop mixing **User** (auth), **Person/Member** (identity), **Organisation** (business), and **Host** (RBAC role / legacy route prefix).

### 7a — Admin & member admin (done)

- [x] `AdminUsers` → `AdminMembers` export; nav already “Members”.
- [x] Member type badges: “Host owner”, “Guide”, “Host staff”.
- [x] Admin overview: “Total members”, “Pending host applications”.
- [x] API aliases: `getAdminMembers`, `getAdminOrganisationApplications`.

### 7b — Host console copy (done; refined in Phase 12)

- [x] Console title “Host”; profile hub “Host console”.
- [x] `HostHubSections` → `OrganisationHubSections` (code name); UI says “Host profiles”.
- [x] `HostPlaces` → `OrganisationPlaces` (code name); route `/host/locations` unchanged.
- [x] Activity forms: “Organisation” not “Host organization”.
- [x] Become-host page copy aligned; explore cards “Organisation”.

### 7c — Hooks, shared-types, organisation-console folder (done)

- [x] Rename hooks: `useHostGate` → `useOrganisationGate`, `useHostHubData` → `useOrganisationHubData` (shims kept).
- [x] `HostApplication` wire types in shared-types (aliases only).
- [x] Move `components/host/` → `components/organisation-console/` (legacy shims in `components/host/`).
- [x] Backend error messages: “Merchant” → “Shop organisation” (error codes unchanged).
- [x] Removed `components/host/` re-export shims (Phase 9).

**Phase 7 status:** complete (2026-09-13).

---

## Phase 8 — Organisation API alias adoption (done)

**Goal:** Use domain-named client methods for organisation console flows; keep `/host/*` HTTP paths unchanged.

- [x] Activity aliases: `createOrganisationActivity`, `publishOrganisationActivity`, `duplicateOrganisationActivity`, `cancelOrganisationActivity`, `updateOrganisationActivity`.
- [x] Join request aliases: `decideOrganisationJoinRequest`.
- [x] Team aliases: `createOrganisationTeamMember`, `updateOrganisationTeamMemberRole`, `toggleOrganisationTeamMemberStatus`, `removeOrganisationTeamMember`.
- [x] Migrated call sites: organisation console pages, `HostedSection`, activity form modal, explore create flow, `AdminActivities`, `HostSelect`.
- [x] Link helpers: `resolveOrganisationProfilePath` (deprecated `resolveHostProfilePath`).
- [x] Profile utils: `resolveProfileOrganisationKind`, `OwnedOrganisationProfileDTO` in share/role helpers.

**Phase 8 status:** complete (2026-09-13).

---

## Phase 9 — Shop public & shim cleanup (done)

**Goal:** Domain names for public shop pages; remove unused `components/host/` re-export folder.

- [x] `ShopPublicDTO` type alias; `getShopPublic()` client alias.
- [x] `ShopPublic` + `ShopContactSection` use shop domain names (legacy `/merchant/:id` redirect unchanged).
- [x] Removed `src/components/host/` re-export shims (no active imports).
- [x] Removed redundant shims inside `organisation-console/` (`HostShell`, `HostPublicProfile`, `MobileBecomeHostFlow` files — exports remain on canonical components).

**Phase 9 status:** complete (2026-09-13).

---

## Phase 10 — Final unification sweep (done)

**Goal:** One vocabulary in active code paths — organisation, shop, place, person — while HTTP routes and Mongo collections stay stable.

- [x] Shop product API aliases + `ShopOrganisationPanel` migration.
- [x] Organisation application/profile API at call sites (`submitOrganisationApplication`, `getOrganisationProfile`, `updateOrganisationDetails`).
- [x] Admin pages use `getAdminMembers`, `OrganisationApplication` types.
- [x] User-facing copy: host console, host profile, FAQs, admin “Total places”.
- [x] Backend user-visible strings (user, admin, shop, activity-pricing, admin-store).
- [x] `BecomeOrganisation` page export; legacy `/become-host` route unchanged.
- [x] shared-types: `PlacePremiumSummaryDTO`, `ShopAnalytics*` aliases.

**Adoption status:** frontend domain migration complete (2026-09-13). Host copy alignment in Phase 12. Deferred: Phase 6b backend tenant/merchant collapse.

### Phase 11 — Filename cleanup (done)

- [x] `becomeOrganisationFlow.ts`, `becomeOrganisationForm.ts` (shims: `becomeHostFlow.ts`, `becomeHostForm.ts`).
- [x] `organisationLinks.ts` (shim: `hostLinks.ts`).
- [x] `useOrganisationActivityFormModal.ts` (shim: `useHostActivityFormModal.ts`).
- [x] Active imports migrated to canonical filenames.

**Phase 11 status:** complete (2026-09-13).

---

## Phase 12 — Host copy alignment (done)

**Goal:** Product language uses **Host** as the publishing umbrella (guide, agency, shop). **Organisation** remains code-only (`Organisation*` filenames, API aliases, `/organisation/manage` route).

- [x] `src/utils/hostCopy.ts` — `hostConsoleLabel()`, `hostProfileLabel()`, `normalizeHostKind()`, etc.
- [x] `docs/DOMAIN.md` — “Host vs Organisation in copy” table.
- [x] Frontend sweep: admin, console, become-host, explore cards, mobile menu, activity forms, profile hub.
- [x] Backend user-visible strings: user routes, admin notifications, shop errors, activity-pricing.
- [x] Reverted mid-adoption “organisation profile” UI strings where they conflicted with solo guides.

**Phase 12 status:** complete (2026-09-13).

---

## Phase 13 — Orphan cleanup & canonical routing (done)

**Goal:** Remove dead Host-era trees, zero-import shims, and finish host-language residue in live UI.

- [x] Deleted `components/host/` duplicate tree and unrouted legacy pages (`Host*`, `OperatorProfile`, `AdminLocations`, `MerchantDashboard`).
- [x] Removed zero-import shims (`hostLinks`, `useHostGate`, `useHostHubData`, `useHostActivityFormModal`, `becomeHostFlow/Form` files, account `HostHubSections` shim).
- [x] Canonical page file: `BecomeOrganisation.tsx` (routes `/become-host`, `/become-organizer` unchanged).
- [x] **experiment-ui (2026-09):** Consumer surface is `BecomeHost.tsx` + `BecomeHostFlow.tsx`; duplicate Organisation page/mobile wizard removed (`becomeHostSurfaceGuard.test.ts`).
- [x] Console nav constant: `HOST_CONSOLE_LINKS` (deprecated alias `ORGANISATION_CONSOLE_LINKS`).
- [x] UI residue sweep: `TenantSwitcher`, activity forms, admin panels, privacy/FAQs.

**Phase 13 status:** complete (2026-09-13).

---

## Phase 14 — Internal identifier alignment (done)

**Goal:** Code identifiers match domain objects — not just UI copy and thin shims.

- [x] Activity forms: `hostTenants`, `canPickHostTenant`, `pickerHostTenants`, `eventHostName`.
- [x] Become-host form: canonical `BecomeOrganisationFormState`, `buildBecomeOrganisationFormPrefill`.
- [x] **experiment-ui:** canonical `BecomeHostFormState` in `becomeHostForm.ts` (Organisation names deprecated aliases only).
- [x] Auth signup: `hostName` param (wire: `organizationName`).
- [x] Menu/auth utils: `isHostConsoleRole`, `hostConsoleRoles`, `askHost`.
- [x] Profile helpers: canonical `resolveProfileHostKind`.
- [x] Console nav: canonical `HOST_CONSOLE_LINKS`.

**Phase 14 status:** complete (2026-09-13).

**Adoption status:** frontend domain migration, host copy, orphan cleanup, and internal identifier alignment complete. Deferred: Phase 6b backend tenant/merchant collapse.

---

## Suggested implementation order

```
Phase 1  →  Phase 2  →  Phase 3  →  Phase 4  →  Phase 5  →  Phase 6a  →  Phase 12–14  →  Phase 6b-i  →  Phase 6b-ii/iii  →  Phase 6b-iv  →  Phase 6b (collapse)
```

**Start with Phase 1** — highest leverage, lowest risk. Then Phase 2 (Place components) because it touches the most files but is mechanical.

---

## PR checklist (every phase)

- [ ] `npm run typecheck` + `npm run typecheck:api`
- [ ] `npm run test:frontend` (at least affected tests)
- [ ] No route path changes unless explicitly in scope
- [ ] `DOMAIN.md` updated if new aliases or page renames
- [ ] Deprecated symbols have JSDoc + remaining usages listed in PR description

---

## React patterns — keep vs rename

| Pattern | Verdict |
|---------|---------|
| `*Detail` for typed URLs (`TrailDetail`) | **Keep** |
| `*Public` for unauthenticated org/shop pages | **Keep** |
| `*Manage` / `*Console` for owner tools | **Keep** — prefer `OrganisationConsole*` over `Host*` |
| `*Shell` layout wrappers | **Keep** |
| `Dashboard` | **Replace** with `Console` or `Manage` in new names |
| `Merchant*` | **Replace** with `ShopOrganisation*` in frontend |
| `Location*` components | **Replace** with `Place*` |

---

## Metrics (track as we go)

| Metric | Baseline (2026-03) | Target |
|--------|-------------------|--------|
| `PlaceDTO` imports in `src/` | 2 pages (`AdminPlaces`, `HostPlaces`) | All place pages + components |
| API method aliases used | Admin + host place + org manage flows | Broader adoption in Phase 2+ |

---

## Phase 1 implementation (completed)

1. Added place, organisation, and shop org aliases in `services.ts` (delegate to legacy methods).
2. Marked legacy names `@deprecated` in JSDoc — **all legacy methods retained**.
3. Migrated `AdminPlaces`, `HostPlaces`, `OrganisationProfile`, `ShopOrganisationPanel`.
4. Added `src/api/services.domain-aliases.test.ts` to guard against accidental removal.
