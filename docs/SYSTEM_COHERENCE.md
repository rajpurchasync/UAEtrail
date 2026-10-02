# System coherence — whole product architecture

**Purpose:** One map from **north-star outcomes** → **capabilities** → **surfaces** → **modules** → **API** → **storage**. Use this before large features or refactors so work strengthens a single system instead of adding a third parallel path.

**Not a duplicate of:** [`ARCHITECTURE.md`](./ARCHITECTURE.md) (deployment & layer diagram), [`DOMAIN.md`](./DOMAIN.md) (entity glossary), [`DOMAIN_CANONICALS.md`](./DOMAIN_CANONICALS.md) (naming & route builders), [`MEMBER_MODEL.md`](./MEMBER_MODEL.md) (person vs host tier). **This file ties them together.**

**Index:** [`DOCS_INDEX.md`](./DOCS_INDEX.md) · **Checks:** `npm run verify:system` · **Manifest:** `scripts/bounded-context-manifest.json`

---

## 1. North star → capabilities

From [`NORTHSTAR.md`](./NORTHSTAR.md), the product delivers five **capabilities** (not features):

| Capability | Member outcome | Primary surfaces |
|------------|----------------|------------------|
| **Discover** | See real outdoor plans near me | `/explore`, entity detail (`/activity`, `/trail`, …) |
| **Express demand** | Say what I want when nothing fits | Explore FAB → Find; `participant_intents` on map |
| **Connect** | Align with people before the day | `/messages`, buddies, group walls |
| **Participate** | Join or host a specific outing | Activity detail join/RSVP; host join queue |
| **Return** | Same crew, next time | `/profile`, `/trips`, notifications, goals |

Everything else (shops, rewards, place registry, admin, Pro agencies) **supports** these capabilities or serves a **secondary** audience (hosts, merchants, platform ops).

---

## 2. System map (logical)

```mermaid
flowchart TB
  subgraph surfaces [Consumer surfaces]
    M["/ guest marketing"]
    E["/explore browse + FAB"]
    P["/profile /trips hub"]
    D["/activity /trail detail"]
    MSG["/messages /buddies /groups"]
  end

  subgraph compose [Compose subsystem]
    FAB["compose= URL contract"]
    ORG["Organize wizards"]
    FIND["Demand wizards"]
    ADD["Contribute wizards"]
  end

  subgraph participation [Participation subsystem]
    JOIN["activity_requests + RSVP"]
    DEMAND["participant_intent_requests"]
    CREW["activity crew groups"]
  end

  subgraph identity [Member identity]
    WEL["/welcome signup gate"]
    HS["GET /me/host-status"]
    PUB["public member profile"]
  end

  subgraph publishing [Publishing organisations]
    TEN["tenants + memberships"]
    HOST["/host console"]
    PRO["/profile/pro-membership"]
  end

  subgraph platform [Platform]
    ADM["/admin"]
    MOD["reports / moderation"]
  end

  M --> E
  E --> FAB
  FAB --> ORG
  FAB --> FIND
  FAB --> ADD
  ORG --> TEN
  ORG --> JOIN
  FIND --> DEMAND
  D --> JOIN
  D --> DEMAND
  JOIN --> CREW
  CREW --> MSG
  WEL --> HS
  HS --> ORG
  PRO --> TEN
  HOST --> TEN
  TEN --> JOIN
  P --> E
  P --> MSG
```

---

## 3. Bounded contexts (where code must live)

Each context has **one write path** and **one public read model** where possible. Crossing boundaries happens through **services** and **shared-types**, not duplicate business rules in React.

