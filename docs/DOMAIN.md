# UAE Trail — Domain model

This glossary maps **product concepts** to **code and routes**. Use it when naming pages, DTOs, and PRs. Routes and API paths stay stable during renames; component and file names should converge on domain language over time.

## Core objects

| Domain | What it is | Code / storage | Public URL | Explore map |
|--------|------------|----------------|------------|-------------|
| **Place** | A physical venue: trail, camp, or event location | `locations`, `LocationDTO`, `activities-store` venue helpers | `/trail/:id`, `/camp/:id`, `/event/:id` | Yes (venue pins) |
| **Activity** | A scheduled trip hosted at a place | `activities`, `ActivityDTO` | `/activity/:id` | Yes |
| **Organisation** | A business that hosts trips or sells gear — guide, agency, or shop | `tenants`, `TenantProfile`, `merchant_profiles` (shops) | Guide/agency: `/operator/:slug` · Shop: `/shop/:id` | Physical shops only |
| **Person** | A member's public identity on the platform | `users` (profile fields), `/member/:id`, explore demand cards | `/profile`, `/member/:id` | Via demand cards only |
| **User** | Auth account (login, roles, suspension) | `users`, `UserDTO`, `AuthContext` | `/signin`, `/signup` | — |

**Participation** (join requests, check-in, reviews) links **Person ↔ Activity ↔ Place**. **Hosting** links **Organisation ↔ Activity** (and shop **Organisation ↔ featured outbound links**).

## Person vs User

| Term | Meaning | Use in new code |
|------|---------|-----------------|
| **Person** | Who someone is on the trail — profile, bio, explore card, `/member/:id` | Product copy, `PersonPublicProfileDTO`, `personProfilePath()`, `ExploreMapPersonDTO` |
| **User** | Auth account — email, password/OAuth, roles, suspension | `UserDTO`, `AuthContext`, `getAdminUsers()`, `/users/:id` API paths |

The route `/member/:userId` still uses a user id in the URL (storage key). In UI and docs, prefer **member** or **person** over **user** unless discussing login or admin auth actions.

**Type aliases (frontend):**

- `PersonPublicProfileDTO` → same as `PublicMemberProfileDTO`
- `api.getPersonPublicProfile()` → same as `getUserPublicProfile()`
- `personProfilePath()` → same as `memberProfilePath()`

## Organisation subtypes

| Subtype | Role | Map pin? | Manage console |
|---------|------|----------|----------------|
| Guide / agency | Hosts activities; public intro at `/operator/:slug` | No | `/agency/manage`, host console |
| Shop (physical) | Merchant with lat/lng | Yes | `/shop/manage` |
| Shop (online) | Merchant with website only; list in explore, no pin | No | `/shop/manage` |

Shop identity is split today (Phase 6 prep — explicit link, no collapse yet):

- **Tenant** — become-host signup (`shopPresence`, website, optional coordinates)
- **Merchant profile** — ShopManage (contact, featured picks with outbound URLs)
- **`merchant_profiles.tenantId`** — optional FK to the SHOP tenant; backfilled on startup migration and set on become-host approval

Saving in ShopManage syncs tenant + merchant and invalidates the explore map cache.

## Legacy → domain naming

| Legacy term | Prefer in new code | Keep unchanged (for now) |
|-------------|-------------------|---------------------------|
| Location | Place | API `/admin/locations`, `LocationDTO`, `getAdminLocations()` |
| Operator | Organisation | Route `/operator/:id` |
| Merchant | Shop (organisation) | `merchant_profiles`, `/merchant/:id` redirect |
| **Host** (role) | Auth role / capability to publish activities under an organisation | `tenant_owner`, `tenant_guide`, `/host/*` console routes | Keep route prefix `/host/*`; UI says **Organisation console** |
| **Admin** | Platform operator managing auth accounts and content | `platform_admin`, `/admin/*` | Admin **Members** page = auth accounts, not organisations |
| User (product copy) | Person / member | `UserDTO`, `AuthContext`, `/users/*` API (auth) |
| Member profile | Person public profile | `PublicMemberProfileDTO`, `/member/:id` |
| Tenant | Organisation (account) | `tenants` collection, `x-tenant-id` header |
| Venue | Place (typed) | `venueType` on locations; explore `?panel=venues` URL |

