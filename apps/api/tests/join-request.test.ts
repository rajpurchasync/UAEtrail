import { describe, expect, it } from 'vitest';
import { isActivityFull } from '../src/services/join-request.js';

describe('join request waitlist logic', () => {
  it('detects full events', () => {
    expect(isActivityFull(10, 10)).toBe(true);
    expect(isActivityFull(10, 11)).toBe(true);
  });

  it('detects available capacity', () => {
    expect(isActivityFull(10, 9)).toBe(false);
    expect(isActivityFull(1, 0)).toBe(false);
  });
});

describe('join request flow (contract)', () => {
  it('returns waitlisted status when event is at capacity', () => {
    const capacity = 5;
    const participants = 5;
    const waitlisted = isActivityFull(capacity, participants);
    expect(waitlisted).toBe(true);
    const status = waitlisted ? 'waitlisted' : 'pending';
    expect(status).toBe('waitlisted');
  });

  it('returns pending status when slots remain', () => {
    const status = isActivityFull(5, 3) ? 'waitlisted' : 'pending';
    expect(status).toBe('pending');
  });
});
