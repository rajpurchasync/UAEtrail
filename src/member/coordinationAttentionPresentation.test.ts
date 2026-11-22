import { describe, expect, it } from 'vitest';
import type { MemberCoordinationAttentionItemDTO } from '@uaetrail/shared-types';
import { planHostedSchedulePath } from '../plan/planRouting';
import {
  coordinationAttentionLabel,
  coordinationAttentionPath,
} from './coordinationAttentionPresentation';

describe('coordinationAttentionPresentation', () => {
  it('maps host queue to operator schedule hub', () => {
    const item: MemberCoordinationAttentionItemDTO = { kind: 'host_join_queue', count: 2 };
    const path = coordinationAttentionPath(item);
    expect(path).toBe(planHostedSchedulePath());
    expect(coordinationAttentionLabel(item)).toContain('2 people');
  });

  it('maps single activity invite to activity deep link', () => {
    const item: MemberCoordinationAttentionItemDTO = {
      kind: 'activity_join_invite',
      count: 1,
      activityId: 'act-1',
      inviterDisplayName: 'Sara',
    };
    expect(coordinationAttentionPath(item)).toContain('act-1');
    expect(coordinationAttentionLabel(item)).toContain('Sara');
  });
});
