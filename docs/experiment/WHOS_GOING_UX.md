# Who's going — social discovery hub (plan)

**Status:** Segments shipped. **API (object-centric):** `GET /me/buddies/activity-presence`, `GET /me/member-discovery/roster` — see [`API_ROUTING.md`](../API_ROUTING.md). **Explore wire:** URL `view=going` + `goingTab`; code `listMode=going` (panel title copy: “Who's going?” in `exploreGoingPanelCopy.ts` only).  
**North star:** Find your people · get outside · go together ([`NORTHSTAR.md`](../NORTHSTAR.md)).  
**Tier-1 hooks:** [`NAVIGATION.md`](../NAVIGATION.md) (Explore), [`MEMBER_MODEL.md`](../MEMBER_MODEL.md) (buddies + quotas), [`DOMAIN_CANONICALS.md`](../DOMAIN_CANONICALS.md) §15 (profile exposure), [`COMMUNICATION.md`](../COMMUNICATION.md) (invites vs chat).

---

## 1. Job of the surface

Tapping **Who's going** on Explore (`listMode=going`, URL `view=going`) is the **primary in-map place to**:

| Job | User story |
|-----|------------|
| **See your crew** | Which **friends (buddies)** are **hosting** or **joining** outings on the current map/date filters |
| **Discover people** | Find **other signed-in members** on upcoming trips (or public directory) and open their **member card** to connect |
| **Become friends** | Send a **buddy request** from discovery, within a **free quota**; **Pro** for beyond the limit |
| **Join me** | As a **participant** (or host), **invite friends** to a specific activity — not only share a link |

Who's going is **Who** (people), not **Where** (places/shops). It complements the default browse list (trips/places), not replace it.

---

## 2. Current baseline (code today)

| Area | Today | Gap vs target |
|------|--------|----------------|
| **Entry** | `ExploreMapGoingPanelButton` → `browse.openGoingPanel()` | Panel title stays product copy “Who's going?” |
| **Segments** | `goingTab`: `people` \| `discover` \| `trips` (`ExploreGoingTab`) | Buddies presence, member-discovery roster, activity trips list |
| **Buddies on map** | `GET /me/buddies/activity-presence` (`buildBuddyActivityPresenceRows`) | Buddy graph × explore **activities** |
| **Profile links** | `/member/:id` from friend rows | Guests gated (`member-profile`); signed-in **public card** per P3 `viewerAccess` |
| **Pro browse API** | `GET /users/browse` for all signed-in members (quota on profile open) | Shipped (WG-3) |
| **Join me** | Explore Buddies tab + activity detail / host console `ActivityInviteSharePanel` (`GET/POST /activities/:id/invites`, sent **Invited** state) | Multi-activity picker on Explore when several eligible outings (future) |

---

## 3. Target information architecture

### 3.1 Segments (recommended)

Keep URL segment param; extend semantics:

| Segment | Label (product) | Content |
|---------|------------------|---------|
| `people` | **Buddies** | `GET /me/buddies/activity-presence` — buddies × map activities |
| `discover` | **Discover** | Members you don't know yet: from **trip rosters** (same date/filter as map) + optional **directory** search; profile card → buddy request |
| `trips` | **Trips** | Outings where **any** friend appears (current trips list mode) |

**Default when opening Who's going:** `people` if user has buddies; else `discover` with sign-in CTA already handled.

### 3.2 Discover row types

1. **On a trip near you** — derived from explore map payload: other participants on visible activities (respect `profile-viewer-access` / redaction).
2. **Public members** — paginated directory (`profileVisibility: public` only); search by display name.

Do **not** show private profiles in Discover. Co-participants on shared activities use existing trusted/full rules outside Discover.

### 3.3 Profile open paths

| Viewer | Surface | Exposure |
|--------|---------|----------|
| Guest | Who's going panel | Sign-in sheet (`guestBrowseGateCopy` `explore-going` / `member-profile`) |
| Signed-in | Friend row | `/member/:id` per relationship |
| Signed-in | Discover row | `/member/:id` **public card**; counts toward **discovery quota** when opened from Discover (§5) |

Use `mapProfileViewerAccessToMemberLink` + API `viewerAccess` — no parallel UI policy.

---

## 4. Free quota vs Pro (5 + unlimited)

### 4.1 Product rule (from stakeholder)

- **Free members:** up to **5** discovery actions per period (open stranger public card **or** send buddy request from Discover — **pick one canonical action** in implementation; recommend **count unique profile opens from Discover**).
- **Pro membership:** **more than 5** (unlimited or higher cap TBD when `PaidMembershipSku` ships).

This applies to **consumer** discovery (find friends), **not** to viewing **existing buddies** or people you already have a trusted relationship with.

### 4.2 Entitlement layer (layer 7)

| Id | Meaning |
|----|---------|
| `member_discovery_view` | May open N stranger profiles from Discover per window |
| `pro_member_directory` | **Repurpose:** unlimited Discover + directory (replace interim host-only `GET /users/browse` gate) |

**Resolver (planned):**

- `resolveMemberDiscoveryQuota(hostStatus, paidSku)` → `{ limit: 5 \| null, used, windowDays }`  
- `null` limit = unlimited (Pro / future `consumer_pro`).
- Until billing: Pro = `hostTiers.professional` **or** `hostTiers.business` **or** explicit `consumer_pro` when added — **product must confirm** whether **host Pro** alone unlocks unlimited consumer discover or a separate **consumer Pro** SKU.

### 4.3 UX when quota exhausted

- Discover rows remain visible; tap profile → **upgrade sheet** (`gateReason: upgrade_required`) → `PRO_MEMBERSHIP_PATH` with intent `discover-members`.
- Buddy request from Discover blocked with same gate (server enforced).

### 4.4 Reconcile shipped API (P5 interim)

| Endpoint | Interim (shipped) | Target |
|----------|-------------------|--------|
| `GET /users/browse` | Host Pro/business only | **All signed-in** members with quota; Pro unlimited |
| `GET /me/profile-view-stats` | Host Pro/business | Unchanged (analytics for storefront owners) |
| Profile view recording | On `public-profile` | Keep; optional tag `source=discover` for analytics |

**No further product work on browse gate until this plan is approved** — then change `registerMemberDiscoveryRoutes` + `viewerMayBrowsePublicMemberDirectory` in one horizontal pass.

---

## 5. Join me (activity invite)

Distinct from **crew chat** and **share link** ([`COMMUNICATION.md`](../COMMUNICATION.md) § Invites vs chat).

### 5.1 Who can invite

| Actor | Condition |
|-------|-----------|
| Host | Always (already has invite panel) |
| Participant | Checked-in or **approved** joiner (RSVP / approved request) — same as “going” on roster |

### 5.2 Mechanism (planned)

| Layer | Proposal |
|-------|----------|
| **API** | `POST /activities/:id/invites` `{ inviteeUserId }` or batch; store `activity_invites` (or reuse notifications + idempotency) |
| **Notification** | New kind e.g. `activity_join_invite` → `/activity/:id?invite=1` |
| **UI** | Who's going **Friends** row: “Invite to this trip” when viewer is on same activity; Activity detail: **Join me** section listing buddies + sent state |
| **Chat** | Optional DM still via `ActivityInviteSharePanel`; structured invite adds inbox card + push |

Inviting does **not** auto-join; invitee still uses normal join / request flow.

### 5.3 Copy

Lead with **Join me on this outing** — emotional, not “send activity link.”

---

## 6. Bounded contexts & files (implementation map)

| Context | Work |
|---------|------|
| **discovery** | Prefer existing `GET /me/member-discovery/roster` + map participant previews — no `/whos-going/*` aggregate API |
| **social_graph** | Buddy request from Discover; quota check in `registerBuddyRoutes` |
| **member_identity** | Quota store, `GET /me/discovery-quota`, profile opens with `source` |
| **participation** | Activity invites registrar + policy (participant/host) |
| **communication** | Notification kind + routing |

**FE:** `ExploreExperience.tsx`, `ExploreBrowsePanel.tsx`, `ExploreBuddyPresenceList`, `ExploreMemberDiscoveryList`, `ExploreGoingPanelTabs`, `Buddies` cross-links.

**Tests:** API quota + profile access; `buildBuddyActivityPresenceRows` + discover roster tests.

---

## 7. Phased delivery (implementation order)

| Phase | Scope | Exit criteria |
|-------|--------|----------------|
| **WG-0** | Approve this plan; update Tier-1 (NAVIGATION, MEMBER_MODEL, DOMAIN_CANONICALS §15 row, COMMUNICATION); resolve Pro SKU question | `verify:docs` |
| **WG-1** | Friends segment hardening: server-filtered friend trip rows; profile links use `viewerAccess` | No client-only privacy for rosters |
| **WG-2** | Discover segment UI + quota API + gate on profile open from Discover | Free 5 / Pro unlimited enforced server-side |
| **WG-3** | Repurpose `/users/browse` under quota; directory search in Discover | Shipped — roster + browse for signed-in members |
| **WG-4** | Activity invites (`Join me`) + notifications | Shipped — `?invite=1` deep link + activity banner |
| **WG-5** | Polish: empty states, Pro CTA copy, analytics (`source=discover`) | Shipped in `exploreGoingPanelCopy.ts` + Discover **Connect** (buddy request) |

**Explicitly out of scope for WG-1–2:** Partner campaigns, paid trip checkout, host console publish-as.

---

## 8. Open decisions (need product sign-off)

1. **Quota action:** count profile **opens**, **buddy requests**, or **both** toward the 5?
2. **Window:** rolling 30 days vs calendar month?
3. **Pro definition:** host Pro/business only vs future **consumer Pro** for unlimited discover?
4. **Discover default source:** trip rosters only first, or directory + rosters day one?
5. **Invite limits:** interim **20 / activity / sender / 24h** shipped (`ACTIVITY_JOIN_INVITE_DAILY_LIMIT_PER_ACTIVITY`) — tune with product.

---

## 9. Copy & navigation (draft)

- Map chip: **Who's going** (unchanged wire).
- Panel title: **Who's going** → subcopy: *See friends on upcoming trips and meet new people to go with.*
- Segments: **Buddies** · **Discover** · **Trips**
- Quota nudge: *You've viewed 5 member profiles this month. Go Pro to keep discovering people to go with.*

Update [`src/explore/exploreCopy.ts`](../../src/explore/exploreCopy.ts) when implementing — not in WG-0.
