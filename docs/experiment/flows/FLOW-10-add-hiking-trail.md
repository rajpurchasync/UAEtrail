# FLOW-10 — Add · Hiking trail (`add.trail`)

**Status:** Implemented (2026-10-01)  
**FAB:** Add → **Hiking Trails**  
**Code:** `CreateContributeFlow` · `contributeFlows/hiking.ts` · `ContributeHikingTrailPreview.tsx`  
**Related:** [FLOW-12 camping](./FLOW-12-add-camping.md) shares the same pattern without difficulty or trail stats.

Community members submit new hiking venues for **admin approval** before they appear on Explore.

## Steps

| # | Step | Screen |
|---|------|--------|
| 1 | `title` | Title |
| 2 | `image` | Photos — **1 required**, up to **5** |
| 3 | `location` | **Starting point** (emirate + map pin) |
| 4 | `trail_stats` | **Trail distance (km)** + **elevation gain (m)** |
| 5 | `difficulty` | **Easy / Medium / Hard** |
| 6 | `about` | About the trail |
| 7 | `transport` | **Transport accessible** — sedan and/or **4x4** |
| 8 | `review` | **Preview** — same layout as `/trail/:id` (hero, stats, overview tabs) |
| 9 | Submit | `POST /me/locations` → `status: draft` |

## After submit

| Action | Behavior |
|--------|----------|
| **Success sheet** | “Submitted for review” |
| **View pending** | Opens `/trail/:id` — pending banner; only submitter + admins until published |
| **Admin** | **Review in admin** link (admins) → `/admin/places` pending queue |

No parking pin step on this track (legacy camping/others flows unchanged).
