# Activity detail & map peek — implementation program

**Status:** `complete` (Oct 2026) · **Phases 0–8 shipped**; §6.2 narrative rows may still show ◐ for polish — wire + AD-CTA-01 are source of truth  
**Tier-1 (surgical only):** [`NAVIGATION.md`](../NAVIGATION.md) § Activity detail · [`CREATE_FLOW.md`](../CREATE_FLOW.md) · [`DOMAIN_CANONICALS.md`](../DOMAIN_CANONICALS.md) §15 · [`MEMBER_MODEL.md`](../MEMBER_MODEL.md) · [`COMMUNICATION.md`](../COMMUNICATION.md)  
**Related track (do not merge backlogs):** [`member-surfaces-implementation-plan.md`](./member-surfaces-implementation-plan.md) §19 Plan hub / seeking — **complete** for eng.

This document is the **only checkbox board** for activity peek + detail tabs. §21 in member-surfaces is a **summary pointer** — exit criteria live here.

---

## 0. Definition of done (every PR in this program)

1. **Requirement IDs** from §8 trace matrix named in PR description.
2. **Remove list** — old paths deleted in the same PR (anti-duplication).
3. **L1** — `packages/shared-types` policy test updated for claimed rows.
4. **L2** — API wire (`presentation`, `mapPeekActions`) if policy changed.
5. **L3** — FE maps wire → UI only; no new role matrices in components.
6. **Tier-1** — one section updated when product behavior changes.
7. **Gate** — `npm run verify:system:quick`; full `npm run verify:system` before closing a **phase**.
8. **Checkbox** — flip here only when the matching test ID in `activityDetailAcceptance.test.ts` or `activity-detail-cta-matrix.test.ts` is green (not `it.fails`).
9. **CTA changes** — read **§6.2** first; if the row is not there, add it here before coding.

---

## 1. North star

| Goal | Implication |
|------|-------------|
| Get outside together | Detail: what · where · who · how to get there — not admin spec sheets. |
| Transport (GCC) | Transport tab **always**; reach-by; linked rides; sustainability nudges. |
| Trust | Meeting + crew chat only for confirmed participants + host; pending = Plan (+ join) only; **no** locked meeting/chat rows — **welcome modal** after join. |
| Pro | Paid **social** depth — not host publish tier. |
| One mental model | Peek = decide; detail tabs = live outing; host runs outing from **Buddies** (+ ⋯ on Plan). |

---

## 2. UI vocabulary vs wire (mandatory)

| UI (members) | Wire / code |
|--------------|-------------|
| Plan · Place · Buddies · Transport | `activity`, `viewerAccess`, `rideshare`, `participants`, … |
| Chrome: emoji + **activity title** (AD-2b) | `activityType`, `title`, `activityIdentity` formatters |
| Kind label | Fact chips (not chrome) — pending Tier-1 sync |
| Copy | `src/content/activityDetailCopy.ts` |

---

## 3. Decisions (D1–D15)

| ID | Decision |
|----|----------|
| D1 | Four UI tabs only; no fifth Manage tab — **Manage** on peek = deep link `?tab=buddies`. |
| D2 | **AD-2b:** Chrome = **emoji + activity title**; hero = venue + smart date + **large title** + chips (time without Start/End labels). |
| D3 | Transport tab always visible. |
| D4 | RSVP → crew immediately + welcome modal; approve → crew + `?joined=1`; pending/waitlist → `canAccessCrewSurfaces: false`. |
| D5 | Merged Plan body: requirements + about + itinerary. |
| D6 | No meeting/chat UI for unconfirmed; modal: Join group chat · See meeting location → Place. |
| D7 | Pro: host profile pre-join, full roster, offer/add transport — `ActivityViewerEntitlementsDTO`; not `canPublish`. |
| D8 | Peek: hero facts · Participants strip · Logistics strip; CTAs by state (not one “primary footer”). |
| D9 | Peek/detail **same policy brain** — one resolver output for actions + strip flags. |
| D10 | Host peek uses **wire** `mapPeekActions` (no parallel `HostActivityCtas` on activity peek). |
| D11 | Peek participants strip respects `canViewFullBuddyRoster` like detail Buddies. |
| D12 | Private activities not on public map (`explore-map.ts`). |
| D13 | `groupChatPostPolicy` on activity; participants read when host-only send. |
| D14 | Reviews after host confirm attendance / check-in gates. |
| D15 | No package picker, external signup UI, or draft consumer entry on this surface. |
| D16 | **Dynamic CTAs** per viewer state — full matrix **§6.2**; peek footer + detail footers + strip affordances **must match** for the same state (D9). |
| D17 | **Profile deep links** from activity: not friend → **Add friend** + **Follow**; friend → **Message** + **Follow** toggle (unfollow alerts); buddy **unfriend** stays on Buddies list (or future profile row) — not a join-matrix fork. |
| D18 | **Host on own activity:** Participants strip shows **My public profile** (member or tenant public profile route); manage lives on **Buddies** (`?tab=buddies`), peek **Manage** deep-links there. |

