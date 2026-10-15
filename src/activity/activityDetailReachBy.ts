import { extractNonJoinRequirements } from '../utils/joinInstructions';

const TRANSPORT_REQUIREMENT_PATTERN = /^(Reachable by|Vehicle:)/i;

/** Organize publish lines shown on Transport (not Plan activity-details list). */
export const extractActivityTransportReachLines = (requirements?: string[] | null): string[] =>
  extractNonJoinRequirements(requirements ?? []).filter((line) => TRANSPORT_REQUIREMENT_PATTERN.test(line.trim()));

export const extractActivityPlanDetailLines = (requirements?: string[] | null): string[] =>
  extractNonJoinRequirements(requirements ?? []).filter((line) => !TRANSPORT_REQUIREMENT_PATTERN.test(line.trim()));

/** Organize capture → consumer transport strip (sedan → car, 4x4 preserved). */
export const formatActivityAccessibleBySummary = (requirements?: string[] | null): string | null => {
  const lines = extractActivityTransportReachLines(requirements);
  const labels: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (/4x4/i.test(trimmed)) {
      labels.push('4x4');
      continue;
    }
    if (/sedan/i.test(trimmed)) {
      labels.push('car');
      continue;
    }
    const vehicle = trimmed.match(/^Vehicle:\s*(.+)$/i)?.[1]?.trim();
    if (vehicle) {
      labels.push(vehicle);
      continue;
    }
    const reachable = trimmed.match(/^Reachable by\s+(.+)$/i)?.[1]?.replace(/\s*only$/i, '').trim();
    if (reachable) {
      labels.push(reachable.toLowerCase() === 'sedan' ? 'car' : reachable);
    }
  }
  const unique = [...new Set(labels.filter(Boolean))];
  return unique.length > 0 ? unique.join(', ') : null;
};
