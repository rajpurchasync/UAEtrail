import type { DiscoveryCardModel } from '../../discovery/discoveryCardModel';
import { distanceMeters, type ViewerFix } from './placeDistance';
import {
  groupListExplorerDateSections,
  groupListExplorerByIso,
  type ListExplorerDateSection,
} from './listExplorerDateSections';
import { listExplorerCardDateIso, listExplorerCardTitle } from './listExplorerCardMeta';

export const LIST_SORT_PARAM = 'sort';

export type ListExplorerSortMode =
  | 'event_asc'
  | 'event_desc'
  | 'post_asc'
  | 'post_desc'
  | 'name_asc'
  | 'name_desc'
  | 'near_me';

const SORT_MODES = new Set<ListExplorerSortMode>([
  'event_asc',
  'event_desc',
  'post_asc',
  'post_desc',
  'name_asc',
  'name_desc',
  'near_me',
]);

export const DEFAULT_LIST_EXPLORER_SORT: ListExplorerSortMode = 'event_asc';

export type ListExplorerSortGroupDef = {
  title: string;
  options: ReadonlyArray<{ mode: ListExplorerSortMode; label: string }>;
};

/** Menu + button copy — keep in sync with `ListExplorerSortControl`. */
export const LIST_EXPLORER_SORT_GROUP_DEFS: ReadonlyArray<ListExplorerSortGroupDef> = [
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
      { mode: 'name_asc', label: 'Name Ascending' },
      { mode: 'name_desc', label: 'Name Descending' },
    ],
  },
  {
    title: 'Near me',
    options: [{ mode: 'near_me', label: 'By distance' }],
  },
];

export const findListExplorerSortOption = (
  mode: ListExplorerSortMode
): { groupTitle: string; mode: ListExplorerSortMode; label: string } | null => {
  for (const group of LIST_EXPLORER_SORT_GROUP_DEFS) {
    const option = group.options.find((entry) => entry.mode === mode);
    if (option) return { groupTitle: group.title, ...option };
  }
  return null;
};

const listExplorerSortGroupShortTitle = (title: string): string => {
  if (title === 'Event date / time') return 'Event';
  if (title === 'Post date') return 'Post';
  return title;
};

/** Compact label on the sort trigger button. */
export const listExplorerSortButtonLabel = (mode: ListExplorerSortMode): string => {
  const found = findListExplorerSortOption(mode);
  if (!found) return 'Sort';
  return `${listExplorerSortGroupShortTitle(found.groupTitle)} · ${found.label}`;
};

export const listExplorerSortAriaLabel = (mode: ListExplorerSortMode): string => {
  const found = findListExplorerSortOption(mode);
  if (!found) return 'Sort list';
  return `Sort: ${found.groupTitle}, ${found.label}`;
};

export const parseListExplorerSort = (value: string | null): ListExplorerSortMode => {
  if (value && SORT_MODES.has(value as ListExplorerSortMode)) {
    return value as ListExplorerSortMode;
  }
  return DEFAULT_LIST_EXPLORER_SORT;
};

export const serializeListExplorerSort = (mode: ListExplorerSortMode): string | null =>
  mode === DEFAULT_LIST_EXPLORER_SORT ? null : mode;

