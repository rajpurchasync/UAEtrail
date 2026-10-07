import { describe, expect, it } from 'vitest';
import { activityTimingHasEnded, mapHostParticipantToDto } from '../src/lib/participant-roster-dto.js';

describe('participant-roster-dto', () => {
  it('maps going vs attended and capability flags', () => {
    const base = {
      id: 'p1',
      activityId: 'a1',
      userId: 'u1',
      requestId: 'r1',
      approvedById: 'h1',
      hostRatingScore: null,
      hostRatingComment: null,
      hostRatedAt: null,
      createdAt: new Date('2026-01-01'),
    };

    const going = mapHostParticipantToDto(
      { ...base, checkedInAt: null },
      { displayName: 'Ada', email: 'a@x.com', phone: null, avatarUrl: null },
      false
    );
    expect(going.status).toBe('going');
    expect(going.canConfirmAttendance).toBe(true);
    expect(going.canRevoke).toBe(true);
    expect(going.canRate).toBe(false);

    const attended = mapHostParticipantToDto(
      { ...base, checkedInAt: new Date('2026-01-02') },
      { displayName: 'Ada', email: 'a@x.com', phone: null, avatarUrl: null },
      true
    );
    expect(attended.status).toBe('attended');
    expect(attended.canConfirmAttendance).toBe(false);
    expect(attended.canRevoke).toBe(false);
    expect(attended.canRate).toBe(true);
  });

  it('activityTimingHasEnded uses endAt when present', () => {
    const past = new Date(Date.now() - 60_000);
    expect(activityTimingHasEnded(past, null)).toBe(true);
    const future = new Date(Date.now() + 60_000);
    expect(activityTimingHasEnded(future, null)).toBe(false);
  });
});
