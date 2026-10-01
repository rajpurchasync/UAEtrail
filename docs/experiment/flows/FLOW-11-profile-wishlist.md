# FLOW-11 — Profile wishlist & saved map

**Status:** In progress — profile route + favorites list (2026-09-30)  
**Product doc:** [`WISHLIST_MAP_ALERTS.md`](../WISHLIST_MAP_ALERTS.md)  
**API (v1 saves):** `GET/POST/DELETE /me/favorites` · `user_favorites`  
**UI:** `/trips?segment=wishlist` (legacy `/profile/wishlist` redirects) · Profile menu **Trips** · Settings link

---

## Summary

Signed-in members **save map pins** from explore (places, shops, people — activities/demand as API allows) and **manage everything under Profile**, not host console or explore-only chrome. **In-app notifications** when new Organize or Demand pins match saved intent ship after match engine (E11.2+).

| Field | Value |
|-------|--------|
| Surface | **Trips** `/trips?segment=wishlist` (from Profile menu or Settings) |
| Settings | `/profile/settings` — link + future global alert toggle |
| Storage (v1) | `user_favorites` (extend with `alertOnMatch`, saved filter JSON later) |
| Demand on map | Unchanged — wishlist is private saves + alerts, not a replacement |
| Notifications | In-app only (v1) |

---

## User journeys

### Save from explore

1. Member taps **Save** on map card / peek (venue, shop, etc.).
2. `POST /me/favorites` with target id.
3. Optional toast: “Saved — manage in Profile”.

### Manage in profile

1. Profile → **Trips** → Wishlist segment (or Settings → **Saved map & alerts**).
2. List: title, type chip, **Open on map**, **Remove**.
3. Empty state → **Explore the map** (`EXPLORE_MAP_PATH`).

### Alerts (later)

1. Per-save or global **Notify when similar plans appear**.
2. Match on publish: `activities` + `participant_intents`.
3. Deliver via existing notifications store → profile bell.

---

## Profile placement (hard rule)

| Do | Don’t |
|----|--------|
| Hub quick action + dedicated `/profile/wishlist` | Standalone `/wishlist` top-level route |
| Settings stack for alert prefs & data export mention | Host `/host/*` tools |
| Include in account deletion + JSON export | Hidden only under explore FAB |

Align with [`NAVIGATION.md`](../../NAVIGATION.md) § Profile hub.

---

## Implementation checklist

- [x] FLOW doc + product brief
- [x] `/profile/wishlist` route (lists `GET /me/favorites`)
- [x] Profile hub + Settings entry
- [x] Explore peek **Save** → activity/demand/venue/shop + watch metadata on `user_favorites`
- [x] In-app notification fan-out on activity publish + demand create (`wishlist-alerts`)
- [x] Per-save **In-app alerts** checkbox on `/profile/wishlist` (`PATCH /me/favorites/:id`)
- [x] Explore `?pin=` deep link + notification **View on map**

---

## Copy (north star)

- **Title:** Saved map  
- **Subtitle:** Places and plans you’ve starred — we’ll tap you in-app when new outings match.  
- **Empty:** Nothing saved yet — explore the map and star what you’d go back to.
