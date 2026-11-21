import type { DiscoveryCardModel } from '../../discovery/discoveryCardModel';
import { distanceMeters, type ViewerFix } from './placeDistance';
import {
  groupBrowseListDateSections,
  groupBrowseListByIso,
  type BrowseListDateSection,
} from './browseListDateSections';
import { browseCardDateIso, browseCardTitle } from './browseCardMeta';

export const LIST_SORT_PARAM = 'sort';

export type BrowseListSortMode =
  | 'event_asc'
  | 'event_desc'
  | 'post_asc'
  | 'post_desc'
  | 'name_asc'
  | 'name_desc'
  | 'near_me';

const SORT_MODES = new Set<BrowseListSortMode>([
  'event_asc',
  'event_desc',
  'post_asc',
  'post_desc',
  'name_asc',
  'name_desc',
  'near_me',
]);

export const DEFAULT_BROWSE_LIST_SORT: BrowseListSortMode = 'event_asc';

export type BrowseListSortGroupDef = {
  title: string;
  options: ReadonlyArray<{ mode: BrowseListSortMode; label: string }>;
};

/** Menu + button copy — keep in sync with `ListExplorerSortControl` shell. */
export const BROWSE_LIST_SORT_GROUP_DEFS: ReadonlyArray<BrowseListSortGroupDef> = [
  {
    title: 'Event date / time',
    options: [
      { mode: 'event_asc', label: 'Oldest first' },
      { mode: 'event_desc', label: 'Newest first' },
    ],
  },
  {
    title: 'Post date',
    options: [
      { mode: 'post_asc', label: 'Oldest first' },
      { mode: 'post_desc', label: 'Newest first' },
    ],
  },
  {
    title: 'Name',
    options: [
      { mode: 'name_asc', label: 'A → Z' },
      { mode: 'name_desc', label: 'Z → A' },
    ],
  },
  {
    title: 'Near me',
    options: [{ mode: 'near_me', label: 'Closest first' }],
  },
];

export const findBrowseListSortOption = (
  mode: BrowseListSortMode
): { groupTitle: string; mode: BrowseListSortMode; label: string } | null => {
  for (const group of BROWSE_LIST_SORT_GROUP_DEFS) {
    const option = group.options.find((entry) => entry.mode === mode);
    if (option) return { groupTitle: group.title, ...option };
  }
  return null;
};

export type BrowseListSortTrigger = {
  label: string;
  direction: 'asc' | 'desc';
};

/** Trigger copy — field name only; direction is the arrow. Distinct from menu item labels. */
export const browseListSortTrigger = (mode: BrowseListSortMode): BrowseListSortTrigger => {
  switch (mode) {
    case 'event_desc':
      return { label: 'Date', direction: 'desc' };
    case 'post_asc':
      return { label: 'Posting Date', direction: 'asc' };
    case 'post_desc':
      return { label: 'Posting Date', direction: 'desc' };
    case 'name_asc':
      return { label: 'Name', direction: 'asc' };
    case 'name_desc':
      return { label: 'Name', direction: 'desc' };
    case 'near_me':
      return { label: 'Near Me', direction: 'desc' };
    case 'event_asc':
    default:
      return { label: 'Date', direction: 'asc' };
  }
};

/** Compact label on the sort trigger button. */
export const browseListSortButtonLabel = (mode: BrowseListSortMode): string =>
  browseListSortTrigger(mode).label;

export const browseListSortAriaLabel = (mode: BrowseListSortMode): string => {
  const { label, direction } = browseListSortTrigger(mode);
  return `Sort by ${label}, ${direction === 'asc' ? 'ascending' : 'descending'}`;
};

export const parseBrowseListSort = (value: string | null): BrowseListSortMode => {
  if (value && SORT_MODES.has(value as BrowseListSortMode)) {
    return value as BrowseListSortMode;
  }
  return DEFAULT_BROWSE_LIST_SORT;
};

export const serializeBrowseListSort = (mode: BrowseListSortMode): string | null =>
  mode === DEFAULT_BROWSE_LIST_SORT ? null : mode;

