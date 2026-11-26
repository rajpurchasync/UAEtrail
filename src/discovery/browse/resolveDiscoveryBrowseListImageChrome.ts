import type { DiscoveryCardModel } from '../discoveryCardModel';
import { isGeographyMapSource } from '@uaetrail/shared-types';
import {
  resolveBrowsePosterActivityTypeLabel,
  resolveListFeedPosterRequirementLabels,
} from '../discoverySessionListPosterPresentation';
import { EXPLORE_RIDESHARE_AVAILABLE_BADGE } from '../discoverySessionExploreRequirementBadges';

const POLICY_CHIP_CAP = 4;

/** Map-enriched chips that belong in the body (logistics / status), not S4 policy on the photo. */
const BROWSE_LIST_NON_POLICY_BADGES = new Set([
  'Easy',
  'Medium',
  'Hard',
  'Moderate',
  '4x4 required',
  'Available',
  'Seeking',
  'Looking for',
  EXPLORE_RIDESHARE_AVAILABLE_BADGE,
  'Rideshare needed',
]);

/** Venue list hero — place catalog voice (trips keep activity badges as-is). */
export const normalizeDiscoveryBrowseListVenuePolicyLabel = (label: string): string => {
  const chip = label.trim();
  if (chip === 'Pets welcome') return 'Pet-friendly';
  return chip;
};

const isBrowseListAudiencePolicyBadge = (badge: string): boolean => {
  const chip = badge.trim();
  if (!chip || BROWSE_LIST_NON_POLICY_BADGES.has(chip)) return false;
  return /^(Child-friendly|Children welcome|Women only|Family only|No pets|Pets welcome|Pet-friendly|No children|Ages )/i.test(
    chip
  );
};

/** Outing / place kind on list thumbnails — Hiking, Camping, Event, etc. */
export const resolveDiscoveryBrowseListTypeLabel = (card: DiscoveryCardModel): string | null => {
  if (card.source === 'shop') return 'Outdoor shop';
  const fromActivity = resolveBrowsePosterActivityTypeLabel(card);
  if (fromActivity) return fromActivity;
  if (card.kind === 'rideshare') return 'Rideshare';
  return null;
};

const resolveGeographyBrowseListPolicyLabels = (card: DiscoveryCardModel): string[] => {
  const labels: string[] = [];
  if (card.childFriendly) labels.push('Child-friendly');
  for (const badge of card.requirementBadges ?? []) {
    const chip = badge.trim();
    if (!chip) continue;
    if (!isBrowseListAudiencePolicyBadge(chip)) continue;
    const normalized = normalizeDiscoveryBrowseListVenuePolicyLabel(chip);
    if (!labels.includes(normalized)) labels.push(normalized);
  }
  return labels.slice(0, POLICY_CHIP_CAP);
};

/** Audience & access pills on the photo — not the card body or engagement footer. */
export const resolveDiscoveryBrowseListPolicyLabels = (card: DiscoveryCardModel): string[] => {
  if (card.source === 'activity') {
    return resolveListFeedPosterRequirementLabels(card).slice(0, POLICY_CHIP_CAP);
  }

  if (isGeographyMapSource(card.source)) {
    return resolveGeographyBrowseListPolicyLabels(card);
  }

  return [];
};

/** Body chip rows — strip anything already on the list hero (trips + venues share resolver). */
export const filterDiscoveryBrowseListBodyFactLabels = (
  labels: string[],
  card: DiscoveryCardModel
): string[] => {
  const onImage = new Set(resolveDiscoveryBrowseListPolicyLabels(card));
  if (onImage.has('Pet-friendly')) onImage.add('Pets welcome');
  return labels.filter((label) => !onImage.has(label.trim()));
};