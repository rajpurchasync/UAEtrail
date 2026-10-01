import { describe, expect, it } from 'vitest';
import {
  DEFAULT_RIDESHARE_RIDER_RULES,
  defaultRideshareRiderRulesText,
  formatRideshareRiderRules,
  parseRideshareRiderRules,
} from './rideshareRiderRules';

describe('rideshareRiderRules', () => {
  it('formats and parses rule lines', () => {
    const text = defaultRideshareRiderRulesText();
    expect(parseRideshareRiderRules(text)).toEqual([...DEFAULT_RIDESHARE_RIDER_RULES]);
    expect(formatRideshareRiderRules(['No pets', 'No smoking'])).toBe('No pets\nNo smoking');
  });
});
