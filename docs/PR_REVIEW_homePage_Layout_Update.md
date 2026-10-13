# PR review: `homePage_Layout_Update`

Paste into the GitHub pull request description (screenshots to be added separately in the PR thread).

## Summary

- Ship guest homepage v2: hero carousel with proof chips then CTAs, upcoming outings with emirate flag filters, how it works, reviews + FAQ.
- Marketing copy centralized in `src/content/homeMarketing.ts`; plan updated in `docs/UAE_Trail_Homepage.md`, `docs/LANDING.md`, `docs/content.md`.
- Final CTA dark band not rendered on `/` (hero + site footer founders card in site footer).
- Merged latest `main`; CI lint + buddy-notification contract test fixes included.
- Guest `/` performance: lazy route sections, `ProductShell` split, compressed hero assets under `public/landing/hero/`, self-hosted fonts, explore/map chunks not on initial `/` load.
- PWA: service worker disabled in Vite dev; hero carousel soft crossfade; desktop proof-chip typography tuned.

## Test plan

- [ ] Guest `/` only — signed-in users redirect to `/explore`
- [ ] Hero: carousel controls, proof row, Explore the map / Join free, activity chip
- [ ] Upcoming outings: emirate chips, cards (API or curated fallback)
- [ ] FAQ answers render (no placeholders)
- [ ] Responsive: ~360, 768, 1440
