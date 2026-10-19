/** Default rider rules — hosts can remove or add more in the rideshare hosting flow. */
export const DEFAULT_RIDESHARE_RIDER_RULES = ['No smoking', 'No eating in the car'] as const;

export const formatRideshareRiderRules = (lines: string[]): string =>
  lines.map((line) => line.trim()).filter(Boolean).join('\n');

export const parseRideshareRiderRules = (text: string): string[] =>
  text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

export const defaultRideshareRiderRulesText = (): string =>
  formatRideshareRiderRules([...DEFAULT_RIDESHARE_RIDER_RULES]);

export const ensureRideshareRiderRulesText = (text: string): string => {
  const trimmed = text.trim();
  return trimmed ? trimmed : defaultRideshareRiderRulesText();
};
