import { EXPLORE_SHOPS_LIST_PATH, type ExploreMapItemDTO } from '@uaetrail/shared-types';
import { buildDiscoveryCardViewModelCard } from '../discovery/discoveryCardViewModel';
import type { ExploreCardModel } from '../explore/exploreCardModel';
const PLACEHOLDER_SHOPS: readonly ExploreMapItemDTO[] = [
  {
    id: 'shop:discover-placeholder-sandpeak',
    kind: 'shop',
    source: 'shop',
    title: 'SandPeak Outdoor',
    subtitle: 'Sharjah',
    about: 'Trail shoes, packs, and camp basics for weekend hikers.',
    latitude: 25.3463,
    longitude: 55.4209,
    path: EXPLORE_SHOPS_LIST_PATH,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&fit=crop&q=80',
    shopPresence: 'physical',
  },
  {
    id: 'shop:discover-placeholder-wadi',
    kind: 'shop',
    source: 'shop',
    title: 'Wadi Gear Hub',
    subtitle: 'Hatta',
    about: 'Hydration, trekking poles, and desert camping kits.',
    latitude: 24.8007,
    longitude: 56.1153,
    path: EXPLORE_SHOPS_LIST_PATH,
    image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&fit=crop&q=80',
    shopPresence: 'physical',
  },
  {
    id: 'shop:discover-placeholder-summit',
    kind: 'shop',
    source: 'shop',
    title: 'Summit Supply',
    subtitle: 'RAK',
    about: 'Mountain layers and headlamps for Jebel Jais trips.',
    latitude: 25.9434,
    longitude: 56.1778,
    path: EXPLORE_SHOPS_LIST_PATH,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&fit=crop&q=80',
    shopPresence: 'physical',
  },
  {
    id: 'shop:discover-placeholder-dune',
    kind: 'shop',
    source: 'shop',
    title: 'Dune Runner Pro Shop',
    subtitle: 'Abu Dhabi',
    about: 'Running vests and sun gear for Gulf heat.',
    latitude: 24.4539,
    longitude: 54.3773,
    path: EXPLORE_SHOPS_LIST_PATH,
    image: 'https://images.unsplash.com/photo-1514996937319-344454492b37?w=800&fit=crop&q=80',
    shopPresence: 'physical',
  },
  {
    id: 'shop:discover-placeholder-gulf',
    kind: 'shop',
    source: 'shop',
    title: 'Gulf Trail Outfitters',
    subtitle: 'Dubai',
    about: 'Tents, stoves, and group camp essentials.',
    latitude: 25.0657,
    longitude: 55.1713,
    path: EXPLORE_SHOPS_LIST_PATH,
    image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&fit=crop&q=80',
    shopPresence: 'physical',
  },
];

/** Matches `DISCOVER_RAIL_LIMIT` in listDiscoverRails (avoid circular import). */
const PLACEHOLDER_LIMIT = 5;

export const buildDiscoverShopPlaceholderCards = (): ExploreCardModel[] =>
  PLACEHOLDER_SHOPS.slice(0, PLACEHOLDER_LIMIT).map((item) => buildDiscoveryCardViewModelCard(item));