/** Post/listing stamp when the API exposes it; otherwise undated for post grouping. */
export const browseListCardPostDateIso = (card: DiscoveryCardModel): string | null => {
  const activity = card.activity as { createdAt?: string; updatedAt?: string } | undefined;
  const raw = activity?.createdAt ?? activity?.updatedAt;
  if (raw && /^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  return null;
};

export const browseListCardDistanceMeters = (
  card: DiscoveryCardModel,
  viewer: ViewerFix | null
): number | null => {
  if (!viewer || card.mapLatitude == null || card.mapLongitude == null) return null;
  return distanceMeters(viewer, card.mapLatitude, card.mapLongitude);
};

const compareEventDate = (a: DiscoveryCardModel, b: DiscoveryCardModel): number => {
  const left = browseCardDateIso(a) ?? '9999-99-99';
  const right = browseCardDateIso(b) ?? '9999-99-99';
  const byDate = left.localeCompare(right);
  if (byDate !== 0) return byDate;
  return browseCardTitle(a).localeCompare(browseCardTitle(b));
};

const comparePostDate = (a: DiscoveryCardModel, b: DiscoveryCardModel): number => {
  const left = browseListCardPostDateIso(a) ?? '9999-99-99';
  const right = browseListCardPostDateIso(b) ?? '9999-99-99';
  const byDate = left.localeCompare(right);
  if (byDate !== 0) return byDate;
  return browseCardTitle(a).localeCompare(browseCardTitle(b));
};

const compareName = (a: DiscoveryCardModel, b: DiscoveryCardModel): number =>
  browseCardTitle(a).localeCompare(browseCardTitle(b), undefined, { sensitivity: 'base' });

const compareNear = (
  a: DiscoveryCardModel,
  b: DiscoveryCardModel,
  viewer: ViewerFix | null
): number => {
  const left = browseListCardDistanceMeters(a, viewer) ?? Number.POSITIVE_INFINITY;
  const right = browseListCardDistanceMeters(b, viewer) ?? Number.POSITIVE_INFINITY;
  if (left !== right) return left - right;
  return compareName(a, b);
};

export const sortBrowseListCards = (
  cards: DiscoveryCardModel[],
  mode: BrowseListSortMode,
  viewer: ViewerFix | null
): DiscoveryCardModel[] => {
  const copy = [...cards];
  switch (mode) {
    case 'event_desc':
      return copy.sort((a, b) => compareEventDate(b, a));
    case 'post_asc':
      return copy.sort(comparePostDate);
    case 'post_desc':
      return copy.sort((a, b) => comparePostDate(b, a));
    case 'name_asc':
      return copy.sort(compareName);
    case 'name_desc':
      return copy.sort((a, b) => compareName(b, a));
    case 'near_me':
      return copy.sort((a, b) => compareNear(a, b, viewer));
    case 'event_asc':
    default:
      return copy.sort(compareEventDate);
  }
};

const nameFirstLetter = (title: string): string => {
  const first = title.trim().charAt(0).toUpperCase();
  if (!first || !/[A-Z]/.test(first)) return '#';
  return first;
};

const nameGroupLabel = (letters: readonly string[]): string => {
  if (letters.length === 0) return '';
  const sorted = [...letters].sort((a, b) => {
    if (a === '#') return 1;
    if (b === '#') return -1;
    return a.localeCompare(b);
  });
  if (sorted.length === 1) return sorted[0] === '#' ? '#' : sorted[0]!;
  const first = sorted[0]!;
  const last = sorted[sorted.length - 1]!;
  return first === last ? first : `${first} – ${last}`;
};

const MAX_NAME_SECTIONS = 5;

/** Partition first letters into ≤5 contiguous ranges with roughly equal card counts. */
const buildNameLetterGroups = (
  cards: DiscoveryCardModel[]
): Array<{ key: string; label: string; letters: Set<string> }> => {
  const letterCounts = new Map<string, number>();
  for (const card of cards) {
    const letter = nameFirstLetter(browseCardTitle(card));
    letterCounts.set(letter, (letterCounts.get(letter) ?? 0) + 1);
  }
  const letters = [...letterCounts.keys()].sort((a, b) => {
    if (a === '#') return 1;
    if (b === '#') return -1;
    return a.localeCompare(b);
  });
  if (letters.length === 0) return [];

  if (letters.length <= MAX_NAME_SECTIONS) {
    return letters.map((letter) => ({
      key: letter,
      label: nameGroupLabel([letter]),
      letters: new Set([letter]),
    }));
  }

  type Bucket = { letters: string[]; count: number };
  const entries = letters.map((letter) => ({
    letter,
    count: letterCounts.get(letter)!,
  }));
  const total = entries.reduce((sum, entry) => sum + entry.count, 0);
  const target = total / MAX_NAME_SECTIONS;
  const buckets: Bucket[] = [];
  let current: Bucket = { letters: [], count: 0 };

  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index]!;
    const isLast = index === entries.length - 1;
    if (isLast) {
      current.letters.push(entry.letter);
      current.count += entry.count;
      if (current.letters.length > 0) buckets.push(current);
      break;
    }
    const nextCount = current.count + entry.count;
    const shouldSplit =
      buckets.length < MAX_NAME_SECTIONS - 1 &&
      current.letters.length > 0 &&
      current.count >= target * 0.75 &&
      nextCount > target * 1.1;
    if (shouldSplit) {
      buckets.push(current);
      current = { letters: [entry.letter], count: entry.count };
    } else {
      current.letters.push(entry.letter);
      current.count = nextCount;
    }
  }

  return buckets.map((group) => ({
    key: group.letters.join('-'),
    label: nameGroupLabel(group.letters),
    letters: new Set(group.letters),
  }));
};