/** Post/listing stamp when the API exposes it; otherwise undated for post grouping. */
export const listExplorerCardPostDateIso = (card: DiscoveryCardModel): string | null => {
  const activity = card.activity as { createdAt?: string; updatedAt?: string } | undefined;
  const raw = activity?.createdAt ?? activity?.updatedAt;
  if (raw && /^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  return null;
};

export const listExplorerCardDistanceMeters = (
  card: DiscoveryCardModel,
  viewer: ViewerFix | null
): number | null => {
  if (!viewer || card.mapLatitude == null || card.mapLongitude == null) return null;
  return distanceMeters(viewer, card.mapLatitude, card.mapLongitude);
};

const compareEventDate = (a: DiscoveryCardModel, b: DiscoveryCardModel): number => {
  const left = listExplorerCardDateIso(a) ?? '9999-99-99';
  const right = listExplorerCardDateIso(b) ?? '9999-99-99';
  const byDate = left.localeCompare(right);
  if (byDate !== 0) return byDate;
  return listExplorerCardTitle(a).localeCompare(listExplorerCardTitle(b));
};

const comparePostDate = (a: DiscoveryCardModel, b: DiscoveryCardModel): number => {
  const left = listExplorerCardPostDateIso(a) ?? '9999-99-99';
  const right = listExplorerCardPostDateIso(b) ?? '9999-99-99';
  const byDate = left.localeCompare(right);
  if (byDate !== 0) return byDate;
  return listExplorerCardTitle(a).localeCompare(listExplorerCardTitle(b));
};

const compareName = (a: DiscoveryCardModel, b: DiscoveryCardModel): number =>
  listExplorerCardTitle(a).localeCompare(listExplorerCardTitle(b), undefined, { sensitivity: 'base' });

const compareNear = (
  a: DiscoveryCardModel,
  b: DiscoveryCardModel,
  viewer: ViewerFix | null
): number => {
  const left = listExplorerCardDistanceMeters(a, viewer) ?? Number.POSITIVE_INFINITY;
  const right = listExplorerCardDistanceMeters(b, viewer) ?? Number.POSITIVE_INFINITY;
  if (left !== right) return left - right;
  return compareName(a, b);
};

export const sortListExplorerCards = (
  cards: DiscoveryCardModel[],
  mode: ListExplorerSortMode,
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

/** Merge first letters into a few sections sized to the current result set. */
const buildNameLetterGroups = (
  cards: DiscoveryCardModel[]
): Array<{ key: string; label: string; letters: Set<string> }> => {
  const letterCounts = new Map<string, number>();
  for (const card of cards) {
    const letter = nameFirstLetter(listExplorerCardTitle(card));
    letterCounts.set(letter, (letterCounts.get(letter) ?? 0) + 1);
  }
  const letters = [...letterCounts.keys()].sort((a, b) => {
    if (a === '#') return 1;
    if (b === '#') return -1;
    return a.localeCompare(b);
  });
  if (letters.length === 0) return [];

  type Bucket = { letters: string[]; count: number };
  let buckets: Bucket[] = letters.map((letter) => ({
    letters: [letter],
    count: letterCounts.get(letter)!,
  }));

  while (buckets.length > 6) {
    let mergeAt = 0;
    let smallestPair = Number.POSITIVE_INFINITY;
    for (let index = 0; index < buckets.length - 1; index += 1) {
      const pairSize = buckets[index]!.count + buckets[index + 1]!.count;
      if (pairSize < smallestPair) {
        smallestPair = pairSize;
        mergeAt = index;
      }
    }
    const left = buckets[mergeAt]!;
    const right = buckets[mergeAt + 1]!;
    buckets = [
      ...buckets.slice(0, mergeAt),
      { letters: [...left.letters, ...right.letters], count: left.count + right.count },
      ...buckets.slice(mergeAt + 2),
    ];
  }

  return buckets.map((group) => ({
    key: group.letters.join('-'),
    label: nameGroupLabel(group.letters),
    letters: new Set(group.letters),
  }));
};

const groupByName = (cards: DiscoveryCardModel[], desc: boolean): ListExplorerDateSection[] => {
  const letterGroups = buildNameLetterGroups(cards);
  const sections = letterGroups.map((group) => {
    const groupCards = cards.filter((card) =>
      group.letters.has(nameFirstLetter(listExplorerCardTitle(card)))
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
): ListExplorerDateSection[] => {
  const buckets = new Map<string, ListExplorerDateSection & { order: number }>();
  for (const card of cards) {
    const meters = listExplorerCardDistanceMeters(card, viewer);
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

const relabelPostDateSection = (section: ListExplorerDateSection): ListExplorerDateSection => {
  const { key, label } = section;
  if (key === 'all' || key === 'anytime') {
    return { ...section, label: 'No post date' };
  }
  switch (key) {
    case 'today':
      return { ...section, label: 'Posted today' };
    case 'week':
      return { ...section, label: 'Posted this week' };
    case 'month':
      return { ...section, label: 'Posted this month' };
    default:
      if (key.startsWith('month-') && label) {
        return { ...section, label: `Posted in ${label}` };
      }
      if (key.startsWith('year-') && label) {
        return { ...section, label: `Posted in ${label}` };
      }
      return section;
  }
};

const groupByPostDate = (
  cards: DiscoveryCardModel[],
  desc: boolean,
  now: Date
): ListExplorerDateSection[] => {
  const sections = groupListExplorerByIso(cards, listExplorerCardPostDateIso, now)
    .map(relabelPostDateSection)
    .map((section) => ({
      ...section,
      cards: [...section.cards].sort(desc ? (a, b) => comparePostDate(b, a) : comparePostDate),
    }));
  if (desc) sections.reverse();
  return sections;
};

/** Section headers for the active sort (default = event date ascending). */
export const groupListExplorerSections = (
  cards: DiscoveryCardModel[],
  mode: ListExplorerSortMode,
  viewer: ViewerFix | null,
  now: Date = new Date()
): ListExplorerDateSection[] => {
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
      const sections = groupListExplorerDateSections(cards, now);
      return sections
        .map((section) => ({
          ...section,
          cards: [...section.cards].sort((a, b) => compareEventDate(b, a)),
        }))
        .reverse();
    }
    case 'event_asc':
    default:
      return groupListExplorerDateSections(cards, now);
  }
};

export const listExplorerSortUsesViewerLocation = (mode: ListExplorerSortMode): boolean =>
  mode === 'near_me';

export const listExplorerSortShowsDistance = (mode: ListExplorerSortMode): boolean =>
  mode === 'near_me';

/** @deprecated Prefer `listExplorerSortButtonLabel` for UI. */
export const listExplorerSortLabel = (mode: ListExplorerSortMode): string =>
  listExplorerSortButtonLabel(mode);
