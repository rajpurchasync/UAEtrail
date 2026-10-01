import { describe, expect, it } from 'vitest';
import { GUEST_GATE_OOPS_TITLE, guestJoinSheetBody, guestJoinSheetHeadline } from './guestJoinCopy';

describe('guestJoinCopy', () => {
  it('uses a single guest gate headline', () => {
    expect(guestJoinSheetHeadline({ participationMode: 'rsvp', activityTitle: 'Trail run' })).toBe(
      GUEST_GATE_OOPS_TITLE
    );
    expect(guestJoinSheetHeadline({ activityTitle: 'Sunrise hike' })).toBe(GUEST_GATE_OOPS_TITLE);
  });

  it('uses RSVP tone in body when participationMode is rsvp', () => {
    const body = guestJoinSheetBody({ participationMode: 'rsvp', activityTitle: 'Trail run' });
    expect(body).toContain('you’re going');
    expect(body).toContain('Trail run');
  });

  it('uses approval tone in body by default', () => {
    expect(guestJoinSheetBody({ activityTitle: 'Sunrise hike' })).toContain('request');
    expect(guestJoinSheetBody({ activityTitle: 'Weekend camp' })).toContain('request');
  });

  it('uses RSVP body for hiking and camping when host chose open RSVP', () => {
    expect(guestJoinSheetBody({ participationMode: 'rsvp', activityTitle: 'Desert camp' })).toContain(
      'you’re going'
    );
  });
});
