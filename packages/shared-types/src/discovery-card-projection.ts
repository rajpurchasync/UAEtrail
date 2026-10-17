import { exploreMapItemIsSeeking } from './explore-activity-mode.js';
import { buildExploreCardPresentation, isGeographyMapSource } from './explore-presentation.js';
import type { ExploreCardKind, ExploreCardSource } from './explore-presentation.js';
import type { ExploreCardPresentationDTO } from './explore-presentation.js';
import type { ExplorePresentationBuildInput } from './explore-presentation.js';

/** Map/list wire row — structural subset of explore map DTO (avoids importing `index.ts`). */
export type DiscoveryMapItemWire = ExplorePresentationBuildInput & {
  path: string;
  image?: string | null;
  presentation?: ExploreCardPresentationDTO;
  locationCard?: { id?: string; images?: string[] } | null;
  areaSlug?: string | null;
  merchantId?: string;
  tenantId?: string | null;
  activity?: ExplorePresentationBuildInput['activity'] & {
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
  | { kind: 'area'; areaSlug: string }
  | { kind: 'person'; userId: string };

/** Slim read model for discovery UI — no embedded `ActivityDTO`. */
export type DiscoveryCardProjection = {
  entityRef: DiscoveryCardEntityRef;
  path: string;
  sharePath: string;
  source: ExploreCardSource;
  kind: ExploreCardKind;
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
  if (item.source === 'area' && item.areaSlug) {
    return { kind: 'area', areaSlug: item.areaSlug };
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
  if (exploreMapItemIsSeeking(item) || item.source === 'activity' || item.source === 'demand') {
    const activityId = item.activity?.id ?? null;
    if (activityId) return { kind: 'activity', activityId };
  }
  if (item.source === 'activity' && item.activity?.id) {
    return { kind: 'activity', activityId: item.activity.id };
  }
  const userId =
    item.featuredPerson?.userId ?? item.requesterUserId ?? item.activity?.hostUserId ?? null;
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
  const presentation = item.presentation ?? buildExploreCardPresentation(item);
  const seeking = exploreMapItemIsSeeking(item);
  const sharePath =
    options.sharePath ??
    (item.activity?.joinMode === 'private' && item.activity.id
      ? `/activity/${item.activity.id}`
      : item.path);

  const requirementChips =
    options.requirementChips ??
    (seeking ? ['Seeking'] : item.activity?.requirements?.slice(0, 4) ?? []);

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
