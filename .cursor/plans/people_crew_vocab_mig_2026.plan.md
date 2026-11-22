# People · crew vocabulary (MIG-PEOPLE-VOCAB-2026)

**Status:** **Closed** (2026-11-22)  
**Manifest:** `scripts/people-vocabulary-touchpoints.json` (v2)  
**Migration:** `MIG-PEOPLE-VOCAB-2026` → **complete** in `refactor-program.json`  
**Verify:** `npm run verify:people-graph-plan` · guards: `peopleVocabularyTouchpointsGuard`, `crewPillarsAlignmentGuard`

## Three surfaces (§1.5)

| Surface | Job | Canonical routes |
|---------|-----|------------------|
| **Intent compose** | Write `member_availability` | `?compose=intent:open` · `intent:fixed:*` |
| **Find crew** | Discover people / pros | `/list?listCat=people` · `/explore?list=1&listCat=people` |
| **My crew** | Friends, teams, chat home | `/crews`, `/groups` |

Find crew must **not** mount directory browse as the My crew hub body (`PVOC-00b`).

## Phase closure

| Phase | Status |
|-------|--------|
| P0 lexicon · P1 friends · P4 outing roster · P5-intent · P5c lenses · P5d three tabs · P6 wishlist · P8 docs | **Complete** |
| P2 teams (Teams copy + group model); Community API | **Complete** UI; **`MIG-COMMUNITY-DISCOVER`** remains **planned** |
| P3 guides directory (`crewsGuides`, `proKind`, profileRoleLabel) | **Complete** |
| P7 wire cleanup | **Complete** — `GET /me/friends` + `friendsApi` |

Detailed Find crew UX: `.cursor/plans/crews_three_tabs_recommended_2026.plan.md` (P5d — all §12 checks done).

## Compose + intent (cross-program)

Covered by **MIG-PLATFORM-COMPOSE-OPERATOR-2026** (see `compose_kind_wire_refactor_1cc2bc46.plan.md`):

- [x] `UPL_INTENT_*` on Plan + Find crew  
- [x] `intentFixedFlowEngine` + catalog `intent.fixed.*`  
- [x] PVOC-06 intent emit; PVOC-07 wishlist facade  

## Acceptance checklist

- [x] Six `crew-pillars` in shared-types + guards  
- [x] No `memberHireable` / hireable vocabulary in `src/`  
- [x] People browse: lanes + `peopleFacet` + `proKind`  
- [x] Hub / `CrewsHubHome` removed  
- [x] `npm run verify:people-graph-plan` green  

## Remaining product work (post-close)

| Item | Owner |
|------|--------|
| `MIG-COMMUNITY-DISCOVER` API + Community tab data | `refactor-program.json` |
| Full `buddiesApi` → `friendsApi` rename across all imports | optional eng debt |