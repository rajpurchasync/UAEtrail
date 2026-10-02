# Member model — users, roles, tiers, routes

**Canonical map** for how one **person account** connects to capabilities, storage, and HTTP. Doc index: [`DOCS_INDEX.md`](./DOCS_INDEX.md). Product voice: [`NORTHSTAR.md`](./NORTHSTAR.md). Domain entities: [`DOMAIN.md`](./DOMAIN.md). HTTP prefixes: [`API_ROUTING.md`](./API_ROUTING.md). Rollout tracker: [`MEMBER_MODEL_PHASES.md`](./MEMBER_MODEL_PHASES.md) · host audit P0–P3: [`HOST_CLEANUP_ROADMAP.md`](./HOST_CLEANUP_ROADMAP.md).

Do **not** re-implement tier logic in React hooks — consume **`GET /me/host-status`** (`HostStatusDTO` in `@uaetrail/shared-types`).

**Vocabulary (avoid “join request = become host”):** [`NAMING_HOST_MEMBER.md`](./NAMING_HOST_MEMBER.md) · Cursor rule: `.cursor/rules/host-member-model.mdc` · verify: `npm run verify:host-member`.

---

## Spider map

```mermaid
flowchart TB
  subgraph account [Account]
    U[users — AuthUser]
    UR[UserRole — platform job]
    UP[profile — person fields]
  end

  subgraph tiers [Host publishing tiers]
    C[community — buddy Organize]
    P[professional — Pro guide]
    B[business — agency / shop / team]
  end

  subgraph storage [Persistence]
    T[tenants — publishingPurpose]
    TM[tenant_memberships — team link]
    A[activities — Organize]
    PI[participant_intents — Demand]
  end

  subgraph api [API surfaces]
    ME["/me/* — member scope"]
    HOST["/host/* — tenant scope"]
    PUB["/users/:id — public person"]
  end

  U --> UP
  U --> UR
  U --> TM
  U --> T
  T -->|community| C
  T -->|professional| P
  T -->|business| B
  TM --> B
  C --> A
  C --> PI
  P --> A
  B --> A
  ME --> HOST
  U --> ME
  U --> PUB
```

---

## Layers (do not confuse)

| Layer | What it is | Examples |
|-------|------------|----------|
| **Person / member** | Human using the app | `users`, `/profile`, `/member/:id` |
| **UserRole** | Legacy platform job on the user row | `PARTICIPANT`, `TENANT_GUIDE`, `PLATFORM_ADMIN` |
| **Host publishing tier** | How they publish on the map | `community`, `professional`, `business` |
| **Tenant** | Publishing organisation row | `tenants.publishingPurpose`, `x-organisation-id` |
| **MembershipRole** | Person ↔ tenant (team) | `TENANT_OWNER`, `TENANT_GUIDE` |
| **Public operator brand** | Business/guide storefront | `/operator/:slug`, `/shop/:id` |

**UserRole ≠ host tier.** A `PARTICIPANT` can be a **community** host (`canPublish` + community tenant). A **business** guide is often `TENANT_GUIDE` with no owned tenant.

---

## Host publishing tiers

| Tier | Who | Tenant `publishingPurpose` | Paid Organize? | Entry |
|------|-----|------------------------------|----------------|-------|
| **Community** | Individual member | `community` | No (free / shared) | Profile complete → auto tenant (`ensureBuddyHostTenant`) |
| **Professional** | Pro guide | `professional` | Future Pro rules | `/profile/pro-membership` → host application (`individual`) |
| **Business** | Agency / shop owner or **employee** | `business` | Agency yes | Pro membership application or team invite → `tenant_memberships` |

**Profile badge (`profileRoleLabel`):**

| Key | When |
|-----|------|
| `community_member` | Default |
| `host` | `isCommunityHost` — first activity **or** demand on map |
| `professional_guide` | Professional tier tenant |
| `agency` | Agency tenant or business tier operator |
| `shop_owner` | Shop tenant |

Wire: `HostStatusDTO.hostTiers`, `HostStatusDTO.profileRoleLabel`, `HostStatusDTO.isCommunityHost`.

---

## Capabilities (flags on `HostStatusDTO`)

| Flag | Meaning |
|------|---------|
| `signupProfileComplete` | `/welcome` member details done |
| `canPublish` | May run Organize wizard (has activity-capable tenant) |
| `canAccessHostConsole` | May use `/host/*` (publish queue, team) |
| `canHostPaidActivities` | Agency commercial pricing |
| `isCommunityHost` | Has map footprint as host (activity or demand) |

**Demand (Find)** requires signed-in member only — **not** `canPublish`.

---

## HTTP routing (member vs host)

| Intent | Auth | Route family |
|--------|------|----------------|
| Browse map | Guest optional | `GET /explore/map`, `GET /activities/:id` |
| Profile, demand, inbox | Member | `GET/PATCH /me/*` |
| Publish / manage outing | Member + tenant | `POST /host/activities`, `x-organisation-id` |
| Public person | Optional | `GET /users/:id` (or member public profile) |
| Pro application | Member | `POST /me/host-application` |

---

## Code map

| Concern | Location |
|---------|----------|
| Tier enum (wire) | `packages/shared-types/src/host-publishing-tier.ts` |
| Tenant purpose (DB) | `apps/api/src/domain/tenant-publishing.ts`, `tenants.publishingPurpose` |
| **Single resolver** | `apps/api/src/services/member-host-status.ts` → `GET /me/host-status` |
| Community footprint | `apps/api/src/lib/community-host.ts` |
| Buddy tenant | `apps/api/src/lib/buddy-host-tenant.ts` |
| Client display strings | `src/member/memberProfileRoleLabel.ts` |
| Client hook (thin) | `src/hooks/useMemberHostStatus.ts` (alias `useOrganisationGate`) |

---

## Related docs

- [`DOMAIN.md`](./DOMAIN.md) — Place, Activity, Demand glossary  
- [`CREATE_FLOW.md`](./CREATE_FLOW.md) — Organize vs Find gates  
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — monorepo layout  
