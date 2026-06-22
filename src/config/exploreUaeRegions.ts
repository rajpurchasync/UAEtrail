/**
 * Explore UAE region cards on the home page.
 * Images: Unsplash License (https://unsplash.com/license) — free for commercial use.
 */

export type ExploreRegionIcon = 'mountain' | 'tent' | 'compass';

export interface ExploreUaeRegion {
  name: string;
  /** Discovery URL — region filter when possible, otherwise text search */
  discoveryLink: string;
  image: string;
  imageAlt: string;
  /** Region filter helpers — matched against trail/camp region strings */
  regionKeys: string[];
  icon: ExploreRegionIcon;
  /** Unsplash photo page (attribution / license reference) */
  creditUrl: string;
}

/** Build a cropped Unsplash CDN URL from a photo-* asset id */
export const unsplashPhoto = (photoId: string, width = 800) =>
  `https://images.unsplash.com/${photoId}?w=${width}&fit=crop&q=80`;

export const EXPLORE_UAE_REGIONS: ExploreUaeRegion[] = [
  {
    name: 'Ras Al Khaimah',
    discoveryLink: '/discovery?region=RAK',
    image: unsplashPhoto('photo-1680425982087-9f6f25861db1'),
    imageAlt: 'Jebel Jais mountain peaks and winding road, Ras Al Khaimah, UAE',
    regionKeys: ['RAK', 'Ras'],
    icon: 'mountain',
    creditUrl: 'https://unsplash.com/photos/8B9DS9ycgws'
  },
  {
    name: 'Fujairah',
    discoveryLink: '/discovery?region=Fujairah&activity=camping',
    image: unsplashPhoto('photo-1683028135155-7638f285b662'),
    imageAlt: 'Dibba coastline where the Hajar Mountains meet the Gulf of Oman, Fujairah, UAE',
    regionKeys: ['Fujairah'],
    icon: 'mountain',
    creditUrl: 'https://unsplash.com/photos/CzeqmF3br1E'
  },
  {
    name: 'Hatta',
    discoveryLink: '/discovery?q=Hatta',
    image: unsplashPhoto('photo-1646641678252-52aee3025261'),
    imageAlt: 'Turquoise waters of Hatta Dam surrounded by Hajar mountains, Dubai, UAE',
    regionKeys: ['Hatta'],
    icon: 'mountain',
    creditUrl: 'https://unsplash.com/photos/b_BRaORHCY4'
  },
  {
    name: 'Al Ain',
    discoveryLink: '/discovery?region=Al%20Ain&activity=camping',
    image: unsplashPhoto('photo-1753703986788-2ac0aa05b728'),
    imageAlt: 'Sand dunes stretching across the Abu Dhabi desert near Al Ain, UAE',
    regionKeys: ['Al Ain'],
    icon: 'tent',
    creditUrl: 'https://unsplash.com/photos/_CZcCyW4kgU'
  }
];
