import type { PublishingProfileKind } from './publishing-profile-kind.js';
import { canonicalizeNotificationBookmarkPath } from './notification-bookmark-path.js';

/** Public venue kinds that map to place detail routes. */
export type PlaceVenueKind = 'hiking' | 'camping' | 'event' | 'shop';

export type EntityKind = 'place' | 'activity' | 'organisation' | 'shop' | 'person';

export type EntityRef =
  | { kind: 'place'; id: string; activityType: string }
  | { kind: 'activity'; id: string }
  | {
      kind: 'organisation';
      slug: string;
      /** Agency · partner — required for canonical URLs when known. */
      brandProfileKind?: PublishingProfileKind;
    }
  | { kind: 'shop'; id?: string | null; merchantId?: string | null; slug?: string | null }
  | { kind: 'person'; userId: string };

export const AGENCY_PROFILE_PATH_PREFIX = '/agency' as const;
export const PARTNER_PROFILE_PATH_PREFIX = '/partner' as const;

/** Default explore map target when a shop has no public id yet. */
export const EXPLORE_SHOPS_PATH = '/explore?filter=shops&panel=shops';

/** Explore map with shop list panel open (API explore-map fallback). */
export const EXPLORE_SHOPS_LIST_PATH = '/explore?filter=shops&panel=shops&list=1';

/** Canonical public place detail (trail, camp, event venue — not shop). */
export const PLACE_CANONICAL_PATH_PREFIX = '/place' as const;

export const canonicalPlaceDetailPath = (placeId: string): string =>
  `${PLACE_CANONICAL_PATH_PREFIX}/${encodeURIComponent(placeId)}`;

/** Public URL segment for event-type **places** (venues), not scheduled activities. */
export const VENUE_PLACE_PATH_PREFIX = '/venue' as const;

/** Inbound bookmark — venue places canonicalize to {@link VENUE_PLACE_PATH_PREFIX}. */
export const INBOUND_EVENT_VENUE_PATH_PREFIX = '/event' as const;

/** Normalise trail / camp / event activity type strings. */
export const normalizePlaceActivityType = (activityType: string): PlaceVenueKind => {
  const kind = activityType.toLowerCase();
  if (kind === 'shop') return 'shop';
  if (kind === 'camping') return 'camping';
  if (kind === 'event' || kind === 'community_activity') return 'event';
  return 'hiking';
};

/**
 * Legacy inbound segments (`/trail`, `/camp`) for parse/migration only.
 * Product links must use {@link placeDetailPath} → `/place/:id` or `/venue/:id`.
 */
export const inboundKindPlaceDetailPath = (activityType: string, placeId: string): string => {
  const kind = normalizePlaceActivityType(activityType);
  if (kind === 'shop') return `/shop/${encodeURIComponent(placeId)}`;
  if (kind === 'camping') return `/camp/${encodeURIComponent(placeId)}`;
  if (kind === 'event') return `${VENUE_PLACE_PATH_PREFIX}/${encodeURIComponent(placeId)}`;
  return `/trail/${encodeURIComponent(placeId)}`;
};

/** Public URL for a place (trail, camp, or event venue). Event venues use `/venue/:id`; `/place/:id` still serves all kinds. */
export const placeDetailPath = (activityType: string, placeId: string): string => {
  const kind = normalizePlaceActivityType(activityType);
  if (kind === 'shop') return `/shop/${encodeURIComponent(placeId)}`;
  if (kind === 'event') return inboundKindPlaceDetailPath('event', placeId);
  return canonicalPlaceDetailPath(placeId);
};

/**
 * Place detail URL from a place id.
 * Pass the **place's** `activityType` when known. Never pass an outing/activity type —
 * if the place type is unknown, use `/place/:id` (canonical page resolves kind from the API).
 */
export const placeDetailPathForId = (
  placeId: string,
  placeActivityType?: string | null
): string => {
  const id = placeId.trim();
  if (!id) return PLACE_CANONICAL_PATH_PREFIX;
  const known = placeActivityType?.trim();
  if (known) return placeDetailPath(known, id);
  return canonicalPlaceDetailPath(id);
};

const splitPathSearchHash = (raw: string) => {
  const hashIndex = raw.indexOf('#');
  const withoutHash = hashIndex >= 0 ? raw.slice(0, hashIndex) : raw;
  const hash = hashIndex >= 0 ? raw.slice(hashIndex) : '';
  const queryIndex = withoutHash.indexOf('?');
  const pathname = queryIndex === -1 ? withoutHash : withoutHash.slice(0, queryIndex);
  const search = queryIndex === -1 ? '' : withoutHash.slice(queryIndex);
  return { pathname, search, hash };
};

const joinPath = (pathname: string, search: string, hash: string) => `${pathname}${search}${hash}`;

