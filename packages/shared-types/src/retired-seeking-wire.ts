/**
 * A-SEEK-03 — ops-only Mongo names for retired Find-crew storage (not product catalog).
 * Do not import outside `mongo-migrations`, `retired-seeking-storage-purge`, and ops scripts.
 */
export const BWL_RETIRED_SEEKING_COLLECTIONS = {
  PARTICIPANT_INTENTS: 'participant_intents',
  PARTICIPANT_INTENT_REQUESTS: 'participant_intent_requests',
} as const;