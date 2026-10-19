import { extractNonJoinRequirements } from './join-instructions.js';

const TRANSPORT_REQUIREMENT_LINE = /^(Reachable by|Vehicle:)/i;

/** Host transport capture lines safe to show before crew join (vehicle / reach-by). */
export const extractActivityTransportRequirementLines = (
  requirements: string[] | null | undefined
): string[] =>
  extractNonJoinRequirements(requirements ?? []).filter((line) =>
    TRANSPORT_REQUIREMENT_LINE.test(line.trim())
  );
