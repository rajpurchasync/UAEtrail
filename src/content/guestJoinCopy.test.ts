import { describe, expect, it } from 'vitest';
import { guestBrowseGateCopy } from './guestBrowseGateCopy';
import {
  GUEST_ACTIVITY_DETAIL_PREVIEW_TITLE,
  guestActivityDetailPreviewBody,
} from './guestJoinCopy';

describe('guest activity detail preview copy', () => {
  it('frames listed outing detail as preview until sign-in', () => {
    const gate = guestBrowseGateCopy('join-activity', {
      intent: 'activity',
      activityTitle: 'Baqal Caves',
      detailPreview: true,
    });
    expect(gate.title).toBe(GUEST_ACTIVITY_DETAIL_PREVIEW_TITLE);
    expect(gate.body).toContain('Baqal Caves');
    expect(gate.title).toMatch(/Log in to view details/i);
    expect(gate.body).toMatch(/Log in/i);
    expect(guestActivityDetailPreviewBody({ activityTitle: 'Dawn hike' })).toContain('Dawn hike');
  });
});
