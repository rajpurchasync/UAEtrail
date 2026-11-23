# Cursor agent plans (retired)

**Do not add new plan bodies here.** Sole schedules: [`docs/SYSTEM_COHERENCE.md`](../../docs/SYSTEM_COHERENCE.md) §8 + [`scripts/platform-program.json`](../../scripts/platform-program.json) + program `*-touchpoints.json` under `scripts/`.

| Stub | Migration | Machine schedule |
|------|-----------|------------------|
| `compose_kind_wire_refactor_1cc2bc46.plan.md` | MIG-PLATFORM-COMPOSE-OPERATOR-2026 | `verify:compose-spine` |
| `people_crew_vocab_mig_2026.plan.md` | MIG-PEOPLE-VOCAB-2026 | `scripts/people-vocabulary-touchpoints.json` |
| `crews_three_tabs_recommended_2026.plan.md` | P5d (people vocab) | REC: `discover-recommendations-touchpoints.json` |

Gates: `npm run verify:system:quick` (PR) · `npm run verify:system` (main CI + pre-release).