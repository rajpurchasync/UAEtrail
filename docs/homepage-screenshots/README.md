# Homepage v2 — PR review screenshots

Captured from local dev (`http://localhost:5175/`, guest `/`) on branch `homePage_Layout_Update` (Oct 2026).

| File | Viewport | Notes |
|------|----------|--------|
| `home-desktop-1440-hero.png` | 1440×900, above-the-fold | Hero: proof chips → CTAs |
| `home-desktop-1440-full.png` | 1440px wide, full scroll | All sections + footer |
| `home-mobile-390-hero.png` | 390×844 @2x, above-the-fold | Mobile hero |
| `home-mobile-390-full.png` | 390px wide, full scroll | All sections + footer |

**Note:** If the API is down locally, the yellow **Backend unavailable** banner may appear — production/staging with a healthy API will not show it.

Use these paths in the PR description (after push):

```markdown
![Desktop hero](./docs/homepage-screenshots/home-desktop-1440-hero.png)
![Mobile hero](./docs/homepage-screenshots/home-mobile-390-hero.png)
```

Full-page: `home-desktop-1440-full.png`, `home-mobile-390-full.png`.