const STALE_TRAIL_PATH_RE = /^\/trail\/([^/?#]+)\/?$/;
const STALE_CAMP_PATH_RE = /^\/camp\/([^/?#]+)\/?$/;
const STALE_EVENT_VENUE_PATH_RE = /^\/event\/([^/?#]+)\/?$/;

/** `/trail/:id` · `/camp/:id` · `/event/:id` → canonical place/venue URLs (preserve query/hash). */
export const rewriteStaleEntityInboundPath = (raw: string): string | null => {
  if (!raw.startsWith('/')) return null;

  const { pathname, search, hash } = splitPathSearchHash(raw);
  const trail = pathname.match(STALE_TRAIL_PATH_RE);
  if (trail) {
    return joinPath(
      canonicalPlaceDetailPath(decodeURIComponent(trail[1])),
      search,
      hash
    );
  }
  const camp = pathname.match(STALE_CAMP_PATH_RE);
  if (camp) {
    return joinPath(
      canonicalPlaceDetailPath(decodeURIComponent(camp[1])),
      search,
      hash
    );
  }
  const eventVenue = pathname.match(STALE_EVENT_VENUE_PATH_RE);
  if (eventVenue) {
    const id = decodeURIComponent(eventVenue[1]);
    return joinPath(`${VENUE_PLACE_PATH_PREFIX}/${encodeURIComponent(id)}`, search, hash);
  }
  return null;
};

/** Single inbound choke: entity aliases, then hub/console bookmark canonicalize. */
export const canonicalizeInboundProductPath = (raw: string): string => {
  const entity = rewriteStaleEntityInboundPath(raw);
  return canonicalizeNotificationBookmarkPath(entity ?? raw);
};

/** Public URL for a facility amenity row (Program CPC). */
export const facilityDetailPath = (facilityId: string): string => `/facility/${facilityId}`;

export const activityDetailPath = (activityId: string): string => `/activity/${activityId}`;

/** Host roster and crew “who’s going” list. The outing page stays a summary. */
export const activityCrewPath = (activityId: string): string =>
  `${activityDetailPath(activityId)}/crew`;

/** Deep link from `activity_join_invite` notifications — nudges join on activity detail. */
export const activityDetailInvitePath = (activityId: string): string =>
  `${activityDetailPath(activityId)}?invite=1`;

/** Opens explore map peek with join-invite banner (`pin=activity:{id}&invite=1`). */
export const exploreActivityInvitePath = (activityId: string): string =>
  `/explore?pin=activity:${activityId}&invite=1&list=1`;

/** Canonical public URL for a gear shop (merchant id or tenant slug). */
export const shopPublicPath = (
  input: { merchantId?: string | null; slug?: string | null; id?: string | null },
  fallback: string = EXPLORE_SHOPS_PATH
): string => {
  const key = input.merchantId?.trim() || input.slug?.trim() || input.id?.trim();
  if (!key) return fallback;
  return `/shop/${encodeURIComponent(key)}`;
};

/**
 * Public **business** storefront URL (agency · shop · partner).
 * Community and individual Pro (`pro_guide`) have no brand page — use
 * {@link memberProfilePath} / {@link resolveActivityPublisherProfilePath}.
 */
export const hostBrandProfilePath = (
  tenantSlug?: string | null,
  kind: PublishingProfileKind = 'pro_guide'
): string | null => {
  const slug = tenantSlug?.trim();
  if (!slug) return null;
  if (kind === 'shop' || kind === 'ecommerce') return shopPublicPath({ slug });
  if (kind === 'agency' || kind === 'hospitality') return `${AGENCY_PROFILE_PATH_PREFIX}/${encodeURIComponent(slug)}`;
  if (kind === 'partner') return `${PARTNER_PROFILE_PATH_PREFIX}/${encodeURIComponent(slug)}`;
  return null;
};

export const agencyProfilePath = (tenantSlug?: string | null): string | null =>
  hostBrandProfilePath(tenantSlug, 'agency');

export const partnerProfilePath = (tenantSlug?: string | null): string | null =>
  hostBrandProfilePath(tenantSlug, 'partner');

/**
 * @deprecated Use {@link hostBrandProfilePath} with {@link PublishingProfileKind}.
 * Individual kinds return null — use {@link memberProfilePath}.
 */
export const organisationProfilePath = (
  tenantSlug?: string | null,
  kind: PublishingProfileKind = 'pro_guide'
): string | null => hostBrandProfilePath(tenantSlug, kind);


/**
 * Where the viewer tapped through from — same {@link memberProfilePath} page layout;
 * drives API discover quota (`discover=1`) and analytics only, not a separate route.
 */
export type MemberProfileBrowseLens =
  | 'organic'
  | 'discover'
  | 'friends'
  | 'available'
  | 'host';

export type MemberProfilePathOptions = {
  /**
   * Directory / quota path — sets `discover=1` (API also accepts `from=discover`).
   * Use for Explore **Connect** directory and `GET /me/member-discovery/browse` row opens.
   */
  discover?: boolean;
  /** Browse entry lens — serialized as `source=` when not `organic`. */
  lens?: MemberProfileBrowseLens;
  /**
   * Owner preview of the public member page (`view=public`).
   * Not a browse lens — same `/member/:id` layout.
   */
  publicPreview?: boolean;
};

/** Member profile for community hosts, buddies, and people browse — one public page. */
export const memberProfilePath = (
  userId?: string | null,
  opts?: MemberProfilePathOptions
): string | null => {
  if (!userId) return null;
  const base = `/member/${userId}`;
  const lens = opts?.lens ?? (opts?.discover ? 'discover' : 'organic');
  const useDiscover = opts?.discover === true || lens === 'discover';
  const params = new URLSearchParams();
  if (useDiscover) {
    params.set('discover', '1');
    params.set('from', 'discover');
  }
  if (lens !== 'organic') {
    params.set('source', lens);
  }
  if (opts?.publicPreview) {
    params.set('view', 'public');
  }
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
};

/** @deprecated Prefer `memberProfilePath(userId, { discover: true, lens: 'discover' })`. */
export const memberDiscoverProfilePath = (userId: string): string =>
  memberProfilePath(userId, { discover: true, lens: 'discover' })!;

/**
 * @deprecated Prefer {@link resolveActivityPublisherProfilePath} for activities.
 * Individuals resolve to `/member/:userId`; businesses use storefront helpers.
 */
export const resolveOrganisationProfilePath = (opts: {
  tenantSlug?: string | null;
  hostUserId?: string | null;
  brandProfileKind?: PublishingProfileKind;
}): string | null => {
  if (opts.brandProfileKind === 'community' || opts.brandProfileKind === 'pro_guide') {
    return memberProfilePath(opts.hostUserId);
  }
  if (opts.brandProfileKind) {
    return hostBrandProfilePath(opts.tenantSlug, opts.brandProfileKind);
  }
  return memberProfilePath(opts.hostUserId) ?? hostBrandProfilePath(opts.tenantSlug, 'agency');
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
      const path = hostBrandProfilePath(ref.slug, ref.brandProfileKind ?? 'pro_guide');
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

const CANONICAL_PLACE_PATH_RE = /^\/place\/([^/?#]+)/;
const PLACE_PATH_RE = /^\/(trail|camp|venue)\/([^/?#]+)/;
const INBOUND_EVENT_VENUE_PATH_RE = /^\/event\/([^/?#]+)/;
const ACTIVITY_PATH_RE = /^\/activity\/([^/?#]+)/;
const AGENCY_PROFILE_PATH_RE = /^\/agency\/([^/?#]+)/;
const PARTNER_PROFILE_PATH_RE = /^\/partner\/([^/?#]+)/;
const SHOP_PATH_RE = /^\/shop\/([^/?#]+)/;
const MEMBER_PATH_RE = /^\/member\/([^/?#]+)/;

const parseOrganisationRef = (
  slug: string,
  brandProfileKind: PublishingProfileKind
): EntityRef => ({ kind: 'organisation', slug, brandProfileKind });

/** Parse a browser pathname into an entity ref when it matches a public detail route. */
export const parseEntityRefFromPathname = (pathname: string): EntityRef | null => {
  const path = pathname.split('?')[0]?.split('#')[0] ?? pathname;

  const canonicalPlaceMatch = path.match(CANONICAL_PLACE_PATH_RE);
  if (canonicalPlaceMatch) {
    return {
      kind: 'place',
      id: decodeURIComponent(canonicalPlaceMatch[1]),
      activityType: 'hiking',
    };
  }

  const placeMatch = path.match(PLACE_PATH_RE);
  if (placeMatch) {
    const segment = placeMatch[1];
    const id = decodeURIComponent(placeMatch[2]);
    const activityType = segment === 'camp' ? 'camping' : segment === 'venue' ? 'event' : 'hiking';
    return { kind: 'place', id, activityType };
  }

  const inboundEventVenueMatch = path.match(INBOUND_EVENT_VENUE_PATH_RE);
  if (inboundEventVenueMatch) {
    return {
      kind: 'place',
      id: decodeURIComponent(inboundEventVenueMatch[1]),
      activityType: 'event',
    };
  }

  const activityMatch = path.match(ACTIVITY_PATH_RE);
  if (activityMatch) {
    return { kind: 'activity', id: decodeURIComponent(activityMatch[1]) };
  }

  const agencyMatch = path.match(AGENCY_PROFILE_PATH_RE);
  if (agencyMatch) {
    return parseOrganisationRef(decodeURIComponent(agencyMatch[1]), 'agency');
  }

  const partnerMatch = path.match(PARTNER_PROFILE_PATH_RE);
  if (partnerMatch) {
    return parseOrganisationRef(decodeURIComponent(partnerMatch[1]), 'partner');
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
