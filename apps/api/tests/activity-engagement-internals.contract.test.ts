import { describe, expect, it } from 'vitest';
import {
  isActivityFull,
  stripPartyLineFromNote,
  toActivityRequestRecord,
  withPartyNote,
} from '../src/lib/activity-engagement-store-internals.js';

describe('activity engagement internals (R6 contract)', () => {
  it('maps Mongo join rows through shared-types hostNote resolver', () => {
    const doc = {
      _id: 'req-1',
      activityId: 'act-1',
      userId: 'user-1',
      status: 'PENDING',
      note: 'Hello host',
      hostNote: '  decide soon  ',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    } as Parameters<typeof toActivityRequestRecord>[0];

    const record = toActivityRequestRecord(doc);
    expect(record.id).toBe('req-1');
    expect(record.hostNote).toBe('decide soon');
    expect(record.note).toBe('Hello host');
  });

  it('strips party summary lines from stored join notes', () => {
    expect(
      stripPartyLineFromNote('Please bring water\nParty: 2 adults, 1 kid\nThanks')
    ).toBe('Please bring water\nThanks');
    expect(stripPartyLineFromNote('Group: 1 adult')).toBeNull();
  });

  it('appends party headcount lines without duplicating prior party rows', () => {
    expect(withPartyNote('Need a lift', 2, 1)).toBe('Need a lift\nGroup: 2 adults, 1 kid');
    expect(withPartyNote('Party: 1 adult\nNote', 3, 0)).toBe('Note\nGroup: 3 adults');
  });

  it('detects full capacity from slots used', () => {
    expect(isActivityFull(10, 10)).toBe(true);
    expect(isActivityFull(10, 9)).toBe(false);
  });
});