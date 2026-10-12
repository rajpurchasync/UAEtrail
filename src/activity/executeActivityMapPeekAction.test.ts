import { describe, expect, it, vi } from 'vitest';
import {
  ACTIVITY_MAP_PEEK_ACTION_IDS,
  executeActivityMapPeekAction,
} from './executeActivityMapPeekAction';
import type { ActivityMapPeekActionId } from '@uaetrail/shared-types';

describe('executeActivityMapPeekAction', () => {
  it('AD-LIST-08: covers every ActivityMapPeekActionId wire id', () => {
    expect(ACTIVITY_MAP_PEEK_ACTION_IDS).toHaveLength(11);
    const expected: ActivityMapPeekActionId[] = [
      'open_crew_chat',
      'link_rideshare',
      'offer_rideshare',
      'message_host',
      'invite_crew',
      'view_detail',
      'request_join',
      'pending_join',
      'share_activity',
      'manage_activity',
      'withdraw_join',
    ];
    expect([...ACTIVITY_MAP_PEEK_ACTION_IDS].sort()).toEqual([...expected].sort());
  });

  it('invokes the matching handler per wire id', () => {
    const handlers = {
      openCrewChat: vi.fn(),
      linkRideshare: vi.fn(),
      offerRideshare: vi.fn(),
      messageHost: vi.fn(),
      inviteCrew: vi.fn(),
      viewDetail: vi.fn(),
      requestJoin: vi.fn(),
      shareActivity: vi.fn(),
      manageActivity: vi.fn(),
      withdrawJoin: vi.fn(),
    };

    const mapping: Record<ActivityMapPeekActionId, () => void | undefined> = {
      open_crew_chat: handlers.openCrewChat,
      link_rideshare: handlers.linkRideshare,
      offer_rideshare: handlers.offerRideshare,
      message_host: handlers.messageHost,
      invite_crew: handlers.inviteCrew,
      view_detail: handlers.viewDetail,
      request_join: handlers.requestJoin,
      pending_join: () => undefined,
      share_activity: handlers.shareActivity,
      manage_activity: handlers.manageActivity,
      withdraw_join: handlers.withdrawJoin,
    };

    for (const actionId of ACTIVITY_MAP_PEEK_ACTION_IDS) {
      Object.values(handlers).forEach((fn) => fn.mockClear());
      executeActivityMapPeekAction(actionId, handlers);
      if (actionId === 'pending_join') {
        Object.values(handlers).forEach((fn) => expect(fn).not.toHaveBeenCalled());
      } else {
        expect(mapping[actionId]).toHaveBeenCalledTimes(1);
      }
    }
  });
});