---

## 4. Policy layers (implementation order)

```text
L0  Invariants (§3, bundles A–D in DOMAIN §15.4)
L1  shared-types: resolveActivityEngagementPolicy → capabilities + intents + strips + presentation
      projectActivityMapPeekActions(policy) for explore map footer
L2  API: GET /activities/:id uses policy.presentation; explore map mapPeekActions from policy intents (+ entitlement merge)
L3  FE: map wire ids → handlers only; optional policy fallback via activityPeekEngagement
```

---

## 5. Bundles A–D (crew)

| Bundle | Contents |
|--------|----------|
| A — Discovery | Hero, Plan copy, host row (gated), coarse transport, spots, public linked-ride summary |
| B — Crew | Place body, chat membership, full plan bodies when split |
| C — Social | Host profile + roster (Pro / friend rules) |
| D — Reviews | Post check-in prompts |

Pending/waitlist → **A only**. RSVP/approved participant + host → **B**.

---

## 6. Dynamic CTAs — product spec + implementation status

**Policy owner (target):** one L1 output (`buildActivityPresentationDTO` + `surface: 'map_peek' | 'activity_detail'`) driving **peek footer actions**, **detail sticky footers**, **strip affordances**, and **profile deep-link CTAs**. Until Phase 4 closes, peek uses `computeActivityMapPeekActions` + entitlements merge; detail uses `resolveActivityDetailTabFooterKind` + `JoinRequestActions` / `HostActivityCtas` — **not one matrix**.

**Dimensions:** viewer role · join/RSVP state · Pro · friend-of-host · roster friend labels · host empty/full · linked rideshare · slots · participation mode (RSVP vs approval).

### 6.0 Activity peek layout (three zones)

| Zone | Job | Wire / modules today |
|------|-----|----------------------|
| **Hero** | Facts (venue, date, title meta) — unchanged | Peek card meta / `ExploreItemPeekParts` hero |
| **Participants** | Host row + going roster rules (Pro lock, friends clickable) | `ExploreActivityPeekStrips` → `ExploreCardPeopleRow` |
| **Logistics** | Linked rideshare **view** (open rideshare peek) + **offer** ride (Pro participant/host) + capacity | `ExploreLinkedRidesharePeekIndication` + `ExploreCardCapacityRow` |

Peek **footer** (below strips) = primary/secondary **actions** from `mapPeekActions` (target) — not a fourth zone.

### 6.1 Touchpoints (same policy must agree)

| Touchpoint | What users see |
|------------|----------------|
| Map/list **peek footer** | Join / pending / chat / invite / view detail / (target) share · manage · withdraw |
| **Detail chrome** | Share icon; AD-2b title chrome |
| **Detail hero strip** | Joined / pending / spots chips (`resolveActivityDetailHeroStatusChips`) |
| **Detail tab sticky footer** | Tab-scoped kinds (`plan_join`, `buddies_invite`, `transport_*`, `plan_host_share`) |
| **Buddies tab** | Roster lock + Pro upsell; host **manage hub** (`ActivityDetailHostBuddiesHub` + confirm attendance) |
| **Transport tab** | Reach-by; linked ride; offer/add (Pro gates) |
| **Member profile** (from host/participant links) | Add friend · Message · Follow / Unfollow |
| **Linked rideshare peek** | Bidirectional open parent outing ↔ rideshare card |

### 6.2 State matrix (authoritative product — Oct 2026)

