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
