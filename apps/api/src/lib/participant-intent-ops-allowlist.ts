/**
 * W1e — canonical ops allowlist for residual `participant_intents` references in `apps/api/src`.
 * Intentional until per-env purge; enforced by participant-intent-ops-surface-guard + `npm run shim:baseline`.
 */

/** W1b/W1e — legacy collection + wire lexicon residue pattern (not product HTTP). */
export const PARTICIPANT_INTENT_RESIDUE_PATTERN =
  /participant_intents|participant-intent|PARTICIPANT_INTENT/i;

/** Paths relative to `apps/api` (Vitest cwd). */
export const PARTICIPANT_INTENT_OPS_ALLOWLIST_API_REL = [
  'src/lib/mongo-migrations.ts',
  'src/lib/participant-intent-ops-allowlist.ts',
  'src/lib/retired-seeking-storage-purge.ts',
] as const;

export const PARTICIPANT_INTENT_OPS_ALLOWLIST = new Set<string>(
  PARTICIPANT_INTENT_OPS_ALLOWLIST_API_REL
);

export const participantIntentOpsAllowlistRepoRel = (): readonly string[] =>
  PARTICIPANT_INTENT_OPS_ALLOWLIST_API_REL.map((rel) => `apps/api/${rel}`);