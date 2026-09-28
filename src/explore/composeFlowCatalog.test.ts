import { describe, expect, it } from 'vitest';
import { getCreateFlowSteps } from './ui/organizeFlow';
import { composeFlowIdFromRoute, composeFlowSpec } from './composeFlowCatalog';

describe('composeFlowCatalog', () => {
  it('maps compose=organize:hiking to organize.hiking', () => {
    expect(composeFlowIdFromRoute({ intent: 'organize', kind: 'hiking' })).toBe('organize.hiking');
  });

  it('organize.hiking lists eleven organize steps ending in publish', () => {
    const spec = composeFlowSpec('organize.hiking');
    expect(spec.intent).toBe('organize');
    expect(spec.organizeSteps).toEqual(getCreateFlowSteps('hiking', false));
    expect(spec.organizeSteps).toHaveLength(11);
    expect(spec.organizeSteps).toEqual([
      'title',
      'when',
      'meeting',
      'audience',
      'spots',
      'price',
      'destination',
      'about_trail',
      'meeting_point',
      'join_kit',
      'publish',
    ]);
    expect(spec.organizeSteps?.[spec.organizeSteps.length - 1]).toBe('publish');
    expect(spec.confirmationDoc).toBe('docs/experiment/flows/FLOW-01-organize-hiking.md');
  });

  it('organize.camping uses structured host steps (aligned with FLOW-01)', () => {
    const spec = composeFlowSpec('organize.camping');
    expect(spec.organizeSteps).toEqual(getCreateFlowSteps('camping', false));
    expect(spec.organizeSteps).toHaveLength(12);
    expect(spec.organizeSteps).toContain('spots');
    expect(spec.organizeSteps).toContain('transportation');
    expect(spec.organizeSteps).not.toContain('instructions');
    expect(spec.confirmationDoc).toBe('docs/experiment/flows/FLOW-02-organize-camping.md');
  });
});
