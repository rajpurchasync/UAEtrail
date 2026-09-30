# FLOW-12 — Add · Camping (`add.camp`)

**Status:** Implemented (2026-10-01)  
**FAB:** Add → **Camping Spots**  
**Code:** `CreateContributeFlow` · `contributeFlows/camping.ts` · `ContributeCampingSpotPreview.tsx`

Aligned with [FLOW-10](./FLOW-10-add-hiking-trail.md) — same photos, location, about, transport, preview, and admin pending path — **without** trail distance, elevation, or Easy/Medium/Hard.

## Steps

| # | Step | Screen |
|---|------|--------|
| 1 | `title` | Title |
| 2 | `image` | Photos — 1 required, up to 5 |
| 3 | `location` | **Camp location** (emirate + pin) |
| 4 | `surface` | **Surface type** — Sand, Grass, Rocks, Rocky, Mixed terrain, Gravel (multi-select) |
| 5 | `about` | About the spot |
| 6 | `transport` | Sedan and/or 4x4 |
| 7 | `review` | Preview (`/camp/:id` style) → Submit |

**After submit:** Success sheet → **View pending** → `/camp/:id` (draft) · admin queue at `/admin/places`.

**Shop** (`add.shop`) stays a separate flow (contact, host application).
