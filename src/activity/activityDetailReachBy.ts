import { extractNonJoinRequirements } from '../utils/joinInstructions';

const TRANSPORT_REQUIREMENT_PATTERN = /^(Reachable by|Vehicle:)/i;

/** Organize publish lines shown on Transport (not Plan activity-details list). */
export const extractActivityTransportReachLines = (requirements?: string[] | null): string[] =>
  extractNonJoinRequirements(requirements ?? []).filter((line) => TRANSPORT_REQUIREMENT_PATTERN.test(line.trim()));

export const extractActivityPlanDetailLines = (requirements?: string[] | null): string[] =>
  extractNonJoinRequirements(requirements ?? []).filter((line) => !TRANSPORT_REQUIREMENT_PATTERN.test(line.trim()));
