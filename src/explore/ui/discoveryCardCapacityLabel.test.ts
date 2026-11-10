import { describe, expect, it } from 'vitest';
import { resolveDiscoveryCardCapacityLabel } from './DiscoveryCardPresentation';
import type { DiscoveryCardModel } from '../../discovery/discoveryCardModel';

const baseCard = (): DiscoveryCardModel =>
  ({
    source: 'activity',
    sections: { partyLabel: '1/12', details: [] },
    participantPreviews: [{ userId: 'u1' } as DiscoveryCardModel['participantPreviews'][number]],
    activity: {
      id: 'a1',
      slotsAvailable: 11,
      slotsTotal: 12,
      counts: { going: 1 },
    },
  }) as DiscoveryCardModel;

describe('map peek capacity label', () => {
  it('matches activity detail (spots left), not filled/total partyLabel', () => {
    expect(resolveDiscoveryCardCapacityLabel(baseCard())).toBe('11 of 12 spots left');
  });

  it('heals stale slotsAvailable using participant previews', () => {
    const card = {
      ...baseCard(),
      activity: { ...baseCard().activity!, slotsAvailable: 12 },
    } as DiscoveryCardModel;
    expect(resolveDiscoveryCardCapacityLabel(card)).toBe('11 of 12 spots left');
  });
});
