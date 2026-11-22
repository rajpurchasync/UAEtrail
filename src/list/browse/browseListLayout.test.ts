import { describe, expect, it } from 'vitest';
import type { BrowseListFilterState } from './browseListFilters';
import {
  countBrowseListFilters,
  parseBrowseListLayout,
  serializeBrowseListLayout,
} from './browseListLayout';
import {
  browseListBucketCategories,
  browseListBucketTotalLabel,
  browseListSearchBucketCounts,
  parseBrowseListBucket,
  serializeBrowseListBucket,
} from './browseListBucket';
import { parseListFilterFabCorner, snapListFilterFabCorner } from './listFilterFabSnap';
import { browseListEntityLinkState } from './browseListNavState';
import type { DiscoveryCardModel } from '../../discovery/discoveryCardModel';
import {
  browseCardMeta,
  browseCardTitle,
  browseCardPriceLabel,
  browseCardListHeroPriceLabel,
  formatBrowseRowDateLabel,
  browseRowWhenDisplay,
} from './browseCardMeta';

const emptyFilters = (): BrowseListFilterState => ({
  query: 'wadi',
  categories: [],
  tripTopics: [],
  placeTopics: [],
  tripAvailabilityOnly: false,
  price: 'all',
  when: 'any',
  activityDatePreset: 'anyday',
  crewBrowseLane: 'people',
  crewPeopleFacet: 'recommended',
  crewProfessionalKind: 'all',
  hasTrip: false,
  facilityKinds: [],
  audience: 'anyone',
});

describe('list explorer layout', () => {
  it('defaults thumbnails and omits the URL param', () => {
    expect(parseBrowseListLayout(null)).toBe('thumbnails');
    expect(parseBrowseListLayout('list')).toBe('list');
    expect(parseBrowseListLayout('calendar')).toBe('calendar');
    expect(serializeBrowseListLayout('thumbnails')).toBeNull();
    expect(serializeBrowseListLayout('list')).toBe('list');
  });

  it('counts applied filters for the open Events/Places view', () => {
    expect(countBrowseListFilters(emptyFilters(), [])).toBe(0);
    expect(
      countBrowseListFilters(
        {
          ...emptyFilters(),
          tripTopics: ['hiking', 'camping'],
          price: 'free',
          activityDatePreset: 'week',
        },
        ['Dubai']
      )
    ).toBe(5);
    expect(
      countBrowseListFilters(
        {
          ...emptyFilters(),
          tripTopics: ['hiking'],
          placeTopics: ['hiking'],
        },
        []
      )
    ).toBe(1);
    expect(
      countBrowseListFilters(
        {
          ...emptyFilters(),
          tripTopics: ['hiking'],
          placeTopics: ['hiking', 'shop'],
          price: 'paid',
        },
        ['Dubai'],
        'places'
      )
    ).toBe(3);
  });
});

describe('list explorer events/places bucket', () => {
  it('defaults to events and omits listCat', () => {
    expect(parseBrowseListBucket(null)).toBe('events');
    expect(parseBrowseListBucket('activities')).toBe('events');
    expect(parseBrowseListBucket('venues')).toBe('places');
    expect(serializeBrowseListBucket('events')).toBeNull();
    expect(serializeBrowseListBucket('places')).toBe('venues');
    expect(browseListBucketCategories('events')).toEqual(['activities']);
    expect(browseListBucketCategories('places')).toEqual(['venues']);
  });

  it('labels the current total and search counts on both buckets', () => {
    expect(browseListBucketTotalLabel('events', 17)).toBe('17 trips');
    expect(browseListBucketTotalLabel('places', 1)).toBe('1 place');
    expect(
      browseListSearchBucketCounts({
        activities: 2,
        places: 1,
        people: 0,
        shops: 1,
        agencies: 0,
        facilities: 0,
      })
    ).toEqual({ events: 2, places: 2 });
  });
});

describe('list explorer filter fab snap', () => {
  it('snaps to the nearest corner', () => {
    expect(snapListFilterFabCorner(10, 10, 400, 800)).toBe('tl');
    expect(snapListFilterFabCorner(390, 10, 400, 800)).toBe('tr');
    expect(snapListFilterFabCorner(10, 790, 400, 800)).toBe('bl');
    expect(snapListFilterFabCorner(390, 790, 400, 800)).toBe('br');
    expect(parseListFilterFabCorner('tr')).toBe('tr');
    expect(parseListFilterFabCorner('nope')).toBe('bl');
  });
});

