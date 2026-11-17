import type { ActivityDTO } from '@uaetrail/shared-types';
import { describe, expect, it } from 'vitest';
import {
  HOST_ACTIVITY_MANAGE_CONFIRM_NONE,
  hostActivityManageConfirmActivity,
} from './hostActivityManageConfirm';

const activity = { id: 'a1' } as ActivityDTO;

describe('hostActivityManageConfirm', () => {
  it('allows at most one dialog target', () => {
    expect(hostActivityManageConfirmActivity(HOST_ACTIVITY_MANAGE_CONFIRM_NONE)).toBeNull();
    expect(hostActivityManageConfirmActivity({ kind: 'delete', activity })).toBe(activity);
  });
});