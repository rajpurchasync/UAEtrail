# Programme aggregate (R7 — spec only)

**Status:** Product gate — **no implementation** until PM approves scope and naming.  
**Maps to:** `system-refactor-plan.md` **R7** · audit **F-D8** · `SYSTEM_COHERENCE` gap (no programme collection).

---

## 1. Problem

Today, multi-session initiatives (festival weekends, charity series, agency “season”, partner campaigns) are modeled only as **many unrelated `activities`** plus ad-hoc copy. That forces:

- Duplicate host branding and URLs per outing
- No single “follow this programme” or roster across dates
- Risk of stuffing `activities` with `isCampaign`, `programmeSlug`, or tenant flags (hard to query, breaks map card VM)

**Non-goal:** Replace **Activity** as the joinable unit. Members still RSVP/request on **one scheduled outing**.

---

## 2. Proposed aggregate: `Programme`

| Field (conceptual) | Purpose |
|--------------------|---------|
| `id`, `slug` | Stable identity + `/programme/:slug` (or `/series/:slug` — pick one at PM) |
| `title`, `subtitle`, `about`, `heroImage` | Marketing + explore poster |
| `publisher` | `tenantId` and/or `memberUserId` (buddy series) |
| `status` | `draft` · `published` · `archived` |
| `outingCategory` / tags | Discovery family (hiking, festival, …) |
| `areaIds[]` | Curated geography |
| `activityIds[]` **or** link table | Ordered / grouped child outings |
| `visibility` | `public` · `unlisted` · `tenant_only` |

**Storage (future):** `programmes` collection + optional `programme_activities` join (do not embed full activity docs).

---

## 3. URLs & surfaces

| Surface | Behavior |
|---------|----------|
| **Public detail** | `/programme/:slug` — hero, about, **upcoming activity cards** (same `DiscoveryCardProjection` as map/list) |
| **Explore map** | Optional **area/programme lens** pin (`source: 'programme'`) — distinct from `area:` lens; no join on programme pin itself |
| **Activity detail** | Breadcrumb / chip: “Part of {programme title}” → programme page |
| **Host console** | Attach/detach published activities; programme publish gate separate from single-activity publish |

**Redirects:** Legacy campaign URLs (if any) → programme slug — define at ship time.

---

## 4. API sketch (not built)

```
GET  /api/v1/programmes/:slug
GET  /api/v1/programmes/:slug/activities?upcoming=1
POST /api/v1/host/programmes          (tenant)
PATCH /api/v1/host/programmes/:id
POST /api/v1/host/programmes/:id/activities  (link activityId, sortOrder)
```

Explore map vNext: programme rows are **catalog** items (like `area:`), not bbox-heavy activity blobs.

---

## 5. Relation to existing entities

| Entity | Relation |
|--------|----------|
| **Activity** | Child outing; join flow unchanged (`activity_requests`) |
| **Tenant / shop** | Programme publisher for pro/agency; shop promos stay commerce context |
| **Area** | Programme may span areas; area filter intersects programme metadata |
| **Member follow** | Optional `entity_follow` target kind `programme` (extends `entity-follow` pattern) |

---

## 6. Out of scope (v1 programme)

- Ticketed multi-day passes (commerce)
- Automatic activity generation from programme template
- Replacing `participant_intents` / seeking model

---

## 7. Exit criteria to start implementation

1. PM sign-off on **name** (`programme` vs `series` vs `campaign`) and public URL
2. One hero use case (e.g. “Festival weekend” or “Agency summer calendar”)
3. Tier-1 update: `DOMAIN_CANONICALS` entity row + `NAVIGATION` route table (not a new audit doc)
4. Bounded context: `discovery` + `host_publishing`; gate `npm run verify:system`

---

## 8. Related docs

- [`system-structure-deep-audit.md`](./system-structure-deep-audit.md) §13.1  
- [`explore-map-vnext-spec.md`](./explore-map-vnext-spec.md) — catalog pins  
- [`CREATE_FLOW.md`](../CREATE_FLOW.md) — activity remains the join root
