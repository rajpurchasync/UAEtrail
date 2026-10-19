export const JOIN_INSTRUCTION_PREFIX = 'Instructions: ';

export const extractJoinInstructionLines = (requirements: string[] | null | undefined): string[] =>
  (requirements ?? [])
    .map((item) => item.trim())
    .filter((item) => item.startsWith(JOIN_INSTRUCTION_PREFIX))
    .map((item) => item.slice(JOIN_INSTRUCTION_PREFIX.length).trim())
    .filter(Boolean);

export const hasJoinInstructions = (requirements: string[] | null | undefined): boolean =>
  extractJoinInstructionLines(requirements).length > 0;

/** Requirements shown on activity detail — excludes mandatory join instructions. */
export const extractNonJoinRequirements = (requirements: string[] | null | undefined): string[] =>
  (requirements ?? [])
    .map((item) => item.trim())
    .filter((item) => item && !item.startsWith(JOIN_INSTRUCTION_PREFIX));
