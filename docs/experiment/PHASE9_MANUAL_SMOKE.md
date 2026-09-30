# Phase 9 — manual smoke (signup profile → explore location)

Run on **`experiment-ui`** with local API + seed (`npm run dev:local` or `dev:all`).

## Preconditions

- Seed includes **`visitor2@`** (or any account) with **incomplete** member details (`isSignupProfileComplete` false).
- Browser signed out before starting.

## Steps

1. Sign in as incomplete member (e.g. `visitor2@` / seed password).
2. Confirm redirect to **`/welcome`** (signup profile wizard), not `/explore`.
3. Complete all wizard steps (DOB, gender, emirate, languages) and finish.
4. Confirm landing on **`/explore`** with **location prompt** (allow/dismiss) when preference allows — contract: `EXPLORE_WELCOME_FINISH_STATE` + `shouldOpenExploreLocationPromptFromWelcome()` (see `exploreWelcomeNavigation.test.ts`).
5. Open **Profile → Settings** (member details) and edit one field (e.g. languages); save.
6. Confirm no forced return to `/welcome` after save (signup gate query invalidated).

## Pass criteria

- Gated roles cannot browse product until profile complete.
- Post-welcome explore shows optional map location prompt once.
- Settings edit does not re-lock the app on `/welcome`.

Mark complete in `docs/ENGINEERING_PLAN.md` Phase 9 when this checklist passes in QA.

## Automated coverage (CI)

Run `npm run test:frontend`. These tests guard the contracts below; they do **not** replace the browser pass above.

| Manual step | Contract | Test file |
|-------------|----------|-----------|
| 2 — gate to `/welcome` | `needsSignupProfileGate`, `shouldForceSignupWelcome`, exempt paths | `signupProfileGate.test.ts` |
| 3 — wizard completeness | `isSignupProfileComplete`, step order | `signupProfileSteps.test.ts` |
| 4 — explore location prompt | `EXPLORE_WELCOME_FINISH_STATE`, prefs | `exploreWelcomeNavigation.test.ts`, `exploreMapLocationPreference.test.ts` |
| 6 — settings save stays unlocked | Complete profile does not re-force welcome | `signupProfileGate.test.ts` |
| Explore compose (regression) | Organize sign-in / become-host gates | `exploreComposeRouteGuard.test.ts` |

Gate query invalidation after profile save is implemented in `ProfileMemberDetailsCard`, `SignupProfileWizard`, and `Profile.tsx` via `meProfileSignupGateKey` — verify step 6 manually.

## Related: E2 explore browse

Places vs Activities separation: [`E2_EXPLORE_BROWSE_SMOKE.md`](./E2_EXPLORE_BROWSE_SMOKE.md) (API: `explore-map-layers` tests).
