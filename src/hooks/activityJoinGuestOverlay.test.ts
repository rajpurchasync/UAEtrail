import { describe, expect, it } from 'vitest';
import {
  ACTIVITY_JOIN_GUEST_OVERLAY_CLOSED,
  activityJoinGuestOverlayIsOpen,
  activityJoinGuestOverlayOpenBrowse,
  activityJoinGuestOverlayOpenJoin,
} from './activityJoinGuestOverlay';

describe('activityJoinGuestOverlay', () => {
  it('closed overlay is not open', () => {
    expect(activityJoinGuestOverlayIsOpen(ACTIVITY_JOIN_GUEST_OVERLAY_CLOSED)).toBe(false);
  });

  it('join and browse surfaces are mutually exclusive with closed', () => {
    const join = activityJoinGuestOverlayOpenJoin('activity', 'request_join');
    const browse = activityJoinGuestOverlayOpenBrowse('peek-details', 'view_detail');
    expect(activityJoinGuestOverlayIsOpen(join)).toBe(true);
    expect(activityJoinGuestOverlayIsOpen(browse)).toBe(true);
    expect(join.surface).toBe('join');
    expect(browse.surface).toBe('browse');
  });
});