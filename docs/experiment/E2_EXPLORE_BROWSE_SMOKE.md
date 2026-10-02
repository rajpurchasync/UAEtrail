# E2 — Explore browse smoke (Places vs Activities)

Run on **`main`** with API + seed (`npm run dev:all` or `dev:local`).

**Automated:** `npm run test:explore-alignment` (bundles API + browse/FAB tests). Reseed before manual pass if Others/topic pins are missing.

## Preconditions

- Explore map loads (`/explore`)
- Seed or catalog import has at least one **hiking venue** and one **published hiking activity**

## Activities tab (Buddy layer)

1. Open `/explore` — default **Activities** (mobile) or Activities desktop tab.
2. Map shows **circle + emoji** pins for outings (boot for hiking, etc.), not venue chips.
3. Apply **Hiking** filter — only `source: activity` (and demand if seeded) hiking items; **no** catalog trail chips.
4. Apply **date** preset (e.g. This week) — list and map stay aligned; past outings drop off when filtered.
5. Tap an activity pin — peek/card opens outing detail path (`/activity/...`).

## Others drill-down (Activities layer)

1. Filter **Others** (`?filter=others`) — events + general activities (not hiking/camping/rideshare).
2. Sub-pills **Events** vs **Activities** (`subtype=events` | `subtype=activities`); map and list stay aligned after refresh.
3. With **Activities** selected, topic pills (**Climb**, **Run**, **Workshop**, **Social**) set `outingTopic=`; only matching `outingCategory: activities` + `outingTopic` pins remain.
4. Switching away from Others clears `subtype` / `outingTopic` from the URL.

## Places tab (catalog layer)

1. Switch to **Places** (`?panel=venues` on mobile or Venues desktop tab).
2. Map shows **square venue chips** (mountain/tent SVG) for trails and camps; shops use shop styling when filtered.
3. **Hiking** filter — only `source: venue` + `kind: hiking`; **no** scheduled activity circles.
4. **All** places filter — hiking + camping venues + physical shops; still **no** activities or demand.
5. Region pills (if enabled) — map and list count match.
6. Tap a venue — place detail (`/trail/...`, `/camp/...`).

## Shops

1. Places → **Shops** filter or Shops panel.
2. Physical shops may have pins; online-only shops appear in list without coordinates.

## Pass criteria

- Activities and Places never mix pin types for the same layer in list + map.
- URL state (`panel`, `filter`, `date`, `list`, `q`) matches visible data after refresh.
- Admin place save or catalog import updates map within ~1 minute (cache TTL) without API restart.

Mark E2 closed in [`explore-alignment-phases.md`](./explore-alignment-phases.md) when this pass is green in QA.
