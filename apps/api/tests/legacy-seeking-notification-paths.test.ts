import { describe, expect, it } from 'vitest';
import {
  activityDetailPath,
  explorePublishedActivityPinPath,
} from '../src/lib/member-routes.js';

describe('legacy seeking notification paths (MIG-DISCO-REG)', () => {
  it('explorePublishedActivityPinPath opens archived activity detail when activityId is set', () => {
    expect(
      explorePublishedActivityPinPath({
        intentId: 'legacy-intent',
        activityId: 'act-archive-1',
      })
    ).toBe(activityDetailPath('act-archive-1'));
  });

  it('explorePublishedActivityPinPath falls back to explore list when no activityId', () => {
    expect(
      explorePublishedActivityPinPath({
        intentId: 'legacy-intent',
        activityId: null,
      })
    ).toBe('/explore?list=1');
  });
});