| Context | Responsibility | Frontend home | API home | Storage (see `collections.ts`) |
|---------|----------------|---------------|----------|--------------------------------|
| **Discovery** | Map/list payload, pins, filters, card projection | `src/explore/*`, `ExploreExperience.tsx` | `lib/explore-map.ts`, `GET /explore/map` | `activities`, `locations`, `participant_intents`, `tenants` (shops) |
| **Compose** | FAB intents, wizards, draft → publish payload | `src/explore/ui/*`, `compose.ts`, `organizeFlow.ts` | `POST /host/activities`, `POST /me/participant-intents` | `activities`, `participant_intents` |
| **Participation** | Join, waitlist, RSVP, demand requests | `useActivityJoin*`, detail + explore selection | `services/join-request.ts`, intent request stores | `activity_requests`, `participant_intent_requests`, `activity_participants` |
| **Member identity** | Profile, welcome gate, visibility, public card | `src/pages/Profile*`, `src/member/*` | `registerProfileRoutes`, `public-member-profile`, `profile-viewer-access` | `users` / profile fields |
| **Host capabilities** | Who may publish & console access (not onboarding verb) | `useOrganisationGate`, `organizePublishGate` | **`services/member-host-status.ts` only** | `tenants`, `tenant_memberships` |
| **Organisation console** | Tenant-scoped CRUD, check-in, activity join queue | `src/pages/Organisation*`, `organisation-console/` | `routes/host/*` registrars | same + `activities` |
| **Communication** | DM, inbox, crew wall | `Messages.tsx`, `messages/*` | `routes/chat.ts`, `activity-group-chat`, `member-inbox` | `chat_messages`, `social_groups`, wall collections |
| **Social graph** | Buddies, follows, groups (non-crew) | `Buddies.tsx`, `Groups.tsx` | `registerBuddyRoutes`, `registerGroupRoutes`, `registerFollowRoutes` | `buddy_*`, `user_follows`, `social_groups` |
| **Places** | Registry, contribute, venue detail | `PlaceDetail*`, `TrailDetail`, contribute flows | `place-registry`, `location-submit`, `/places` | `locations` |
| **Commerce** | Shop public + merchant manage (affiliate) | `ShopPublic`, `ShopManage` | `routes/shop.ts` | `merchant_profiles`, `tenants` (SHOP) |
| **Engagement** | Goals, map pins, favorites | explore favorites, profile goals | `registerMeGoalsRoutes`, … | `user_goals`, `user_favorites` |
| **Platform ops** | Admin, audit, applications | `src/pages/Admin*` | `routes/admin.ts` | `host_applications`, `audit_logs` |

**Rule:** If a change touches “who can do X,” find the row above first. Do not add a second resolver in a route file or a random hook.

### 3.1 Context alignment matrix (API · FE · storage)

Pick a **context id** when changing code; touch registrar + `src/api/domains/*` + UI roots together. Machine-readable paths: `scripts/bounded-context-manifest.json`.

| Context | Collections (wire) | Key HTTP | FE domain module | UI roots |
|---------|-------------------|----------|------------------|----------|
| discovery | `activities`, `locations`, `participant_intents`, shop tenants | `GET /explore/map` | `exploreApi` | `src/explore/*` |
| compose | `activities`, `participant_intents` | `POST /host/activities`, `POST /me/participant-intents` | `exploreApi`, `organisationApi` | `src/explore/ui/*` |
| participation | `activity_requests`, `participant_intent_requests`, `activity_participants` | `/activities/.../requests`, `/host/requests` | `activitiesApi`, `exploreApi` | Activity detail, `JoinRequestDetail` |
| member_identity | `auth_users` profile | `/me/profile`, `/users/:id` | `accountApi`, `memberApi` | `Profile*`, `src/member/*` |
| host_capabilities | `tenants`, `tenant_memberships` | `GET /me/host-status` | `memberApi` | `useOrganisationGate` |
| organisation_console | + `activities` | `/host/*` + tenant header | `organisationApi`, `activitiesApi` | `Organisation*`, `organisation-console/*` |
| communication | `chat_messages`, group wall | `/chat/*`, group wall | `chatApi`, `socialApi` | `Messages.tsx` |
| social_graph | `buddy_*`, `user_follows`, `social_groups*` | `/me/buddies`, `/me/groups`, … | `socialApi` | `Buddies`, `Groups` |
| places | `locations` | `/places`, `/me/places` | `placeApi`, `placeRegistry` | `TrailDetail`, `CampDetail`, contribute |
| commerce | `merchant_profiles`, `products` | `/shop/*` | `shopApi` | `ShopPublic`, shop UI |
| engagement | `user_badges`, `user_goals`, `user_favorites`, … | `/me/badges`, `/me/goals`, … | `badgesApi`, `goalsApi`, … | `ProfileBadges`, goals on profile |
| platform_ops | `host_applications`, `audit_logs` | `/admin/*` | `adminApi` | `Admin*` pages |

**API mounts:** `/auth`, `/admin`, `/host`, `/chat`, `/shop`, `/media`, `/reports`, `/` (`user.ts` + `social.ts`) — see `apps/api/src/routes/index.ts`.

