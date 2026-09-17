# Navigation contract

Companion to [`DOMAIN.md`](./DOMAIN.md). Defines **where users go** for each intent. Routes stay stable; new links must follow this contract.

## Three surfaces

| Surface | Route | Purpose |
|---------|-------|---------|
| **Browse** | `/explore` | Map-first discovery — activities, places, shops |
| **Personal hub** | `/profile`, `/activities?tab=joined\|hosted` | Account, my activities, messages |
| **Entity detail** | `/trail`, `/camp`, `/event`, `/activity`, `/shop`, `/operator` | Single place, trip, or host |

Legacy browse URLs (`/map`, `/discovery`, `/calendar`, `/shop`, bare `/activities`) redirect into `/explore` via `App.tsx` only — do not link to them from new UI.

## Source of truth (code)

| Intent | Helper | File |
|--------|--------|------|
| Explore URLs | `explorePath()`, `exploreActivitiesPath()`, `explorePlacesPath()`, `exploreShopsPath()` | `src/utils/exploreRouting.ts` |
| Back from detail | `detailBackPath(kind)` | `src/utils/exploreRouting.ts` |
| My activities hub | `myActivitiesPath('joined' \| 'hosted')` | `src/utils/exploreRouting.ts` |
| Fulfill participant intent (return from auth) | `explorePath({ fulfillIntent })`, `exploreFulfillIntentReturnPath()` | `src/utils/exploreRouting.ts` |
| Platform nav constants | `EXPLORE_MAP_PATH`, `joinAuthPath()` | `src/config/platform.ts` |
| Sign-in with return | `buildSignInRedirect(location)`, `signInPathForReturn(path)` | `src/utils/authReturnContext.ts` |
| Post-auth fallback | `resolveAuthExitFallback()` → explore | `src/utils/authRedirect.ts` |

## Browse defaults

- Landing on `/explore` without `list=1` → **map view** (list panel closed).
- Pass `list: true` to `explorePath()` only when opening the browse sheet intentionally.
- Filter/panel query params select map context; they do not imply list mode.

## Back navigation

| Entity | `detailBackPath()` kind | Destination |
|--------|-------------------------|-------------|
| Activity | `'activity'` | `/explore` (activities) |
| Trail | `'trail'` | `/explore?panel=venues&filter=hiking` |
| Camp | `'camp'` | `/explore?panel=venues&filter=camping` |
| Event venue | `'event'` | `/explore?panel=venues&filter=others` |
| Shop | `'shop'` | `/explore?panel=shops&filter=shops` |
| Host profile | `'host'` | `/explore` |
| Generic / 404 | `'explore'` | `/explore` |

## Auth redirects

- Gated actions → always `buildSignInRedirect()` or `signInPathForReturn(returnPath)`.
- Never bare `/signin` when the user should return to the current page or action.
- Participants without a redirect → `EXPLORE_MAP_PATH` after sign-in.

## Copy

User-facing label for map browse: **Explore** (nav, drawer, CTAs). Internal URL panel name `venues` stays in query strings only.

## Adding new links

1. Pick the surface (browse / personal / detail).
2. Use the helper from `exploreRouting.ts` — no raw `/explore?…` strings outside that module and `platform.ts`.
3. Detail pages pass `backTo={detailBackPath('…')}` unless a tighter parent context exists.
