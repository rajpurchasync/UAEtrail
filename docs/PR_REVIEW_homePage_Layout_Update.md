# PR review: `homePage_Layout_Update`

Use this in the GitHub pull request description after opening  
https://github.com/uaetrail/main/compare/main...homePage_Layout_Update

## Summary

- Guest homepage v2: hero carousel, proof chips → CTAs, upcoming outings (emirate flags), how it works, reviews + FAQ.
- Copy in `src/content/homeMarketing.ts`; plan in `docs/UAE_Trail_Homepage.md`.
- No Final CTA band on `/` (footer + hero CTAs only).

## Screenshots (Oct 2026, local dev)

### Desktop (1440px)

**Hero**

![Desktop hero](./homepage-screenshots/home-desktop-1440-hero.png)

**Full page**

![Desktop full page](./homepage-screenshots/home-desktop-1440-full.png)

### Mobile (390px)

**Hero**

![Mobile hero](./homepage-screenshots/home-mobile-390-hero.png)

**Full page**

![Mobile full page](./homepage-screenshots/home-mobile-390-full.png)

> Local captures may show the yellow **Backend unavailable** banner when the API is not running; staging/production with a healthy API will not.

## Test plan

- [ ] Guest `/` — signed-out only; signed-in redirects to `/explore`
- [ ] Hero carousel: pause, dots, activity chip link
- [ ] Emirate filter + activity cards (live API or fallback)
- [ ] FAQ accordion answers (no TBD)
- [ ] 360 / 768 / 1440 responsive pass
