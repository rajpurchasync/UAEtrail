/** Public venue kinds that map to place detail routes. */
export type PlaceVenueKind = 'hiking' | 'camping' | 'event' | 'shop';

export type EntityKind = 'place' | 'activity' | 'organisation' | 'shop' | 'person';

export type EntityRef =
  | { kind: 'place'; id: string; activityType: string }
  | { kind: 'activity'; id: string }
  | { kind: 'organisation'; slug: string }
  | { kind: 'shop'; id?: string | null; merchantId?: string | null; slug?: string | null }
  | { kind: 'person'; userId: string };

/** Default explore map target when a shop has no public id yet. */
export const EXPLORE_SHOPS_PATH = '/explore?filter=shops&panel=shops';

/** Explore map with shop list panel open (API explore-map fallback). */
export const EXPLORE_SHOPS_LIST_PATH = '/explore?filter=shops&panel=shops&list=1';

/** Normalise trail / camp / event activity type strings. */
export const normalizePlaceActivityType = (activityType: string): PlaceVenueKind => {
  const kind = activityType.toLowerCase();
  if (kind === 'shop') return 'shop';
  if (kind === 'camping') return 'camping';
  if (kind === 'event' || kind === 'community_activity') return 'event';
  return 'hiking';
};

/** Public URL for a place (trail, camp, or event venue). */
export const placeDetailPath = (activityType: string, placeId: string): string => {
  const kind = normalizePlaceActivityType(activityType);
  if (kind === 'shop') return `/shop/${placeId}`;
  if (kind === 'camping') return `/camp/${placeId}`;
  if (kind === 'event') return `/event/${placeId}`;
  return `/trail/${placeId}`;
};

export const activityDetailPath = (activityId: string): string => `/activity/${activityId}`;

/** Deep link from `activity_join_invite` notifications — nudges join on activity detail. */
export const activityDetailInvitePath = (activityId: string): string =>
  `${activityDetailPath(activityId)}?invite=1`;

/** Opens explore map peek with join-invite banner (`pin=activity:{id}&invite=1`). */
export const exploreActivityInvitePath = (activityId: string): string =>
  `/explore?pin=activity:${activityId}&invite=1&list=1`;

/** Public organisation profile URL (tenant slug). */
export const organisationProfilePath = (tenantSlug?: string | null): string | null =>
  tenantSlug ? `/operator/${tenantSlug}` : null;

/** Member profile for individuals without a public operator page. */
export const memberProfilePath = (userId?: string | null): string | null =>
  userId ? `/member/${userId}` : null;

/** Prefer operator page; fall back to member profile when no tenant slug. */
export const resolveOrganisationProfilePath = (opts: {
  tenantSlug?: string | null;
  hostUserId?: string | null;
}): string | null => organisationProfilePath(opts.tenantSlug) ?? memberProfilePath(opts.hostUserId);

/** Canonical public URL for a gear shop (merchant id or tenant slug). */
export const shopPublicPath = (
  input: { merchantId?: string | null; slug?: string | null; id?: string | null },
  fallback: string = EXPLORE_SHOPS_PATH
): string => {
  const key = input.merchantId?.trim() || input.slug?.trim() || input.id?.trim();
  if (!key) return fallback;
  return `/shop/${encodeURIComponent(key)}`;
};

export type ResolveEntityPathOptions = {
  shopFallback?: string;
  /** Used when organisation slug or person id is missing. */
  missingFallback?: string;
};

/** Resolve a canonical public path for any supported entity ref. */
export const resolveEntityPath = (ref: EntityRef, options?: ResolveEntityPathOptions): string => {
  const missingFallback = options?.missingFallback ?? '/explore';

  switch (ref.kind) {
    case 'place':
      return placeDetailPath(ref.activityType, ref.id);
    case 'activity':
      return activityDetailPath(ref.id);
    case 'organisation': {
      const path = organisationProfilePath(ref.slug);
      return path ?? missingFallback;
    }
    case 'shop':
      return shopPublicPath(
        { merchantId: ref.merchantId, slug: ref.slug, id: ref.id },
        options?.shopFallback ?? EXPLORE_SHOPS_PATH
      );
    case 'person': {
      const path = memberProfilePath(ref.userId);
      return path ?? missingFallback;
    }
    default: {
      const _exhaustive: never = ref;
      return _exhaustive;
    }
  }
};

const PLACE_PATH_RE = /^\/(trail|camp|event)\/([^/?#]+)/;
const ACTIVITY_PATH_RE = /^\/activity\/([^/?#]+)/;
const OPERATOR_PATH_RE = /^\/operator\/([^/?#]+)/;
const SHOP_PATH_RE = /^\/shop\/([^/?#]+)/;
const MEMBER_PATH_RE = /^\/member\/([^/?#]+)/;

/** Parse a browser pathname into an entity ref when it matches a public detail route. */
export const parseEntityRefFromPathname = (pathname: string): EntityRef | null => {
  const path = pathname.split('?')[0]?.split('#')[0] ?? pathname;

  const placeMatch = path.match(PLACE_PATH_RE);
  if (placeMatch) {
    const segment = placeMatch[1];
    const id = decodeURIComponent(placeMatch[2]);
    const activityType =
      segment === 'camp' ? 'camping' : segment === 'event' ? 'event' : 'hiking';
    return { kind: 'place', id, activityType };
  }

  const activityMatch = path.match(ACTIVITY_PATH_RE);
  if (activityMatch) {
    return { kind: 'activity', id: decodeURIComponent(activityMatch[1]) };
  }

  const operatorMatch = path.match(OPERATOR_PATH_RE);
  if (operatorMatch) {
    return { kind: 'organisation', slug: decodeURIComponent(operatorMatch[1]) };
  }

  const shopMatch = path.match(SHOP_PATH_RE);
  if (shopMatch) {
    const id = decodeURIComponent(shopMatch[1]);
    return { kind: 'shop', id, merchantId: id, slug: id };
  }

  const memberMatch = path.match(MEMBER_PATH_RE);
  if (memberMatch) {
    return { kind: 'person', userId: decodeURIComponent(memberMatch[1]) };
  }

  return null;
};
