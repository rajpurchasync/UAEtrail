# `scripts/` layout (GW-5)

Repo automation lives here — not under `apps/api/scripts/` (API-only seeds/migrations).

| Directory | Purpose | Entry points |
|-----------|---------|--------------|
| **`governance/`** | Manifests, touchpoints, baselines (JSON) | `bounded-context-manifest.json` · `platform-governance.json` |
| **`verify/`** | `npm run verify:*` runners | `verify-system-coherence.mjs` → `npm run verify:system` |
| **`lib/`** | Shared helpers for verify/ops | `strip-npm-devdir-env.mjs` |
| **`ops/`** | Staging/release checklists (human + CI) | `release-staging-ops.mjs` · `p5-slo-smoke.mjs` |
| **`dev/`** | Local dev, census, perf, DB helpers | `run-project.mjs` · `context-map.mjs` |
| **`archive/`** | Retired one-off renames (do not run) | `internal/*` |

**Do not** add new `.mjs` / governance `.json` at `scripts/` root — put files in the subdirectory above.

**System gate:** `npm run verify:system` (full) or `npm run verify:system:quick` (CI default).