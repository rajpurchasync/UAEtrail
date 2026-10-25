import { describe, expect, it, vi, beforeEach } from 'vitest';
import { buildPlaceRegistry } from '../src/services/place-registry.js';
import { listActiveLocations } from '../src/lib/location-query.js';
import { listSubmittedLocationsByUser } from '../src/lib/activities-store.js';

vi.mock('../src/lib/location-query.js', () => ({
  listActiveLocations: vi.fn(),
}));

vi.mock('../src/lib/activities-store.js', () => ({
  listSubmittedLocationsByUser: vi.fn(),
}));

vi.mock('../src/lib/admin-store.js', () => ({
  listAdminPlacesPaged: vi.fn().mockResolvedValue({ items: [], total: 0 }),
}));

const mockListActive = vi.mocked(listActiveLocations);
const mockSubmitted = vi.mocked(listSubmittedLocationsByUser);

describe('buildPlaceRegistry', () => {
  beforeEach(() => {
    mockListActive.mockReset();
    mockSubmitted.mockReset();
  });

  it('returns published registry places for activity type', async () => {
    mockListActive.mockResolvedValueOnce({
      items: [
        {
          id: 't1',
          name: 'Wadi',
          region: 'RAK',
          activityType: 'HIKING',
          description: 'Trail',
          difficulty: null,
          season: [],
          childFriendly: false,
          maxGroupSize: null,
          accessibility: null,
          images: ['https://images.example/wadi-cover.jpg'],
          featured: false,
          status: 'ACTIVE',
          distance: null,
          duration: null,
          elevation: null,
          campingType: null,
          latitude: 25,
          longitude: 56,
          highlights: [],
          surfaceType: [],
          tags: [],
          parkingLink: null,
          parkingLat: null,
          parkingLng: null,
          groupRegionLevels: null,
          premiumImages: [],
          accessibleBy: [],
          viewCount: 0,
          countryCode: 'AE',
          gpxKey: null,
          guidePdfKey: null,
          guideMarkdown: null,
          guidePreview: null,
          unlockPriceAed: 29,
          submittedById: null,
          registryListed: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      total: 1,
    });

    const places = await buildPlaceRegistry({ activityType: 'hiking' });
    expect(places).toHaveLength(1);
    expect(places[0]?.activityType).toBe('hiking');
    expect(mockListActive).toHaveBeenCalledWith(
      expect.objectContaining({ activityType: 'hiking', pageSize: 500 })
    );
  });
});