Legend: **✅** implemented (rough parity) · **◐** partial / wrong surface / bypass path · **📋** planned in this doc, not built · **➖** N/A

#### A — General participant, **before** approval or RSVP (not in crew)

| Item | Peek | Detail | Profile / roster / rideshare | Status |
|------|------|--------|------------------------------|--------|
| Primary join | Request to join (+ join mode label) | Same + sticky `plan_join` | — | ✅ wire `request_join` / `JoinRequestActions` |
| Secondary | View details | Share (chrome) | — | ✅ `view_detail`; ✅ share on detail |
| View host | Gated (upsell if not Pro/friend) | Same (`canViewHostProfileBeforeJoin`) | Not friend: Add friend + Follow | ◐ peek/detail host row; ✅ profile buddy + follow |
| View participants | Pro-locked roster; **friends** visible/clickable | Buddies tab lock + friend subset | Friend profile: Message (no unfriend on profile — Buddies page only) | ✅ AD-PRO-01 peek roster mask |
| Rideshare | View linked → rideshare peek | Transport tab | — | ✅ logistics strip + transport tab; ◐ no **offer** in strip for free user |

#### B — **Pro** participant, **before** crew

| Item | Peek | Detail | Notes | Status |
|------|------|--------|-------|--------|
| Join row | Request + View details | Request + Share | Same as general | ✅ |
| View host | Enabled → profile | Enabled | Host profile CTAs: Add friend + Follow; if friend: Message + **Unfollow** (follow control) | ◐ Message+Follow ✅; **Unfollow** = follow toggle ✅; friend **unfriend** not on profile |
| View participants | Unlocked list + profile routes | Buddies unlocked | Pro connect on profiles | ✅ AD-PRO-01 |
| Rideshare | View + **offer** (network) | View + offer (Pro) | Offer in **Logistics** strip + actions | ✅ AD-PRO-02 + `offer_rideshare` on wire (Pro) |

#### C — General participant, **after** approval or RSVP (in crew)

| Item | Peek | Detail | Status |
|------|------|--------|--------|
| Status | **Joined** chip | Joined chip in hero strip | ✅ peek + detail |
| Main CTAs | Chat + Invite friends | Chat shortcuts + invite footer | ✅ wire `open_crew_chat` + `invite_crew` |
| Secondary | Rideshare offer (Pro); **Withdraw** | Same + withdraw in join UI | ✅ `withdraw_join` + `offer_rideshare` on peek (Pro); detail join UI |
| View host | Enabled | Enabled | ✅ post-crew entitlements |
| Participants | Pro lock + friends | Buddies lock | ◐ peek |
| Rideshare | View + offer (Pro) | Transport | ◐ view ✅; offer gated in UI, not unified in peek actions |

#### D — Host, published, **no joiners**

| Item | Peek | Detail | Manage (Buddies) | Status |
|------|------|--------|------------------|--------|
| Primary | **Share** + **Manage** | Share + Manage (`plan_host_share` + host CTAs) | No participants + Invite + invited chips | ✅ `share_activity` + `manage_activity` peek; AD-PRES-03 detail footer |
| Host section | “My host profile” → public profile | Same | — | ✅ AD-PEEK-05 |
| Participants | `0/N` + invited chip | Hero + peek strips | Empty state + invite | ✅ AD-DEDUPE-01 `pendingJoinInviteCount` |
| Rideshare | No link + Add (Pro) | Transport empty + add | — | ◐ `link_rideshare` on wire for host; peek bypass |

#### E — Host, published, **with joiners**

| Item | Peek | Detail | Manage | Status |
|------|------|--------|--------|--------|
| CTAs | Crew chat + Share + Manage | Chat + Manage sheet | All participants visible; friend labels; confirm attendance | ✅ `open_crew_chat` first when joiners; share/manage wire; ✅ confirm attendance |
| Rideshare | Linked + Add (Pro) | Transport | — | ◐ partial |

### 6.2.1 Cross-cutting rules (every row in §6.2)