describe('list explorer thumbnail copy', () => {
  const socialHeadline = 'Samira Khan is going Hiking on Saturday 31st';
  const eventCard = {
    source: 'activity',
    listTitle: socialHeadline,
    headline: `${socialHeadline} - Hatta`,
    listHost: 'Samira Khan',
    hostAvatar: 'https://cdn.example/samira.jpg',
    sections: { hostName: 'Samira Khan', activityHighlight: 'Hiking', details: [] },
    activity: { title: 'Hatta Dam Loop' },
    price: { kind: 'paid', badge: 'Paid Event · AED 120' },
  } as DiscoveryCardModel;

  it('uses the host-provided event name instead of the social headline', () => {
    expect(browseCardTitle(eventCard)).toBe('Hatta Dam Loop');
    expect(browseCardMeta(eventCard).title).toBe('Hatta Dam Loop');
    expect(browseCardMeta(eventCard).hostName).toBe('Samira Khan');
  });

  it('shows a compact price for the image overlay', () => {
    expect(browseCardPriceLabel(eventCard)).toBe('AED 120');
    expect(browseCardPriceLabel({ ...eventCard, price: { kind: 'free', badge: 'Free' } })).toBe('Free');
  });

  it('uses Free/Paid on list hero foot (not AED on the thumb)', () => {
    expect(browseCardListHeroPriceLabel(eventCard)).toBe('Paid');
    expect(
      browseCardListHeroPriceLabel({ ...eventCard, price: { kind: 'free', badge: 'Free' } })
    ).toBe('Free');
  });

  it('uses the company logo and name when the outing is published by an agency', () => {
    const companyCard = {
      ...eventCard,
      listHost: 'Fatima Al Mazrouei',
      hostAvatar: 'https://cdn.example/fatima.jpg',
      activity: {
        title: 'Hatta Dam Loop',
        publishingProfileKind: 'agency',
        tenantName: 'UAE Adventure Co',
        tenantLogoUrl: 'https://cdn.example/logo.png',
      },
    } as DiscoveryCardModel;
    const meta = browseCardMeta(companyCard);
    expect(meta.hostName).toBe('UAE Adventure Co');
    expect(meta.hostAvatar).toBe('https://cdn.example/logo.png');
  });

  it('uses emirate and hub on venue cards instead of generic hiking location', () => {
    const venueCard = {
      source: 'venue',
      kind: 'hiking',
      listTitle: 'Wadi Shawka',
      headline: 'Wadi Shawka',
      subtitle: 'Wadi Ghalilah',
      venueRegion: 'RAK',
      areaName: 'Wadi Ghalilah',
      venueHint: 'Hiking trail location',
      sections: { details: [] },
    } as DiscoveryCardModel;
    expect(browseCardMeta(venueCard).location).toBe('RAK · Wadi Ghalilah');
    expect(browseCardMeta(venueCard).location).not.toMatch(/Hiking trail location/);
  });

  it('formats list row dates in full weekday form without relative prefixes', () => {
    const now = new Date('2026-10-30T10:00:00');
    expect(formatBrowseRowDateLabel('2026-10-30')).toBe('Fri 30 Oct 26');
    expect(formatBrowseRowDateLabel('2026-10-31')).toBe('Sat 31 Oct 26');

    const weekCard = {
      ...eventCard,
      scheduleDate: '2026-10-31',
      whenLabel: 'Sat at 4:00 PM',
      activity: { title: 'Hatta Dam Loop', date: '2026-10-31', time: '16:00' },
    } as DiscoveryCardModel;
    expect(browseRowWhenDisplay(weekCard, now)).toEqual({
      date: 'Sat 31 Oct 26',
      time: '4:00 PM',
    });
  });
});

describe('list explorer entity back state', () => {
  it('returns to the list URL after nested detail screens', () => {
    expect(browseListEntityLinkState('/list?q=hatta')).toEqual({
      from: '/list?q=hatta',
      backLabel: 'Browse',
      detailBackTo: '/list?q=hatta',
    });
  });
});