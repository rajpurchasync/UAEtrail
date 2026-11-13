import { describe, expect, it } from 'vitest';
import type { ActivityDetailDTO } from '@uaetrail/shared-types';
import {
  buildParticipantPostCheckInReviewPrompts,
  participantPostCheckInReviewsPending,
} from './activityPostCheckInReviewPrompts';

const baseActivity = (): ActivityDetailDTO =>
  ({
    id: 'a1',
    activityType: 'hiking',
    locationId: 'trail-1',
    tenantSlug: 'guide-co',
    hostUserId: 'u-host',
    publishingProfileKind: 'pro_guide',
    status: 'published',
    date: '2020-01-01',
    time: '09:00',
    title: 'Hike',
    locationName: 'Trail',
    slotsTotal: 10,
    slotsAvailable: 5,
  }) as ActivityDetailDTO;

describe('buildParticipantPostCheckInReviewPrompts', () => {
  it('returns empty when checked in but outing is not over', () => {
    expect(
      buildParticipantPostCheckInReviewPrompts({
        activity: { ...baseActivity(), date: '2099-12-01', time: '09:00' },
        viewerUserId: 'u1',
        activityReviews: [],
        checkedIn: true,
      })
    ).toEqual([]);
  });

  it('returns empty when not checked in', () => {
    expect(
      buildParticipantPostCheckInReviewPrompts({
        activity: baseActivity(),
        viewerUserId: 'u1',
        activityReviews: [],
        checkedIn: false,
      })
    ).toEqual([]);
  });

  it('includes activity, place, and host prompts when eligible', () => {
    const prompts = buildParticipantPostCheckInReviewPrompts({
      activity: baseActivity(),
      viewerUserId: 'u1',
      activityReviews: [],
      checkedIn: true,
    });
    expect(prompts.map((p) => p.id)).toEqual(['activity', 'place', 'host']);
    expect(prompts[1]?.href).toBe('/place/trail-1#reviews');
    expect(prompts[2]?.href).toBe('/member/u-host#reviews');
  });

  it('marks activity prompt done when viewer already reviewed', () => {
    const prompts = buildParticipantPostCheckInReviewPrompts({
      activity: baseActivity(),
      viewerUserId: 'u1',
      activityReviews: [{ id: 'r1', userId: 'u1', rating: 5, comment: 'Great', createdAt: '', targetType: 'activity', targetId: 'a1' }],
      checkedIn: true,
    });
    expect(prompts.find((p) => p.id === 'activity')?.done).toBe(true);
  });
});

describe('participantPostCheckInReviewsPending', () => {
  it('hides when only activity prompt exists and is done', () => {
    expect(
      participantPostCheckInReviewsPending([
        { id: 'activity', label: 'Rate', done: true, href: null },
      ])
    ).toBe(false);
  });

  it('stays visible for place/host follow-ups after activity review', () => {
    expect(
      participantPostCheckInReviewsPending([
        { id: 'activity', label: 'Rate', done: true, href: null },
        { id: 'place', label: 'Place', done: false, href: '/trail/x#reviews' },
      ])
    ).toBe(true);
  });
});