## Place / location / venue — one concept

Trail, camp, and event spots are **places** in product language. Legacy terms map as follows:

| Term | Still used for | Canonical in new code |
|------|----------------|------------------------|
| Place | UI, `PlaceDTO`, components | **Preferred** |
| Location | API `/locations`, Mongo, activity `locationId` field | Wire/storage only |
| Venue | Explore panel key, map pin source `venue` | Same as place |

Path helpers live in `src/utils/placePaths.ts`. `share.ts` and `venueDetailDisplay.ts` re-export legacy names.

## Page renames (routes unchanged)

| File / export | Route | Notes |
|---------------|-------|-------|
| `AdminPlaces` | `/admin/locations` | Admin CRUD for places |
| `OrganisationProfile` | `/operator/:id` | Public agency/guide profile; shops redirect to `/shop/:id` |
| `OrganisationManage` | `/organisation/manage` | Unified agency + shop console (`?kind=agency` \| `?kind=shop`) |
| `ShopManage` / `AgencyManage` | `/shop/manage`, `/agency/manage` | Legacy redirects to `OrganisationManage` |
| `ShopPublic` | `/shop/:id` | Canonical public shop page |
| `HostPlaces` | `/host/locations` | Host-scoped place submissions |
| `AdminOrganisations` | `/admin/hosts` | Organisation applications + tenant oversight |

**Organisation console components** live in `src/components/organisation-console/`. Hooks: `useOrganisationGate`, `useOrganisationHubData`. Client API: prefer `listOrganisationActivities`, `getOrganisationTeam`, `publishOrganisationActivity`, `getShopPublic`, etc. (legacy `*Host*` / `*Merchant*` methods retained). Deprecated exports (`HostShell`, `MobileBecomeHostFlow`, …) remain on canonical components where noted in JSDoc.

## Consoles are views, not new types

Admin, host, agency, and shop UIs are **views on the same objects**:

- Admin places ↔ `AdminPlaces`
- Host activities ↔ scheduled **Activity** rows for one **Organisation**
- Organisation manage ↔ `OrganisationManage` (agency + shop)

Do not introduce parallel models per console.

## Product rules (stable)

1. **Typed place URLs** — keep `/trail`, `/camp`, `/event`; do not unify to `/place/:id` unless SEO/IA requires it.
2. **Activities stay separate** — `/activity/:id` is not a place detail page.
3. **No agency map pins** — agencies/guides are profile-only.
4. **Shop = merchant** — canonical public path `/shop/:id`; affiliate-style featured picks, not in-app checkout.
5. **API resource names** — `/locations/:id` on the server is fine; "place" is the product word.

## PR naming

When touching an area, prefer domain words in PR titles and new symbols:

- ✅ "Add online shop presence to become-host flow"
- ✅ "OrganisationProfile redirects shop tenants to ShopPublic"
- ⚠️ "Fix OperatorProfile merchant redirect" (legacy file name)

## Optional follow-ups (not required for correctness)

- Type aliases in `@uaetrail/shared-types`: `PlaceDTO`, `PlaceStatus`, `ShopOrganisationDTO` (done)
- Merge `/agency/manage` and `/shop/manage` into one organisation console (done — `/organisation/manage`)
- Collapse `merchant_profiles` into `tenants` long-term

**Adoption roadmap:** [`DOMAIN_ADOPTION_PLAN.md`](./DOMAIN_ADOPTION_PLAN.md) — phased frontend migration **complete** (Phases 0–10). Deferred: backend tenant/merchant collapse (Phase 6b).
