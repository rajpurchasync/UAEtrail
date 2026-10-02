# Experiment-era documentation (architecture & flows)

Specs and phased plans from the explore redesign (formerly branch `experiment-ui`), now on **`main`** (Oct 2026). Day-to-day product truth: **`../DOCS_INDEX.md`** Tier 1 — especially **`../CREATE_FLOW.md`**, **`../MEMBER_MODEL.md`**, **`../NAVIGATION.md`**, **`../ARCHITECTURE.md`**. When experiment docs disagree with Tier 1, **update the experiment doc**.

## Legacy pointers

| Pointer | What |
|---------|------|
| **`origin/main`** | Live product |
| **`rajpurchasync/UAEtrail` @ `main`** | Frozen pre-ship snapshot (see `git-remotes.mdc`) |
| **Tags on `origin`** | `legacy/experiment-new-ui`, `legacy/ui-experiment`, `legacy/performance-cross-platform-bugfix` — archived branch tips (Oct 2026) |

Do not recreate `experiment-ui`, `experiment/new-ui`, or `ui-experiment` branches unless you intentionally restore old work from a tag.

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