---

## 4. Surfaces vs routes (contract)

Canonical navigation: [`NAVIGATION.md`](./NAVIGATION.md). Structural rules:

| Surface | Route anchor | Never confuse with |
|---------|--------------|-------------------|
| Marketing | `/` | Product home (`/explore`) |
| Browse + create | `/explore?compose=…` | `/host/activities/new` as consumer default |
| Personal hub | `/profile`, `/trips` | Legacy `/activities` browse |
| Entity | `/activity/:id`, place URLs | “Trip” entity (does not exist) |
| Host console | `/host/*` | Buddy Organize (map FAB, `/welcome` gate) |
| Pro / business | `/profile/pro-membership` | `/become-host` as product entry (redirect only) |
| Messaging | `/messages` (+ `?group=` / `?to=`) | Chat embedded on `/trips` |

**Auth shells:** `ProtectedRoute` uses **`UserRole`** for coarse access (admin, host console shell). **Product gates** (Organize, paid host, profile chips) use **`HostStatusDTO`** from `GET /me/host-status`. See [`MEMBER_MODEL.md`](./MEMBER_MODEL.md) — mixing these layers is a top source of incoherence.

---

## 5. API shape (how the backend stays one system)

**Mount order:** `apps/api/src/routes/index.ts` — `auth`, `admin`, `host`, `shop`, `chat`, `media`, `reports`, `social`, **`user`** (broad public + `/me`).

**Thin routes:** `apps/api/src/routes/user/register*.ts` and `routes/host/register*.ts` — validate, call **service**, map DTO.

**Domain rules:** Prefer `apps/api/src/domain/*` (pure) + `apps/api/src/services/*` (orchestration). Avoid new business rules in `lib/*-store.ts` without a service façade.

**Contracts:** `packages/shared-types` — wire DTOs, explore projection, participation enums. API `domain/` may mirror rules but **shared-types** is what the SPA imports.

**Explore read model:** Single aggregator `GET /explore/map` — clients should not reconstruct the map from three legacy catalog calls.

Detail: [`API_ROUTING.md`](./API_ROUTING.md).

---

## 6. Frontend shape (how the SPA stays one system)

| Layer | Role |
|-------|------|
| `src/pages/*` | Route shells — lazy in `App.tsx` |
| `src/explore/*` | **Product core** — map, compose, browse panel, join overlays |
| `src/components/organisation-console/*` | Host console UI (implementation name; user copy “host”) |
| `src/api/domains/*` | HTTP clients per context — composed in `services.ts` as `api` |
| `src/config/*`, `src/content/*` | Routes helpers and canonical copy |
| `src/member/*` | Host-status display helpers and guards |

**API client:** Prefer `api.getMemberHostStatus()`, `exploreApi.*`, `organisationApi.*`. Domain modules only — `legacyApi.ts` removed; see `apiLegacyGuard.test.ts`.

**Publish payload:** Single builder `activityPublishPayload.ts` for explore Organize and host console forms (shared across surfaces).

---

## 7. Incoherence register (honest debt)

Track consolidation here; sub-roadmaps link out but **this table is the system-wide backlog**.