| Rule | Product | Wire / code hooks |
|------|---------|-------------------|
| Join label | **Request to join** vs **I'm going** | `participationMode` + `activityJoinCtaLabel` — same matrix row, different primary label only |
| Crew timing | RSVP → instant crew + welcome; approve → crew on approval; pending/waitlist → no crew surfaces | `canAccessCrewSurfaces`, `joinEngagement` (`activity-join-engagement.ts`) |
| Host profile pre-crew | Open only if **Pro** or **friend of host** | `entitlements.canViewHostProfileBeforeJoin` |
| Roster pre-crew | **Pro** = full list; **free** = locked with **friends on outing** still visible + tappable | `canViewFullBuddyRoster`, `buddyUserIdsOnActivity` (peek strip **must** filter — AD-PRO-01) |
| Rideshare navigation | **View** opens linked **rideshare map peek** (or parent outing from rideshare card) | `ExploreLinkedRidesharePeekIndication`, `onOpenExploreItem` |
| Rideshare offer | **Pro** participant (joined) or **Pro** host — offer/add in Logistics strip **and** aligned footer action | `canOfferTransport`, `canAddLinkedRide` (AD-PRO-02) |
| Share (host) | Share outing — native share sheet; target UX includes pick **friends / groups** where product supports it | Today: `ShareButton` / sticky `plan_host_share`; wire `share_activity` (target) |
| Withdraw | Confirmed or pending joiner may leave; comment required for host on some paths | Detail `JoinRequestActions`; target `withdraw_join` on peek |

### 6.2.2 Member profile CTAs (opened from host or participant row)

| Viewer ↔ profile subject | CTAs on `/member/:userId` | Notes |
|--------------------------|---------------------------|--------|
| Not friends | **Add as friend** + **Follow** | `MemberProfileBuddyActions` + `MemberFollowControls` |
| Friends | **Message** + **Follow** (toggle → unfollow alerts) | User spec “Unfollow” on follow control for Pro path; **Unfriend** buddy → Buddies list today |
| Guest | Sign-in gate | `ExploreGuestSignInCard` / profile `gateReason` |

Host **tenant** public profiles (`/guide/:slug`, agency row, etc.) keep publisher routing — same social intent, different path (`resolveActivityPublisherProfilePath`).

### 6.2.3 Host manage surface (Buddies tab — not a fifth tab)

| Capability | Product | Module |
|------------|---------|--------|
| Empty roster | “No participants yet” + **Invite** | `ActivityDetailHostBuddiesHub`, invite footers |
| Invited / pending | **Invited** chip on peek + detail hero | ✅ `pendingJoinInviteCount` wire |
| With joiners | Host sees **all** participants (including private profiles) + **friend** label on buddies | `ActivityParticipantsPanel` |
| Per participant | Name → profile; **Confirm attendance** per row; bulk select confirm | `ActivityParticipantsPanel` |
| After confirm | **Review participant** flow (post check-in) | Plan/Buddies prompts (Phase 8 ✅); tie to attendance confirm |
| Pending requests queue | Approve / decline join requests | `ActivityJoinRequestCard` in host hub |

Peek **Manage** = `ActivityManageSheet` on explore map (`manage_activity` wire); detail Buddies tab remains host hub (D1).

### 6.2.4 Peek ↔ detail parity checklist (per state bucket)

| Bucket | §6.2 | Peek footer | Detail Plan chrome/footer | Strips |
|--------|------|-------------|---------------------------|--------|
| A pre-crew free | A | request + view detail | join + share | host gated; roster lock |
| B pre-crew Pro | B | same + message_host when entitled | same | host open; roster unlock on peek |
| C in crew | C | joined chip + chat + invite + withdraw + carpool | hero chip + footers + withdraw | logistics view/offer |
| D host empty | D | share + manage | share + buddies hub | 0/N + invite |
| E host joiners | E | message + share + manage (text → detail) | message + manage sheet | roster + rideshare |

**Implementation closes** when AD-CTA-01 golden tests assert each column for fixture viewer states.

### 6.3 Wire action vocabulary (today vs target)

**Today (`ActivityMapPeekActionId`):** `request_join` · `pending_join` · `view_detail` · `open_crew_chat` · `invite_crew` · `link_rideshare` · `message_host`

**Target additions (Phase 4–5):** `share_activity` · `manage_activity` (→ Buddies / host hub) · `withdraw_join` · `offer_rideshare` / `view_rideshare` (align strip + footer) · optional `joined_badge` (hero/strip, not a button)

Peek/detail **must not** diverge: same ordered action list per state after L1 `surface` switch (D9).

