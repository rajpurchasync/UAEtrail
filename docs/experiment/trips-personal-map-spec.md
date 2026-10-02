# Personal outdoor activity map — product & technical plan

**Name in product:** *Your outdoor map* (member-owned; not “Explore”).  
**Route:** `/trips/map`  
**Status:** In development on `main`.

Companion: [`profile-and-trips-phases.md`](./profile-and-trips-phases.md), [`NAVIGATION.md`](../NAVIGATION.md), [`NORTHSTAR.md`](../NORTHSTAR.md).

---

## Two maps — do not mix them

| | **Explore** (`/explore`) | **Personal outdoor map** (`/trips/map`) |
|---|--------------------------|----------------------------------------|
| **Question** | What can I join *here*? Who’s going *now*? | Where have *I* been outside? Where do *I* want to go? |
| **Geography** | UAE & GCC discovery (product home) | **Anywhere in the world** — member’s own footprint |
| **Pins** | Public outings, venues, demand, shops | **Only this member’s** memories & wishes |
| **Emotion** | Discovery, FOMO, connection | **Keepsake** — something to hold dear and share when ready |
| **Chrome** | Filters, FAB, community layers | No discovery UI — just *their* story on a basemap |

Explore helps you **find your people and go together**.  
The personal map is **your outdoor life on a map** — hikes, camps, treks, group events, runs, and anything else you did outside — whether it happened on UAE Trail or years before you signed up.

---

## Core purpose

A **private (by default) outdoor activity map** the member owns:

- **Remember** — peaks, trails, campsites, trips, festivals, treks, “that weekend in Oman…”
- **Aspire** — places they want to hike, camp, or travel to next
- **Prove (to themselves)** — “I really do get outside” over years, not one Instagram post
- **Share (later, opt-in)** — a slice of that story with friends or on their public profile — not a live copy of Explore

UAE Trail **check-ins** are a **convenience**: when you join and attend an outing through the app, we add a visited pin so you don’t re-type it. They are **not** the whole product. Most of a long-term member’s map may be **manual pins** from life before and outside the app.

---

## What goes on the map

Each **pin** is one outdoor moment or intention:

| Field | Role |
|-------|------|
| **Location** | Lat/lng — any country |
| **Title** | “Jebel Jais sunrise”, “Annapurna base camp”, “Desert camp with friends” |
| **Date** | When they went (or hope to go) |
| **Kind** | **Been there** (visited) · **Want to go** (wishlist) |
| **Activity type** (enrich later) | Hike · camp · trek · trail run · event · other — for stats & pin style |
| **Source** | Manual · UAE Trail check-in · (future: import) |
| **Notes / photos** | Optional depth later |

**Stats** (on this screen, not Explore) answer: how many places, how many hikes vs camps, this year vs all time, how many from app vs added by hand.

**Share** (later): journey card or read-only map URL — member chooses visibility; wishlist often stays private.

---

## User flow (target)

1. Open **Your outdoor map** — full-screen map; **list** opens from a floating button (bottom sheet).
2. **Filter chips:** All · Want to go · Joined · Hosted · Gone (counts + pin colour dots).
3. **Map** — zoom anywhere, **Add pin**, **I’ve gone** / **I want to go** (+ activity type).
4. **List** — same filter; tap row for detail; outings without coordinates still listed.
5. **Share** — summary text (public map URL later).

### Filter meaning (personal map only)

| Filter | Contents |
|--------|----------|
| **Want to go** | Wishlist pins (amber map pin) |
| **Joined** | UAE Trail participations (blue pin) |
| **Hosted** | Activities you host (purple pin) |
| **Gone** | Places you’ve been — manual pins (green pin) |
| **All** | Union of the above (deduped by activity when applicable) |

---

## What this is not

- Not Explore, not `myTrips=1` on the discovery map (legacy redirect only).
- Not host console, not venue catalog, not “browse the UAE”.
- Not a GPS tracker or Strava replacement (no live tracking).
- Not limited to UAE — **global** is intentional for the personal map.

---

## Data & API (current)

Collection: `member_map_pins`. Types: `packages/shared-types/src/member-map-pins.ts`.

| Endpoint | Purpose |
|----------|---------|
| `GET /me/trips/map` | Owner map + basic stats |
| `POST /me/map-pins` | Manual pin anywhere |
| `PATCH /me/map-pins/:id` | Title, date, notes, kind |
| `DELETE /me/map-pins/:id` | Remove manual pin |

Check-in hook adds visited pins for UAE Trail outings with resolvable coordinates.

### Gaps vs product vision

| Vision | Today |
|--------|--------|
| Global “hold dear” framing in UI | Copy still leans on app check-ins |
| Activity type on manual pins | `activityType` mostly on check-in pins |
| Rich stats on map page | API counts only; minimal header |
| Share / public journey view | Not built |
| World-fit bounds when pins span countries | Basic fitBounds |

---

## Map technology

**Leaflet** (`TripsJourneyMap`) — same tile stack as other app maps, **zero** Explore components (no FAB, filters, demand, venue browse).

```
/trips/map → TripsMap → TripsJourneyMap + pin sheet + (target) stats + share
```

---

## Build order (personal map only)

| Step | Deliverable |
|------|-------------|
| **Done (slice)** | Manual global pins, check-in pins, owner map UI |
| **Next** | Stats card on map; copy & naming aligned to *outdoor life map*; pin edit (title, date, activity type) |
| **Then** | Share journey card + privacy toggle + public read-only map |
| **Then** | Profile entry + mini preview; filters (been / want / hike / camp) |
| **Later** | Photos per pin, import, hosted-as-leader pins |

---

## North star tie-in

Discovery on Explore → **go together** on outings.  
The personal map → **remember and be proud of your outdoor life**, so connection feels grounded in real experience — not just another map of listings.