| ID | Symptom | Why it hurts | Target state | Tracker |
|----|---------|--------------|--------------|---------|
| **C1** | Three permission notions (`UserRole`, `HostStatusDTO`, tenant middleware) | Wrong gates in UI; host console confused with Organize | Roles = shell; `HostStatusDTO` = product; tenant header = `/host` only | [`MEMBER_MODEL.md`](./MEMBER_MODEL.md), `host-member-model.mdc` |
| **C2** | Organisation/Host naming mix in UI | New code uses wrong copy or imports | Domain-only `api.*`; `Organisation*` folders, host user copy | [`HOST_CLEANUP_ROADMAP.md`](./HOST_CLEANUP_ROADMAP.md) P2 |
| **C3** | Large `host.ts` remainder (activities CRUD) | Hard to review; route naming drift | Split registrars like activity requests / team | HOST_CLEANUP P2 |
| **C4** | Parallel place detail pages (`Trail` / `Camp` / `Event`) | Duplicate SEO/loading patterns | Shared `PlaceDetail` internals | ARCHITECTURE “Future” |
| **C5** | `components/activities/*` modals vs explore wizards | Two create UX paths | Explore compose only for consumer create | Mostly done — audit `components/activities` |
| **C6** | Shop = `tenant` + `merchant_profile` | Two writes for one brand | Documented split; sync on ShopManage save | [`DOMAIN.md`](./DOMAIN.md) |
| **C7** | Premium location unlock + old membership page | Legacy freemium copy vs north star | Product TBD | [`NORTHSTAR.md`](./NORTHSTAR.md) |
| **C8** | `/community`, `/membership` routes | Secondary surfaces vs explore-first IA | `/membership` → explore; `/community` desktop hub (constants in `surfacePaths.ts`) | [`NAVIGATION.md`](./NAVIGATION.md) legacy table |
| **C9** | Notification + privacy matrix incomplete | Inconsistent actor labels in edge kinds | FE smoke matrix | [`HOST_CLEANUP_ROADMAP.md`](./HOST_CLEANUP_ROADMAP.md) P2 |
| **C10** | 100+ markdown files, multiple “plans” | Agents read wrong doc | **Tier 1** only for truth; experiment defers | [`DOCS_GOVERNANCE.md`](./DOCS_GOVERNANCE.md) |
| **C11** | Long flat `api.*` surface | Wrong facade | Domain modules in `src/api/domains/*` | [`DOMAIN_CANONICALS.md`](./DOMAIN_CANONICALS.md) §10–12 |
| **C12** | Notification meta dialects | Routing sprawl | `NotificationMeta` + `actorUserId` | §11 |
| **C13** | Many `*Routing.ts` helpers | Import confusion | `routingCatalog` + `inferNotificationPath` | §10 |
| **C14** | Doc corpus duplication | Contradictory terms | **Update Tier-1 only** — [`DOCS_GOVERNANCE.md`](./DOCS_GOVERNANCE.md) | |
| **C15** | Buddy/friend vocabulary | Fake entity ids | User ids only | [`MEMBER_MODEL.md`](./MEMBER_MODEL.md) § Naming vocabulary |

**Not debt (intentional):** stable URLs (`/trail`, `/host`, `/operator`); Mongo collection names; `Organisation*` folder name with host user copy.

---

## 8. Consolidation phases (system-wide)

Ordered for **coherence**, not feature count:

| Phase | Outcome | Primary docs / commands |
|-------|---------|-------------------------|
| **S0** | Single doc entry + automated phrase guards | `DOCS_INDEX`, `verify:docs` |
| **S1** | One member capability resolver (`/me/host-status`) enforced server-side | `MEMBER_MODEL`, `verify:host-member` |
| **S2** | Host route modularization + fulfill removal | `HOST_CLEANUP_ROADMAP` P1–P2 |
| **S3** | API `user` router fully split (registrars only in `user.ts`) | [`API_ROUTING.md`](./API_ROUTING.md) |
| **S4** | Frontend `api.*` stays domain-only | `apiLegacyGuard`, knip |
| **S5** | Privacy notification matrix + viewer access everywhere | [`HOST_CLEANUP_ROADMAP.md`](./HOST_CLEANUP_ROADMAP.md) P2 |
| **S6** | Place detail internal merge + SEO pass | ARCHITECTURE future |

Phases **S0–S1** are largely in place; **S2–S6** are the production-grade cohesion work remaining.

---

## 9. Change checklist (any substantial PR)

1. Which **capability** (§1) and **context** (§3) does this touch?
2. Does it introduce a **second write path** for the same entity? If yes, stop and extend the existing service.
3. Update **Tier 1** doc(s): `CREATE_FLOW`, `NAVIGATION`, `API_ROUTING`, or `MEMBER_MODEL` — not only experiment plans.
4. Run **`npm run verify:system`** (or `verify:system:quick` before push); explore work also needs `test:explore-alignment`.

---

## 10. Related documents

| Question | Read |
|----------|------|
| Why we build this | `NORTHSTAR.md` |
| What entities exist | `DOMAIN.md` |
| Who can publish / host console | `MEMBER_MODEL.md` |
| FAB and join behavior | `CREATE_FLOW.md` |
| HTTP paths | `API_ROUTING.md` |
| Deploy & monorepo layers | `ARCHITECTURE.md` |
| System-wide debt register | §7–8 (this file) |
| Host/tenant cleanup tasks | `HOST_CLEANUP_ROADMAP.md` |
