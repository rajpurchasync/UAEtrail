# Experiment folder (stubs only)

**Do not implement from files here.** The **sole implementation schedule** is [`SYSTEM_COHERENCE.md`](../SYSTEM_COHERENCE.md) **§8.8 (PCOH)** + [`scripts/refactor-program.json`](../../scripts/refactor-program.json) migrations **`MIG-COH-*`**.

| Need | Read |
|------|------|
| UPL (member-visible terms) | `src/content/upl-glossary.ts`, `workspaceVocabulary.ts`, `productNorthStar.ts` |
| BWL (HTTP, JSON, Mongo) | `packages/shared-types/src/wire-lexicon.ts` |
| Routes, surfaces | `NAVIGATION.md`, `DOMAIN_CANONICALS.md` |
| HTTP paths | `API_ROUTING.md` |
| FAB, join, compose | `CREATE_FLOW.md` |
| Pro membership, publish | `MEMBER_MODEL.md`, `/profile/pro-membership` |
| Bounded contexts | `SYSTEM_COHERENCE.md` §3 + `scripts/bounded-context-manifest.json` |
| Gates | `npm run verify:system` |

Each `*.md` in this folder is a **≤8-line stub**. Historical narratives were **removed** (Oct 2026) so they cannot compete with §8.8.
