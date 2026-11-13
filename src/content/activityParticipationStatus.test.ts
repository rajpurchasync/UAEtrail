import { describe, expect, it } from 'vitest';
import { resolveViewerParticipationStatus } from './activityParticipationStatus';

describe('resolveViewerParticipationStatus', () => {
  it('returns null when open', () => {
    expect(resolveViewerParticipationStatus({ joinKind: 'open' })).toBeNull();
  });

  it('labels pending and pending with family', () => {
    expect(resolveViewerParticipationStatus({ joinKind: 'pending' })?.label).toBe('Pending');
    expect(
      resolveViewerParticipationStatus({ joinKind: 'pending', adults: 1, kids: 2 })?.label
    ).toBe('Pending with family');
  });

  it('labels joined variants', () => {
    expect(resolveViewerParticipationStatus({ joinKind: 'confirmed' })?.label).toBe('Joined');
    expect(
      resolveViewerParticipationStatus({ joinKind: 'confirmed', adults: 2, kids: 0 })?.label
    ).toBe('Joined with family');
    expect(
      resolveViewerParticipationStatus({
        joinKind: 'confirmed',
        adults: 1,
        kids: 1,
        partyApprovalPending: true,
      })?.label
    ).toBe('Joined · family pending');
  });

  it('labels family joining pending while adults are invited', () => {
    expect(
      resolveViewerParticipationStatus({
        joinKind: 'confirmed',
        adults: 2,
        kids: 0,
        partyMembers: [
          {
            membershipId: 'm1',
            groupId: 'g1',
            memberType: 'adult',
            userId: 'u2',
            displayName: 'Alex',
            status: 'family_invited',
          },
        ],
      })?.label
    ).toBe('Family joining pending');
  });
});
