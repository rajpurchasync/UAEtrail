import { describe, expect, it } from 'vitest';
import { guestJoinSheetBody, guestJoinSheetHeadline } from './guestJoinCopy';

describe('guestJoinCopy', () => {
  it('uses RSVP tone when participationMode is rsvp', () => {
    expect(
      guestJoinSheetHeadline({ participationMode: 'rsvp', activityTitle: 'Trail run' })
    ).toContain("you're going");
    expect(guestJoinSheetBody({ participationMode: 'rsvp', activityTitle: 'Trail run' })).toContain(
      "I'm going"
    );
  });

  it('uses approval tone by default', () => {
    expect(guestJoinSheetHeadline({ activityTitle: 'Sunrise hike' })).toContain('Request to join');
    expect(guestJoinSheetBody({ activityTitle: 'Sunrise hike' })).toContain('request');
  });
});
