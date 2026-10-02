# Personal map / wishlist + match alerts (experiment)

**Status:** v1 shipped on `main` — profile saved map, explore bookmark, in-app match alerts (activities + demand)  
**Branch:** `main`  
**Flow:** [`flows/FLOW-11-profile-wishlist.md`](./flows/FLOW-11-profile-wishlist.md)  
**Related:** [Explore alignment phases](./explore-alignment-phases.md) · [NAVIGATION.md](../NAVIGATION.md) § Profile hub

---

## Problem (north star)

People browse the map with intent (“weekend hikes in RAK”, “climbing crew”, “free community runs”) but leave without posting **Demand** or joining a plan. They want a **lightweight save** that keeps working for them: when something **new** appears that fits, they hear about it — without scrolling the map daily.

Lead copy angle: **find your people** — save what you’re looking for; we’ll tap you when it shows up.

---

## Profile management (hard rule)

Wishlist is **not** a standalone product area or host tool. It lives in the **personal hub**:

| Surface | Route | Job |
|---------|-------|-----|
| Profile hub quick action | `/profile` → **Saved** | Discoverability |
| **Management screen** | `/profile/wishlist` | List, open on map, remove saves |
| Settings stack | `/profile/settings` → **Saved map & alerts** | Same destination + future global toggles |

Explore may offer a **Save** control on cards; after save, copy points members to **Profile → Saved map**.

Account lifecycle: include saves in **data export** and **account deletion** (today: `user_favorites`).

---

## Product concepts (two layers)

| Concept | User mental model | Implementation |
|--------|-------------------|----------------|
| **Saved pin** | Google-style “saved place/plan” | `user_favorites` (v1 UI on `/profile/wishlist`) |
| **Match alerts** | “Notify me when…” | Future: `alertOnMatch` + rules; in-app notifications |

Optional later: **named saved explore filters** (URL state JSON) — still managed under `/profile/wishlist`.

---

## How this relates to existing flows

| Existing | Storage | Overlap with wishlist |
|----------|---------|------------------------|
| **Demand** (Find) | `participant_intents` | Public map only — **not** saved via wishlist API. Match alerts may still notify wishlist holders when new demand fits their saved intent. |
| **Organize** | `activities` | Match source when hosts publish |
| **Favorites API** | `user_favorites` | v1 backend for saved pins |

---

## Match engine (technical sketch)

**Trigger:** Activity or demand becomes **published** / visible on explore map.

**Candidate filters (align with E4/E5):**

- `composeIntent`, `outingCategory`, `outingTopic`
- Geo: emirate, radius, bbox
- Time, price, `participationMode`

**Delivery:** **In-app only** (v1).

---

## Phase E11

| Step | Work | Status |
|------|------|--------|
| E11.1 | Profile routes + FLOW doc | Done |
| E11.2 | Explore peek Save + watch metadata on favorites | Done |
| E11.3 | Fan-out in-app notifications on publish / new demand | Done |
| E11.4 | Per-save alert toggles on `/profile/wishlist` | Done |

**Depends on:** E4/E5 plan fields.

---

## Decisions (2025-09-30)

| Topic | Decision |
|-------|----------|
| **Profile ownership** | All wishlist **management** under `/profile` + `/profile/settings` — see FLOW-11 |
| **Demand vs wishlist** | Demand on map; wishlist = private saves + in-app alerts on new Organize **and** Demand |
| **“Own map”** | Save on explore map; manage in Profile |
| **Notifications** | In-app only (v1) |

## Still open

1. **Match dimensions** — category/topic, date window, region/bbox, price?
2. **Limits** — max saves per user; digest vs instant in-app?
3. **Fulfill** — notify when someone fulfills *my* Demand?

---

## Non-goals (initial)

- Replacing Demand pins or host fulfill flow
- Public/shared wishlists
- Email/push for v1
