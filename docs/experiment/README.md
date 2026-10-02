# Experiment-era documentation (architecture & flows)

Specs and phased plans from the **experiment-ui** line, which **shipped to `origin/main`** (Oct 2026). Day-to-day product truth is also in **`../CREATE_FLOW.md`**, **`../NAVIGATION.md`**, **`../ARCHITECTURE.md`**.

## Legacy experiment: `experiment/new-ui`

Some docs still mention **`purchasync/UAEtrail`** — that mirror is **legacy-only** (see `git-remotes.mdc`), not auto-synced.

## Documents

| Doc | Purpose |
|-----|---------|
| [explore-map-implementation-plan.md](./explore-map-implementation-plan.md) | Full phased implementation plan (UX, API, data model, tasks) |
| [explore-ux-spec.md](./explore-ux-spec.md) | Locked copy, emojis, CTAs, and alignment checklist |
| [flows/README.md](./flows/README.md) | **FAB → publish** flow confirmations (one at a time) |
| [explore-backend-alignment.md](./explore-backend-alignment.md) | **API / DB / DTO gate** before browse + FAB unification |
| [explore-flow-registry.md](./explore-flow-registry.md) | Flow IDs → wizards, validation families, endpoints |
| [../CREATE_FLOW.md](../CREATE_FLOW.md) | **Canonical** FAB, organize/find/add, Event vs Activity, participation (main docs) |
| [../COMMUNICATION.md](../COMMUNICATION.md) | **Canonical** DMs, group/crew wall, Trips↔Messages, API & deep links |
| [../TRIPS_HOST_MANAGE.md](../TRIPS_HOST_MANAGE.md) | Trips hosted/demand manage, invite vs crew chat |
| [consumer-mobile-ia.md](./consumer-mobile-ia.md) | Profile / Trips / Messages tabs & launcher |

## Branch & remotes

- **`origin/main`:** canonical product — normal development (`git push origin main`)
- **`purchasync` / `rajpurchasync/UAEtrail`:** frozen legacy snapshot; push only when explicitly requested

## Status tracking

When starting or finishing a phase, update the **Phase status** section at the bottom of `explore-map-implementation-plan.md`.
