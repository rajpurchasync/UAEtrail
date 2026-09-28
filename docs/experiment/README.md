# Experiment branch documentation

This folder describes **experiment branches** — not canonical `uaetrail/main` product docs unless explicitly merged later.

## Active experiment: `experiment-ui`

Mobile hub, API route split, frontend domain aliases, stale-file removal. **Standalone — do not merge to `main` without explicit decision.** Push: `origin experiment-ui`.

## Legacy experiment: `experiment/new-ui`

Source of truth for explore UX specs on **`purchasync/UAEtrail`** (`git push purchasync experiment/new-ui`).

Do **not** treat these docs as canonical for `uaetrail/main` until an explicit merge decision.

## Documents

| Doc | Purpose |
|-----|---------|
| [explore-map-implementation-plan.md](./explore-map-implementation-plan.md) | Full phased implementation plan (UX, API, data model, tasks) |
| [explore-ux-spec.md](./explore-ux-spec.md) | Locked copy, emojis, CTAs, and alignment checklist |
| [flows/README.md](./flows/README.md) | **FAB → publish** flow confirmations (one at a time) |
| [explore-backend-alignment.md](./explore-backend-alignment.md) | **API / DB / DTO gate** before browse + FAB unification |
| [explore-flow-registry.md](./explore-flow-registry.md) | Flow IDs → wizards, validation families, endpoints |
| [../CREATE_FLOW.md](../CREATE_FLOW.md) | **Canonical** FAB, organize/find/add, Event vs Activity, participation (main docs) |

## Branch & remotes

- **experiment-ui (current):** push `origin experiment-ui` — no merge to `main`
- **experiment/new-ui:** `git push purchasync experiment/new-ui`
- **`origin/main`:** canonical product line for uaetrail — **not** the default target for experiment-ui work

## Status tracking

When starting or finishing a phase, update the **Phase status** section at the bottom of `explore-map-implementation-plan.md`.
