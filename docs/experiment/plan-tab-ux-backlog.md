# Plan tab UX backlog (deferred)

> **Canonical checklist:** [`member-surfaces-implementation-plan.md`](./member-surfaces-implementation-plan.md) §6 Plan lenses · **§20 P2 UX**.

**Status:** Paused — §19 queue (#1 needs-you, #2 calendar, #3 suggested rail) **shipped** (2026-10-10). Do not use this file as a task list; use **§20** for what remains.

## Not built yet (P2 — optional polish)

- Goals projection polish beyond current `ProfileGoalsSection` on Plan
- **Upcoming carousel** on Schedule (lists + role tabs ship today)
- Extra attention-strip variants beyond **Needs you** (`PlanNeedsYouStrip`)
- Goal create flows scoped to Profile only (goals CRUD already on Plan `?lens=goals`)

## Shipped (reference only)

- `/plan` canonical tab; profile history + journey map off Plan
- Legacy `/trips` / `/activities` redirects
- Plan lenses: Schedule · Calendar · Available · Saved · Goals
- **Needs you** strip (`GET /me/coordination-attention`)
- **Suggested rail** + wishlist ↔ explore matches
- Explore pin kind **Activities**; seeking on map as `activity` + `activityMode: seeking`