### 6.4 Implementation summary (honest)

| Layer | Status |
|-------|--------|
| **Planned** | Full §6.2 matrix + §6.0 three-zone peek + profile CTAs + host manage flows — **this section** |
| **Partially implemented** | Host share picker (friends/groups beyond native share); §6.2 narrative polish only |
| **Not implemented** | Host share picker (friends/groups) beyond native share sheet |
| **Wrong path still live** | — peek bypass removed (AD-PEEK-03 ✅); host detail uses wire `plan_host_share` + `hostDetailCtas` (AD-PRES-03 ✅) |

### 6.5 Extension (camping, activity-kind plan bodies)

Reuse **same engagement policy**; add **presentation slices** per `activityType` / place kind for Plan/Place copy and fact chips (camping vs hike). Do **not** fork CTA matrices per kind — only tab **content** and map/location affordances differ. Track under places/discovery coherence when kind-specific location UX ships.

### 6.7 Implementation sequence (start here — do not skip rows)

| Step | IDs | Deliverable |
|------|-----|-------------|
| 1 | AD-PEEK-02 (partial) ✅ | `resolveActivityEngagementPolicy` + `projectActivityMapPeekActions` in shared-types; API + detail presentation wired |
| 2 | AD-PEEK-03 ✅ | Activity peek no longer uses `HostActivityCtas` bypass; host uses wire actions |
| 3 | §6.3 wire | Add `share_activity`, `manage_activity`, `withdraw_join`, `offer_rideshare` (+ handlers in one FE mapper) |
| 4 | AD-PRES-02 (partial) ✅ | `ActivityDetail.tsx` consumes `presentation.footerByTab`; tab slices still local |
| 5 | AD-PRO-01 ✅ | Peek Participants strip: roster mask + friend subset |
| 6 | AD-PRO-02 ✅ | Logistics strip: offer ride CTA for entitled host/participant |
| 7 | §6.2 C (partial) ✅ | Peek **Joined** chip + **withdraw** / **offer_rideshare** on wire |
| 8 | AD-PEEK-04, AD-CTA-01 ✅ | L1 golden matrix tests per §6.2.4 (bucket E: `message_host` still spec gap) |
| 9 | Tier-1 ✅ | `NAVIGATION.md` § Activity detail + map peek — L1 wire parity paragraph |

---

## 7. Phases (dependency order)

### Phase 0 — Program lock ✅

- [x] This document + honest §21 pointer
- [x] `activityDetailAcceptance.test.ts` in `verify:domain`
- [x] `.cursor/rules/activity-detail-program.mdc`

### Phase 1 — Shell ✅

- [x] Tabs, copy module, hero, manage sheet embeds detail
- [x] AD-CHROME-01: Tier-1 + code — emoji + **title** in chrome (D2) — **local**; commit with `ActivityDetailView` + `activityKindChrome`

### Phase 2 — API crew exposure ✅

- [x] `canAccessCrewSurfaces`, redacted detail, RSVP/approve → group
- [x] Entitlements on explore + detail context

### Phase 3 — Tab bodies ✅ (polish ongoing)

- [x] Plan / Place / Buddies / Transport modules, welcome sheet, tab footers
- [x] AD-PRES-02: FE consumes `presentation.footerByTab` + `presentation.tabs` via `resolveActivityDetailTabUi`
- [x] AD-PRES-02 (polish): Preview overlay + manage sheet use L1 wire; API fallback via `effectiveWirePresentation`

### Phase 4 — Peek parity + one brain ✅

- [x] AD-PEEK-01: Three strips (`ExploreActivityPeekStrips`)
- [x] AD-PEEK-02 (partial): `resolveActivityEngagementPolicy` — intents + presentation one input; entitlement projector for map
- [x] AD-PEEK-02 (strips): `mapPeekStrips` on explore map wire + FE `resolveActivityMapPeekStrips`
- [x] AD-PEEK-02 (finish): L1 wire for detail footers/tabs (`resolveActivityDetailWirePresentation`); view uses `wireFooterByTab` only
- [x] AD-PEEK-03: Remove activity peek `HostActivityCtas` branch; host states → wire ids
- [x] AD-PEEK-04: Matrix tests for guest / joined / host-empty / host-joiners peek actions (via AD-CTA-01)
- [x] AD-CTA-01: Golden tests for §6.2.4 buckets A–E (L1 peek + `footerByTab` + strip flags)

