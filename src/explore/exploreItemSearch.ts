import {
  exploreGeoQueryTokens,
  exploreMapItemIsAvailabilityCatalog,
  geoRefMatchesQuery,
  isTimeBoundExploreMapItem,
  type ExploreMapItemDTO,
} from '@uaetrail/shared-types';
import { EXPLORE_REGION_PILL_LABELS } from '../config/regions';
import { isGeographyMapSource } from '@uaetrail/shared-types';
import { EXPLORE_EMIRATE_REGION_ALIASES } from '../config/exploreRegionAliases';
import {
  exploreItemRegionTexts,
  normalizeVenueRegionToken,
} from '../utils/venueRegionFilter';
import { OUTING_TOPIC_PILLS } from './exploreOutingTopic';
import { OTHERS_SUBTYPE_PILLS } from './exploreOthersSubtype';
import { EXPLORE_SEARCH_SCOPE_COPY } from './exploreBrowseTaxonomy';

const REGION_ALIASES = EXPLORE_EMIRATE_REGION_ALIASES;

const regionTokensForKey = (regionKey: string): string[] => {
  const aliases = REGION_ALIASES[regionKey] ?? [normalizeVenueRegionToken(regionKey)];
  const tokens = new Set(aliases.map(normalizeVenueRegionToken));
  const label = EXPLORE_REGION_PILL_LABELS[regionKey];
  if (label) tokens.add(normalizeVenueRegionToken(label));
  tokens.add(normalizeVenueRegionToken(regionKey));
  return [...tokens];
};

const resolveRegionKey = (raw: string | null | undefined): string | null => {
  if (!raw?.trim()) return null;
  const normalized = normalizeVenueRegionToken(raw);
  for (const key of Object.keys(REGION_ALIASES)) {
    if (regionTokensForKey(key).some((token) => normalized === token || normalized.includes(token) || token.includes(normalized))) {
      return key;
    }
  }
  if (EXPLORE_REGION_PILL_LABELS[raw.trim()]) return raw.trim();
  if (REGION_ALIASES[raw.trim()]) return raw.trim();
  return raw.trim();
};

const collectItemRegionKeys = (item: ExploreMapItemDTO): Set<string> => {
  const keys = new Set<string>();
  for (const raw of exploreItemRegionTexts(item)) {
    const key = resolveRegionKey(raw);
    if (key) keys.add(key);
  }
  return keys;
};

export const normalizeExploreSearchText = (value: string): string =>
  value.trim().toLowerCase().replace(/\s+/g, ' ');

const push = (parts: string[], value: string | null | undefined) => {
  const trimmed = value?.trim();
  if (trimmed) parts.push(trimmed);
};

const pushMany = (parts: string[], values: Array<string | null | undefined>) => {
  for (const value of values) push(parts, value);
};

/** Consumer filter / pill / scope vocabulary tied to this pin. */
const exploreItemCategorySearchTerms = (item: ExploreMapItemDTO): string[] => {
  const terms: string[] = [];
  push(terms, item.kind);
  push(terms, item.source);
  push(terms, item.outingCategory ?? undefined);
  push(terms, item.outingTopic ?? undefined);
  push(terms, item.activity?.activityType);
  push(terms, item.participationMode ?? undefined);

  if (isTimeBoundExploreMapItem(item)) {
    terms.push('trip', 'trips', 'outing', 'outings', 'activity', 'activities');
    push(terms, EXPLORE_SEARCH_SCOPE_COPY.activities.label);
  }
  if (exploreMapItemIsAvailabilityCatalog(item)) {
    terms.push('availability', 'intent', 'looking for', 'looking', 'crew', 'friends', 'people', 'person');
    push(terms, EXPLORE_SEARCH_SCOPE_COPY.people.label);
  }
  if (isGeographyMapSource(item.source)) {
    terms.push('spot', 'spots', 'place', 'places', 'trail', 'trails', 'venue');
    push(terms, EXPLORE_SEARCH_SCOPE_COPY.places.label);
  }
  if (item.source === 'shop' || item.kind === 'shop') {
    terms.push('shop', 'shops', 'gear');
    push(terms, EXPLORE_SEARCH_SCOPE_COPY.shops.label);
  }
  if (
    item.source === 'activity' &&
    item.activityMode !== 'seeking' &&
    item.activity?.publishingProfileKind === 'agency'
  ) {
    terms.push('agency', 'agencies', 'operator', 'operators', 'tour');
    push(terms, EXPLORE_SEARCH_SCOPE_COPY.agencies.label);
  }
  if (
    item.source === 'activity' &&
    item.activity?.publishingProfileKind === 'pro_guide'
  ) {
    terms.push('professional', 'guide', 'guides');
    push(terms, EXPLORE_SEARCH_SCOPE_COPY.people.label);
  }

  switch (item.kind) {
    case 'hiking':
      terms.push('hiking', 'hike', 'hikes', 'trail', 'trails');
      break;
    case 'camping':
      terms.push('camping', 'camp', 'camps');
      break;
    case 'rideshare':
      terms.push('rideshare', 'rideshare', 'ride share', 'ride');
      break;
    case 'event':
      terms.push('event', 'events');
      break;
    case 'shop':
      terms.push('shop', 'shops');
      break;
    default:
      break;
  }

  if (item.outingTopic) {
    const pill = OUTING_TOPIC_PILLS.find((entry) => entry.key === item.outingTopic);
    if (pill) push(terms, pill.label);
  }

  for (const pill of OTHERS_SUBTYPE_PILLS) {
    if (item.outingCategory === pill.key) push(terms, pill.label);
  }
  if (item.outingCategory === 'events') terms.push('events', 'event');
  if (item.outingCategory === 'activities') terms.push('activities', 'activity', 'others');

  return terms;
};

