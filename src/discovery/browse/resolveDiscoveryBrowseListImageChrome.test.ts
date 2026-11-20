import { describe, expect, it } from 'vitest';
import type { DiscoveryCardModel } from '../discoveryCardModel';
import {
  resolveDiscoveryBrowseListPolicyLabels,
  resolveDiscoveryBrowseListTypeLabel,
} from './resolveDiscoveryBrowseListImageChrome';

describe('resolveDiscoveryBrowseListImageChrome', () => {
  it('resolves scheduled outing type label with text', () => {
    const card = {
      source: 'activity',
      kind: 'hiking',
      activity: { activityType: 'hiking' },
    } as DiscoveryCardModel;
    expect(resolveDiscoveryBrowseListTypeLabel(card)).toBe('Hiking');
  });

  it('puts requirement badges on the image overlay', () => {
    const card = {
      source: 'activity',
      requirementBadges: ['Women only', 'Child-friendly'],
    } as DiscoveryCardModel;
    expect(resolveDiscoveryBrowseListPolicyLabels(card)).toEqual(['Women only', 'Child-friendly']);
  });

  it('puts child-friendly on venue image when no activity badges', () => {
    const card = {
      source: 'place',
      kind: 'hiking',
      childFriendly: true,
    } as DiscoveryCardModel;
    expect(resolveDiscoveryBrowseListPolicyLabels(card)).toEqual(['Child-friendly']);
  });

  it('uses Pet-friendly on venue policy chips (trips keep Pets welcome)', () => {
    const venue = {
      source: 'venue',
      kind: 'hiking',
      requirementBadges: ['Pets welcome'],
    } as DiscoveryCardModel;
    const trip = {
      source: 'activity',
      requirementBadges: ['Pets welcome'],
    } as DiscoveryCardModel;
    expect(resolveDiscoveryBrowseListPolicyLabels(venue)).toEqual(['Pet-friendly']);
    expect(resolveDiscoveryBrowseListPolicyLabels(trip)).toEqual(['Pets welcome']);
  });

  it('keeps child-friendly on venue image when difficulty badges exist (no early return)', () => {
    const card = {
      source: 'venue',
      kind: 'hiking',
      childFriendly: true,
      requirementBadges: ['Medium', 'Child-friendly'],
    } as DiscoveryCardModel;
    expect(resolveDiscoveryBrowseListPolicyLabels(card)).toEqual(['Child-friendly']);
  });
});