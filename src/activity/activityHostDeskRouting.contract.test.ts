import { describe, expect, it } from 'vitest';
import { activityCrewPath, activityDetailPath } from '@uaetrail/shared-types';
import { parseActivityDetailTabParam, ACTIVITY_DETAIL_TAB_LABELS } from './activityDetailTab';

describe('activity host desk routing (R6 contract)', () => {
  it('routes map Manage to dedicated crew host desk path', () => {
    expect(activityCrewPath('evt-42')).toBe('/activity/evt-42/crew');
    expect(activityCrewPath('evt-42')).toBe(`${activityDetailPath('evt-42')}/crew`);
  });

  it('parses crew detail tab and rejects legacy buddies alias', () => {
    expect(parseActivityDetailTabParam('crew')).toBe('crew');
    expect(parseActivityDetailTabParam('buddies')).toBe('plan');
    expect(ACTIVITY_DETAIL_TAB_LABELS.crew).toMatch(/crew/i);
  });
});