const exploreItemRegionSearchTerms = (item: ExploreMapItemDTO): string[] => {
  const terms: string[] = [];
  for (const key of collectItemRegionKeys(item)) {
    terms.push(...regionTokensForKey(key));
    push(terms, EXPLORE_REGION_PILL_LABELS[key] ?? key);
  }
  return terms;
};

/** Flattened searchable text for an explore map/list row. */
export const exploreItemSearchHaystack = (item: ExploreMapItemDTO): string => {
  const parts: string[] = [];

  pushMany(parts, [
    item.title,
    item.subtitle,
    item.about,
    item.fromLabel,
    item.toLabel,
    item.featuredPerson?.displayName,
    item.priceDisplay,
    item.destinationSlug,
    item.destinationName,
    item.placeHubLabel,
    item.geoRef?.names.country,
    item.geoRef?.names.state,
    item.geoRef?.names.area,
    item.geoRef?.names.venue,
    item.geoRef?.path,
  ]);

  const activity = item.activity;
  if (activity) {
    pushMany(parts, [
      activity.title,
      activity.description,
      activity.locationName,
      activity.region,
      activity.geoRef?.names.country,
      activity.geoRef?.names.state,
      activity.geoRef?.names.area,
      activity.geoRef?.names.venue,
      activity.meetingPoint,
      activity.startPoint,
      activity.parkingPoint,
      activity.tenantName,
      activity.hostName,
      activity.hostBio,
      activity.paymentTerms,
      activity.rideshareDetails,
      activity.createdByName,
    ]);
    if (activity.requirements?.length) parts.push(activity.requirements.join(' '));
    if (activity.itinerary?.length) parts.push(activity.itinerary.join(' '));
    if (activity.itinerarySteps?.length) {
      parts.push(activity.itinerarySteps.map((s) => [s.title, s.note, s.at].filter(Boolean).join(' ')).join(' '));
    }
  }

  const card = item.locationCard;
  if (card) {
    pushMany(parts, [
      card.region,
      card.description,
      card.difficulty,
      card.accessibility,
      card.campingType,
    ]);
    if (card.season.length) parts.push(card.season.join(' '));
    if (card.surfaceType?.length) parts.push(card.surfaceType.join(' '));
  }

  const presentation = item.presentation;
  if (presentation) {
    pushMany(parts, [
      presentation.headline,
      presentation.listTitle,
      presentation.listHost,
      presentation.subtitle,
      presentation.venueHint,
      presentation.routeLabel,
      presentation.whenLabel,
      presentation.shareText,
      presentation.spotsLabel,
    ]);
  }

  parts.push(...exploreItemCategorySearchTerms(item));
  parts.push(...exploreItemRegionSearchTerms(item));

  return normalizeExploreSearchText(parts.join(' '));
};

const queryMatchesKnownRegion = (query: string): string[] => {
  const matchedKeys: string[] = [];
  for (const key of Object.keys(REGION_ALIASES)) {
    if (regionTokensForKey(key).some((token) => query === token || query.includes(token) || token.includes(query))) {
      matchedKeys.push(key);
    }
  }
  return matchedKeys;
};

const exploreQueryMatchesItemRegions = (item: ExploreMapItemDTO, query: string): boolean => {
  const itemKeys = collectItemRegionKeys(item);
  if (itemKeys.size === 0) return false;

  for (const key of queryMatchesKnownRegion(query)) {
    if (itemKeys.has(key)) return true;
  }

  for (const key of itemKeys) {
    if (regionTokensForKey(key).some((token) => query === token || query.includes(token) || token.includes(query))) {
      return true;
    }
  }

  return false;
};

const itemGeoRef = (item: ExploreMapItemDTO) =>
  item.geoRef ?? item.activity?.geoRef ?? null;

const EXPLORE_SEARCH_QUERY_STOPWORDS = new Set([
  'united',
  'arab',
  'emirates',
  'the',
  'and',
  'uae',
]);

const exploreItemMatchesQueryToken = (item: ExploreMapItemDTO, token: string): boolean => {
  const ref = itemGeoRef(item);
  if (ref && geoRefMatchesQuery(ref, token)) return true;
  const haystack = exploreItemSearchHaystack(item);
  if (haystack.includes(token)) return true;
  return exploreQueryMatchesItemRegions(item, token);
};

export const exploreItemMatchesQuery = (item: ExploreMapItemDTO, query: string): boolean => {
  const q = normalizeExploreSearchText(query);
  if (!q) return true;
  if (exploreItemMatchesQueryToken(item, q)) return true;

  const tokens = exploreGeoQueryTokens(q).filter((token) => !EXPLORE_SEARCH_QUERY_STOPWORDS.has(token));
  if (tokens.length === 0) return false;
  return tokens.some((token) => exploreItemMatchesQueryToken(item, token));
};
