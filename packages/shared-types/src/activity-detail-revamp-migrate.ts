import { extractJoinInstructionLines } from './join-instructions.js';
import type {
  ActivityAudienceFitnessDTO,
  ActivityGearItemDTO,
  ActivityItineraryStepDTO,
  ActivityItineraryStepKind,
  ActivityPolicyKeyDTO,
  ActivityPriceBreakdownDTO,
} from './activity-detail-revamp.js';
import { extractNonJoinRequirements } from './join-instructions.js';
import { isPackingRequirementLine } from './activity-packing-list.js';

const slugKey = (label: string, index: number): string => {
  const base = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);
  return `${base || 'item'}-${index}`;
};

const TRANSPORT_REQUIREMENT_PATTERN = /^(Reachable by|Vehicle:)/i;

/** Lines hosts use for "activity details" on Plan (non-transport, non-packing, non-instructions). */
export const extractActivityPlanDetailLinesForMigration = (requirements: string[] | null | undefined): string[] =>
  extractNonJoinRequirements(requirements ?? []).filter(
    (line) =>
      !TRANSPORT_REQUIREMENT_PATTERN.test(line.trim()) && !isPackingRequirementLine(line)
  );

const inferStepKind = (line: string, index: number, total: number): ActivityItineraryStepKind => {
  const t = line.toLowerCase();
  if (/meet|gather|assembly|brief/i.test(t)) return 'meet';
  if (/return|wrap|finish|end|depart home/i.test(t)) return 'end';
  if (/summit|peak|top\b/i.test(t)) return 'summit';
  if (/break|coffee|snack|lunch|rest/i.test(t)) return 'break';
  if (/camp|overnight|tent/i.test(t)) return 'camp';
  if (index === 0) return 'meet';
  if (index === total - 1) return 'end';
  return 'start';
};

export const migrateLegacyItineraryStringsToSteps = (
  lines: string[] | null | undefined
): ActivityItineraryStepDTO[] => {
  const cleaned = (lines ?? []).map((s) => s.trim()).filter(Boolean);
  if (cleaned.length === 0) return [];
  return cleaned.map((title, i) => ({
    key: `legacy-${i}-${slugKey(title, i)}`,
    step: inferStepKind(title, i, cleaned.length),
    title,
    note: null,
    at: null,
    offsetMin: null,
  }));
};

export const migrateInstructionAndPlanLinesToGear = (
  requirements: string[] | null | undefined
): ActivityGearItemDTO[] => {
  const instructionLines = extractJoinInstructionLines(requirements);
  const planLines = extractActivityPlanDetailLinesForMigration(requirements);
  const items: ActivityGearItemDTO[] = [];

  instructionLines.forEach((label, i) => {
    items.push({
      key: slugKey(label, i),
      label,
      level: 'mandatory',
      spec: null,
    });
  });

  const startIdx = items.length;
  planLines.forEach((label, i) => {
    items.push({
      key: slugKey(label, startIdx + i),
      label,
      level: 'recommended',
      spec: null,
    });
  });

  const seen = new Set<string>();
  return items.filter((row) => {
    const k = row.label.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
};

/** Drops v2 migration placeholder rows (instructions + plan metadata stored on `gear`). */
export const filterMigratedPlaceholderGear = (
  gear: ActivityGearItemDTO[] | null | undefined,
  requirements: string[] | null | undefined
): ActivityGearItemDTO[] => {
  if (!gear?.length) return [];
  const placeholderLabels = new Set(
    migrateInstructionAndPlanLinesToGear(requirements).map((row) => row.label.toLowerCase())
  );
  if (placeholderLabels.size === 0) return [...gear];
  return gear.filter((row) => !placeholderLabels.has(row.label.toLowerCase()));
};

export const mapLegacyPricingToBreakdown = (input: {
  priceAed: number;
  pricingMode: 'free' | 'shared' | 'paid' | null | undefined;
}): ActivityPriceBreakdownDTO => {
  const mode =
    input.pricingMode === 'paid' ? 'paid' : input.pricingMode === 'shared' ? 'shared_cost' : 'free';
  const amount = mode === 'free' ? 0 : input.priceAed;
  return {
    mode,
    amount,
    currency: 'AED',
    unit: 'person',
    collectedBy: 'host',
    paymentMethod: 'arranged_with_host',
    includes: [],
    excludes: [],
    deposit: null,
    deadline: null,
  };
};

export const inferFitnessFromPlaceDifficulty = (
  difficulty: string | null | undefined
): ActivityAudienceFitnessDTO => {
  const d = (difficulty ?? '').toLowerCase();
  if (d === 'hard') return 'challenging';
  if (d === 'moderate') return 'moderate';
  if (d === 'easy') return 'easy';
  return 'unknown';
};

export const defaultPolicyKeyForMode = (pricingMode: ActivityPriceBreakdownDTO['mode']): ActivityPolicyKeyDTO =>
  pricingMode === 'paid' ? 'moderate' : 'flexible';
