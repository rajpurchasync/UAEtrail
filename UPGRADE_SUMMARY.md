# npm dependency upgrade summary (Oct 2026)

## Iteration 2 — latest transitive pins + Tailwind 4

- **Overrides bumped:** `glob` → `^13.0.6`, `rimraf` → `^6.1.3`, `uuid` → `^14.0.3` (tree-wide via npm overrides).
- **Tailwind CSS 4.3.3** with `@tailwindcss/vite` in [vite.config.ts](vite.config.ts); [src/index.css](src/index.css) uses `@import 'tailwindcss'` + `@config`; flattened `@apply` chains that referenced custom component classes (v4 only allows utilities in `@apply`).
- **PostCSS:** [postcss.config.js](postcss.config.js) no longer loads Tailwind (Vite plugin handles it); removed unused `autoprefixer` devDependency.
- **API:** removed deprecated `@types/bcryptjs` (types ship with `bcryptjs@3`).
- **Cannot force without upstream:** `exceljs@4.4.0` still pulls `archiver@5`; `swagger-jsdoc@6.3.0` still pulls `@apidevtools/swagger-parser@12` — no newer parent releases on npm. Babel 7.x remains via `eslint-plugin-react-hooks` until that plugin adopts Babel 8.

## Phase 1 — minor/patch

- Ran `npm update` at the repo root (workspaces share one lockfile).
- Updated `allowScripts` in root `package.json` for `mongodb-memory-server@11.3.0` and `sharp@0.35.5`.
- No other direct `package.json` semver bumps were required (`npm-check-updates --deep` only flagged TypeScript).

## Phase 2 — TypeScript 7 (major)

**Dependency layout (root + `apps/api`):**

- `@typescript/native`: `npm:typescript@^7.0.2` — CLI `tsc` (7.x).
- `typescript`: `npm:@typescript/typescript6@^6.0.2` — JS compiler API for `typescript-eslint` / lint.

**Config:**

- Removed deprecated `baseUrl` from `tsconfig.app.json`; `paths` use `./src/*` prefixes.
- Excluded `src/testing/**` from app typecheck (Node-only test helpers).

**Type fixes for TS 7 / stricter checking:**

| Area | Files |
|------|--------|
| React 19 types | `ProtectedRoute.tsx`, `ComposeRail.tsx`, `PeopleBrowseSearchField.tsx` |
| lucide-react (removed `Facebook` icon) | `ShareButton.tsx` |
| Zod 4 (`issues` vs `errors`, schema shape) | `env.ts`, `registerHostActivityRoutes.ts` |
| Express / query typing | `registerPublicPlaceRoutes.ts`, `validate.ts` |

## Runtime / tooling fixes (lockfile-driven)

| Issue | Fix |
|-------|-----|
| Express 5 `path-to-regexp` | `apps/api/src/routes/media.ts` — `PUT /upload-local/*` → regex route |
| Express 5 read-only `req.query` | `validate.ts` — `setRequestField` + `defineProperty`; default `req.body ?? {}` |
| ESLint 10 + react-hooks 7 | `eslint.config.js` — classic hooks rules only |
| ESLint `preserve-caught-error` | `mongo.ts`, `redis.ts` — `cause` on rethrown errors |
| Tailwind | Kept **v3** (`^3.4.17`); v4 in tree was incomplete for this CSS surface |

## Verification

- `npm run ci` passes (typecheck, API typecheck, `verify:system:quick`, lint, builds, frontend + API tests).

## Notes

- Use the VS Code TypeScript 7 extension if editor diagnostics should match CLI `tsc`.
- When `typescript-eslint` supports the TS 7.1+ programmatic API, the side-by-side aliases can be collapsed to a single `typescript@7` devDependency.
