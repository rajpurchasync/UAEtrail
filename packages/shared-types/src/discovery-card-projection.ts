import {
  exploreMapItemIsAvailabilityCatalog,
  exploreMapItemIsRetiredSeekingActivity,
} from './explore-activity-mode.js';
import { buildDiscoveryCardPresentation, isGeographyMapSource } from './explore-presentation.js';
import type { DiscoveryCardKind, DiscoveryCardSource } from './explore-presentation.js';
import type { DiscoveryCardPresentationDTO } from './explore-presentation.js';
import type { DiscoveryCardBuildInput } from './explore-presentation.js';

/** Map/list wire row — structural subset of explore map DTO (avoids importing `index.ts`). */
export type DiscoveryMapItemWire = DiscoveryCardBuildInput & {
  path: string;
  image?: string | null;
  presentation?: DiscoveryCardPresentationDTO;
  locationCard?: { id?: string; images?: string[] } | null;
  destinationSlug?: string | null;
  merchantId?: string;
  tenantId?: string | null;
  activity?: DiscoveryCardBuildInput['activity'] & {
    id?: string;
    joinMode?: string;
    bannerUrl?: string | null;
    images?: string[];
    locationId?: string | null;
    tenantId?: string | null;
    hostUserId?: string | null;
    requirements?: string[] | null;
  };
};

/** Stable identity for discovery surfaces (peek, list row, poster). */
export type DiscoveryCardEntityRef =
  | { kind: 'activity'; activityId: string }
  | { kind: 'place'; locationId: string }
  | { kind: 'shop'; merchantId?: string | null; tenantId?: string | null }
  | { kind: 'destination'; destinationSlug: string }
  | { kind: 'person'; userId: string };

/** Slim read model for discovery UI — no embedded `ActivityDTO`. */
export type DiscoveryCardProjection = {
  entityRef: DiscoveryCardEntityRef;
  path: string;
  sharePath: string;
  source: DiscoveryCardSource;
  kind: DiscoveryCardKind;
  headline: string;
  listTitle: string;
  subtitle: string | null;
  primaryCta: string;
  imageUrl: string | null;
  requirementChips: string[];
};

const resolveCoverImageUrl = (item: DiscoveryMapItemWire): string | null =>
  item.locationCard?.images?.[0] ??
  item.image ??
  item.activity?.bannerUrl ??
  item.activity?.images?.[0] ??
  null;

export const resolveDiscoveryCardEntityRef = (item: DiscoveryMapItemWire): DiscoveryCardEntityRef => {
  const destinationSlug = item.destinationSlug?.trim();
  if ((item.kind === 'destination' || item.id.startsWith('destination:')) && destinationSlug) {
    return { kind: 'destination', destinationSlug };
  }
  if (item.source === 'shop' || item.source === 'agency') {
    return {
      kind: 'shop',
      merchantId: item.merchantId ?? null,
      tenantId: item.tenantId ?? item.activity?.tenantId ?? null,
    };
  }
  if (isGeographyMapSource(item.source)) {
    const locationId = item.locationCard?.id ?? item.activity?.locationId;
    if (locationId) return { kind: 'place', locationId };
  }
  if (exploreMapItemIsAvailabilityCatalog(item)) {
    const userId =
      item.featuredPerson?.userId ?? item.activity?.hostUserId ?? null;
    if (userId) return { kind: 'person', userId };
  }
  if (item.source === 'activity' && !exploreMapItemIsRetiredSeekingActivity(item)) {
    const activityId = item.activity?.id ?? null;
    if (activityId) return { kind: 'activity', activityId };
  }
  if (item.source === 'activity' && item.activity?.id) {
    return { kind: 'activity', activityId: item.activity.id };
  }
  const userId =
    item.featuredPerson?.userId ?? item.activity?.hostUserId ?? null;
  if (userId) return { kind: 'person', userId };
  if (item.locationCard?.id) return { kind: 'place', locationId: item.locationCard.id };
  return { kind: 'activity', activityId: item.id.replace(/^activity:/, '') };
};

export type BuildDiscoveryCardProjectionOptions = {
  sharePath?: string;
  requirementChips?: string[];
};

/** Build slim discovery projection from a map wire item (server or client). */
export const buildDiscoveryCardProjectionFromMapItem = (
  item: DiscoveryMapItemWire,
  options: BuildDiscoveryCardProjectionOptions = {}
): DiscoveryCardProjection => {
  const presentation = item.presentation ?? buildDiscoveryCardPresentation(item);
  const availability = exploreMapItemIsAvailabilityCatalog(item);
  const sharePath =
    options.sharePath ??
    (item.activity?.joinMode === 'private' && item.activity.id
      ? `/activity/${item.activity.id}`
      : item.path);

  const requirementChips =
    options.requirementChips ??
    (availability ? ['Available'] : item.activity?.requirements?.slice(0, 4) ?? []);

  return {
    entityRef: resolveDiscoveryCardEntityRef(item),
    path: item.path,
    sharePath,
    source: presentation.source,
    kind: presentation.kind,
    headline: presentation.headline,
    listTitle: presentation.listTitle,
    subtitle: presentation.subtitle,
    primaryCta: presentation.primaryCta,
    imageUrl: resolveCoverImageUrl(item),
    requirementChips,
  };
};