### Phase 5 — Pro on every surface ✅

- [x] Detail roster + host profile gates
- [x] AD-PRO-01: Peek `ExploreCardPeopleRow` applies `canViewFullBuddyRoster`
- [x] AD-PRO-02: Logistics strip — offer ride for entitled participants + host (network effect)

### Phase 6 — Chat policy + share ✅

- [x] `groupChatPostPolicy`, share/OG without meeting

### Phase 7 — Dedupe ✅ (re-verify after Phase 4)

- [x] No `HostActivityDetailView`; no `activityMapPeekActions.ts` shim
- [x] AD-DEDUPE-01 (partial): Removed `showHostActivityCtas` + dead host peek handler props; detail engagement via L1
- [x] AD-DEDUPE-01 (finish): Invited peek chip when map wire carries pending-invite count (`mapPeekStrips.pendingJoinInviteCount`)

### Phase 8 — Reviews UX ✅

- [x] Post check-in prompts on Plan/Buddies

---

## 8. Trace matrix (requirement → test)

| ID | Invariant | Test (vitest) | Status |
|----|-----------|---------------|--------|
| AD-ARCH-01 | Program doc is canonical checklist | `activityDetailAcceptance` governance | done |
| AD-ARCH-04 | §6 dynamic CTA spec captured (A–E + §6.2.1–4) | `activity-detail-cta-matrix` governance | done |
| AD-CHROME-01 | Chrome emoji + title (D2) | `activityDetailAcceptance` AD-CHROME-01 | done (uncommitted) |
| AD-PRES-01 | Wire `presentation` on GET detail | API route contains `presentation` | done |
| AD-PRES-02 | FE uses `footerByTab` + `tabs` | `activityDetailAcceptance` + `resolveActivityDetailTabUi.test` | done |
| AD-PEEK-01 | Three strips on peek | `memberSurfacesAcceptance` AD-4 | done |
| AD-PEEK-03 | No host CTA bypass on activity peek | `activityDetailAcceptance` AD-PEEK-03 | done |
| AD-PRO-01 | Peek roster Pro mask | `activityDetailAcceptance` AD-PRO-01 | done |
| AD-PRO-02 | Logistics offer strip | `ExploreActivityPeekStrips` + `activity-detail-cta-matrix` bucket C | done |
| AD-PEEK-02 | L1 drives peek + detail wire | `activity-engagement-policy` + `resolveActivityDetailWirePresentation` | done |
| AD-PEEK-04 | Peek action buckets A–E | `activity-detail-cta-matrix.test.ts` runtime | done |
| AD-CTA-01 | §6.2.4 parity (L1) | `activity-detail-cta-matrix.test.ts` runtime | done (E: `open_crew_chat` when joiners) |
| AD-DEDUPE-01 | Host invited chip on peek | `activityDetailAcceptance` + `explore-map-viewer-access` | done |
| AD-PEEK-05 | Host “My host profile” on peek people row | `activityDetailAcceptance` AD-PEEK-05 | done |
| AD-PRES-03 | Host mobile footer Share + Chat/Manage via `plan_host_share` | `activityDetailAcceptance` AD-PRES-03 | done |
| AD-PEEK-06 | Host peek `share_activity` / `manage_activity` handlers | `activityDetailAcceptance` AD-PEEK-06 | done |

---

## 9. Remove targets (when closing Phase 4–5)

| Target | Replaced by |
|--------|-------------|
| `showHostActivityCtas` on activity map/list peek | Wire `mapPeekActions` + handlers |
| Duplicate peek CTA logic in `ExploreItemPeekParts` | `resolveActivityPeekEngagement` only |
| FE-only `computeActivityMapPeekActions` outside fallback module | API wire + one FE fallback |
| Multiple engagement resolvers (consolidate) | `buildActivityPresentationDTO` (+ `surface`) |

---

## 10. Anti-drift (agents & humans)

- Read this file before changing `src/activity/**`, `ActivityDetail*`, explore peek.
- Do **not** tick §21 AD-4/AD-5 peek items here without closing §8 test rows.
- `npm run verify:system:quick` does **not** prove matrix completeness — only guards + acceptance tests.