const groupByName = (cards: DiscoveryCardModel[], desc: boolean): BrowseListDateSection[] => {
  const letterGroups = buildNameLetterGroups(cards);
  const sections = letterGroups.map((group) => {
    const groupCards = cards.filter((card) =>
      group.letters.has(nameFirstLetter(browseCardTitle(card)))
    );
    groupCards.sort((a, b) => (desc ? compareName(b, a) : compareName(a, b)));
    return { key: group.key, label: group.label, cards: groupCards };
  });
  if (desc) sections.reverse();
  return sections;
};

type DistanceBucket = { key: string; label: string; order: number; maxM: number };

const DISTANCE_BUCKETS: DistanceBucket[] = [
  { key: '5km', label: 'Within 5 km', order: 0, maxM: 5_000 },
  { key: '10km', label: 'Within 10 km', order: 1, maxM: 10_000 },
  { key: '30km', label: 'Within 30 km', order: 2, maxM: 30_000 },
  { key: 'other', label: 'Other', order: 3, maxM: Number.POSITIVE_INFINITY },
];

const distanceBucket = (meters: number | null): DistanceBucket => {
  if (meters == null || !Number.isFinite(meters)) return DISTANCE_BUCKETS[3]!;
  if (meters <= 5_000) return DISTANCE_BUCKETS[0]!;
  if (meters <= 10_000) return DISTANCE_BUCKETS[1]!;
  if (meters <= 30_000) return DISTANCE_BUCKETS[2]!;
  return DISTANCE_BUCKETS[3]!;
};

const groupByDistance = (
  cards: DiscoveryCardModel[],
  viewer: ViewerFix | null
): BrowseListDateSection[] => {
  const buckets = new Map<string, BrowseListDateSection & { order: number }>();
  for (const card of cards) {
    const meters = browseListCardDistanceMeters(card, viewer);
    const slot = distanceBucket(meters);
    const existing = buckets.get(slot.key);
    if (existing) existing.cards.push(card);
    else buckets.set(slot.key, { key: slot.key, label: slot.label, order: slot.order, cards: [card] });
  }
  const sections = [...buckets.values()].sort((a, b) => a.order - b.order);
  for (const section of sections) {
    section.cards.sort((a, b) => compareNear(a, b, viewer));
  }
  return sections;
};

const relabelPostDateSection = (section: BrowseListDateSection): BrowseListDateSection => {
  const { key } = section;
  if (key === 'all') {
    return { ...section, label: 'No post date' };
  }
  switch (key) {
    case 'today':
      return { ...section, label: 'Posted today' };
    case 'week':
      return { ...section, label: 'Posted this week' };
    case 'month':
      return { ...section, label: 'Posted this month' };
    case 'other':
      return { ...section, label: 'Other' };
    default:
      return section;
  }
};

const groupByPostDate = (
  cards: DiscoveryCardModel[],
  desc: boolean,
  now: Date
): BrowseListDateSection[] => {
  const sections = groupBrowseListByIso(cards, browseListCardPostDateIso, now)
    .map(relabelPostDateSection)
    .map((section) => ({
      ...section,
      cards: [...section.cards].sort(desc ? (a, b) => comparePostDate(b, a) : comparePostDate),
    }));
  if (desc) sections.reverse();
  return sections;
};

/** Section headers for the active sort (default = event date ascending). */
export const groupBrowseListSections = (
  cards: DiscoveryCardModel[],
  mode: BrowseListSortMode,
  viewer: ViewerFix | null,
  now: Date = new Date()
): BrowseListDateSection[] => {
  if (cards.length === 0) return [];

  switch (mode) {
    case 'name_asc':
      return groupByName(cards, false);
    case 'name_desc':
      return groupByName(cards, true);
    case 'near_me':
      return groupByDistance(cards, viewer);
    case 'post_asc':
      return groupByPostDate(cards, false, now);
    case 'post_desc':
      return groupByPostDate(cards, true, now);
    case 'event_desc': {
      const sections = groupBrowseListDateSections(cards, now);
      return sections
        .map((section) => ({
          ...section,
          cards: [...section.cards].sort((a, b) => compareEventDate(b, a)),
        }))
        .reverse();
    }
    case 'event_asc':
    default:
      return groupBrowseListDateSections(cards, now);
  }
};

export const browseListSortUsesViewerLocation = (mode: BrowseListSortMode): boolean =>
  mode === 'near_me';

/** @deprecated Prefer `browseListSortButtonLabel` for UI. */
export const browseListSortLabel = (mode: BrowseListSortMode): string =>
  browseListSortButtonLabel(mode);
