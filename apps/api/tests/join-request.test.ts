import { describe, expect, it } from 'vitest';
import { isEventFull } from '../src/services/join-request.js';

describe('join request waitlist logic', () => {
  it('detects full events', () => {
    expect(isEventFull(10, 10)).toBe(true);
    expect(isEventFull(10, 11)).toBe(true);
  });

  it('detects available capacity', () => {
    expect(isEventFull(10, 9)).toBe(false);
    expect(isEventFull(1, 0)).toBe(false);
  });
});

describe('join request flow (contract)', () => {
  it('returns waitlisted status when event is at capacity', () => {
    const capacity = 5;
    const participants = 5;
    const waitlisted = isEventFull(capacity, participants);
    expect(waitlisted).toBe(true);
    const status = waitlisted ? 'waitlisted' : 'pending';
    expect(status).toBe('waitlisted');
  });

  it('returns pending status when slots remain', () => {
    const status = isEventFull(5, 3) ? 'waitlisted' : 'pending';
    expect(status).toBe('pending');
  });
});
