# UAE Trail — Domain model

This glossary maps **product concepts** to **code and routes**. Use it when naming pages, DTOs, and PRs. Routes and API paths stay stable during renames; component and file names may use `Organisation*` as a **code umbrella** for tenants.

**Product north star:** [`NORTHSTAR.md`](./NORTHSTAR.md) — people finding company outdoors; code entities below are *how* the product delivers that.

See also [`NAVIGATION.md`](./NAVIGATION.md) for browse vs personal-hub routing rules.

## Core objects

| Domain | What it is | Code / storage | Public URL | Explore map |
|--------|------------|----------------|------------|-------------|
| **Place** | A physical venue: trail, camp, or event location | `locations`, `PlaceDTO` | `/trail/:id`, `/camp/:id`, `/event/:id` | Yes (venue pins) |
| **Activity** | A scheduled trip hosted at a place | `activities`, `ActivityDTO` | `/activity/:id` | Yes |
| **Host** (publishing) | Anyone who publishes trips and may have a public profile — **guide**, **agency**, or **shop** | `tenants`, `TenantProfile`, `merchant_profiles` (shops) | Guide/agency: `/operator/:slug` · Shop: `/shop/:id` | Physical shops only |
| **Person** | A member's public identity on the platform | `users` (profile fields), `/member/:id` | `/profile`, `/member/:id` | Via demand cards |
| **User** | Auth account (login, roles, suspension) | `users`, `UserDTO`, `AuthContext` | `/signin`, `/signup` | — |

**Participation** links **Person ↔ Activity ↔ Place**. **Publishing** links **Host (tenant) ↔ Activity**. Shops also link **featured outbound picks**.

## Host vs Organisation in copy

| Context | Say | Avoid |
|---------|-----|--------|
| Umbrella (any publisher) | **Host**, **host profile**, **host console**, **host application** | “Organisation” for solo guides |
| Individual guide | **Guide**, **guide profile**, **guide console** | “Organisation profile” |
| Licensed business | **Agency**, **agency profile** | — |
| Gear seller | **Shop**, **shop profile** | “Merchant” in UI |
| On-day trip leader | **Host** (“Hosted by …”, `HostSelect`) | Confusing with publishing host — OK when scoped to the activity |
| Code / filenames / API aliases | `Organisation*`, `tenant`, `/host/*` routes | Renaming wire layer without a migration |

Helpers: `src/utils/hostCopy.ts` — `hostConsoleLabel()`, `hostProfileLabel()`, `normalizeHostKind()`.

### Internal code identifiers (Phase 14)

| Prefer in new code | Deprecated alias | Notes |
|--------------------|------------------|-------|
| `hostTenants`, `canPickHostTenant`, `eventHostName` | `hostOrganizations`, `canPickHostOrganization`, `eventHostOrganization` | Activity publish forms |
| `BecomeOrganisationFormState` | `BecomeHostFormState` | Become-host wizard |
| `HOST_CONSOLE_LINKS` | `ORGANISATION_CONSOLE_LINKS` | Console nav constant |
| `resolveProfileHostKind()` | `resolveProfileOrganisationKind()` | Profile hub |
| `hostName` (signup) | `organizationName` | Wire field on `/auth/register` |
| `hostDetails`, `shopId` (tenant profile JSON) | `organizerDetails`, `merchantId` | Dual keys on GET tenant profile + PATCH `/me/host-details` |
| `GET /admin/places` (admin CRUD) | `GET /admin/locations` | Same handlers; legacy path kept |
| `shopId`, `/shop/organisation/*` (shop manage) | `merchantId`, `/shop/merchant/*` | Dual JSON keys + parallel routes; Mongo still `merchant_profiles` |
| `GET /shop/shops/:id` (public shop) | `GET /shop/merchants/:id` | Same handler; legacy path kept |

### Capabilities by host kind

| Kind | Paid trips | Typical trips |
|------|------------|---------------|
| **Guide** (individual) | No | Free / shared-cost community trips |
| **Agency** | Yes | Licensed guided adventures |
| **Shop** | N/A (featured picks) | Gear / affiliate links |

## Person vs User

| Term | Meaning | Use in new code |
|------|---------|-----------------|
| **Person** | Who someone is on the trail — profile, bio, explore card | Product copy, `PersonPublicProfileDTO`, `personProfilePath()` |
| **User** | Auth account — email, roles, suspension | `UserDTO`, `AuthContext`, admin auth actions |

The route `/member/:userId` uses a user id in the URL (storage key). In UI, prefer **member** or **person** over **user** unless discussing login or admin.

## Host subtypes (same tenant row)

| Subtype | Role | Map pin? | Manage |
|---------|------|----------|--------|
| **Guide** | Individual host; public intro at `/operator/:slug` | No | `/host/*` console, `/become-host` |
| **Agency** | Business host; paid trips | No | `/host/*`, `/organisation/manage?kind=agency` |
| **Shop** | Physical or online gear partner | Physical only | `/shop/:id`, `/organisation/manage?kind=shop` |

Shop identity: **tenant** (become-host) + **merchant profile** (ShopManage), linked via `merchant_profiles.tenantId`.

## Legacy → domain naming

| Legacy term | Prefer in new code | Keep unchanged |
|-------------|-------------------|--------------|
| Location | Place | API `/locations`, `LocationDTO` |
| Operator | Host public profile | Route `/operator/:id` |
| Merchant | Shop | `merchant_profiles`, `/merchant/:id` redirect |
| Organizer | Host or agency | — |
| Tenant | Host (copy) / Organisation (code) | `tenants`, `x-tenant-id` |
| Venue | Place | explore `?panel=venues` |

## Page renames (routes unchanged)

| File / export | Route | Notes |
|---------------|-------|-------|
| `OrganisationProfile` | `/operator/:id` | Public guide/agency host profile |
| `OrganisationConsoleOverview` | `/host/overview` | **Host console** in UI |
| `BecomeOrganisation` | `/become-host` | User copy: **become a host**; legacy export `BecomeHost` |
| `ShopPublic` | `/shop/:id` | Public shop host |
| `AdminOrganisations` | `/admin/hosts` | Admin copy: **Hosts** |

**Code folder:** `src/components/organisation-console/` (implementation name). **UI:** host / guide / agency / shop per `hostCopy.ts`.

## Product rules (stable)

1. Typed place URLs — `/trail`, `/camp`, `/event`.
2. Activities stay at `/activity/:id`.
3. No agency/guide map pins.
4. Shop public path `/shop/:id`; affiliate featured picks, not in-app checkout.
5. API paths may say `locations` / `merchant`; product copy says place / shop.

**Adoption roadmap:** [`DOMAIN_ADOPTION_PLAN.md`](./DOMAIN_ADOPTION_PLAN.md) — frontend migration complete. Deferred: Phase 6b tenant/merchant collapse.
