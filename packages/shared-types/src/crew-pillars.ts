/**
 * Crew umbrella — distinct pillars under “who you go with”.
 * Product/UI vocabulary only; wire uses buddy_*, member_group, member_availability, etc.
 *
 * Do not collapse pillars into “buddies” or a single roster API.
 * @see docs/MEMBER_MODEL.md · docs/SYSTEM_COHERENCE.md §3.2
 */

export const CREW_PILLAR_IDS = [
  /** Mutual friend graph — `/me/friends`, friend requests, DM eligibility. */
  'friends',
  /**
   * People tab **Everyone** — connect lane directory (`segment=connect`).
   * Not mutual friends; not Professional (guides_operators).
   */
  'directory',
  /** Private adult teams — `/groups`, `member_group` kind `team` (family / friends / colleagues labels). */
  'teams',
  /**
   * Discoverable clubs (Strava-style) — `community_groups` + `/clubs/:slug`.
   * Not private Teams; not `social_groups` outing chat.
   */
  'communities',
  /**
   * Guides & operators on the people directory — pro profiles, agencies, shops.
   * Separate from intent availability (Guide / hiking / … on `member_availability.kinds`).
   */
  'guides_operators',
  /** Confirmed joiners on one outing — activity Crew tab, `outing_crew` member groups, group chat policy. */
  'outing_roster',
  /**
   * “Looking for crew” / calendar signal — compose `intent:*`, store `member_availability`
   * (open + fixed). Not wishlist; not hosted Activity.
   */
  'intent_signal',
] as const;

export type CrewPillarId = (typeof CREW_PILLAR_IDS)[number];

export type CrewPillarBoundedContext =
  | 'social_graph'
  | 'member_discovery'
  | 'member_identity'
  | 'communication'
  | 'participation'
  | 'compose'
  | 'engagement';

export type CrewPillarSpec = {
  id: CrewPillarId;
  boundedContexts: readonly CrewPillarBoundedContext[];
  /** Primary member-facing routes (not exhaustive). */
  routes: readonly string[];
  /** Stable wire / storage — BWL; may keep legacy names. */
  wire: readonly string[];
  /** Pillars that must not be merged in UI or new APIs. */
  notSameAs: readonly CrewPillarId[];
};

export const CREW_PILLAR_SPECS: Record<CrewPillarId, CrewPillarSpec> = {
  friends: {
    id: 'friends',
    boundedContexts: ['social_graph', 'communication'],
    routes: ['/crews', '/chat?to='],
    wire: ['/me/friends', '/me/friend-requests', 'segment=friends'],
    notSameAs: ['teams', 'communities', 'outing_roster', 'directory'],
  },
  directory: {
    id: 'directory',
    boundedContexts: ['member_discovery', 'social_graph'],
    routes: ['/list?listCat=people&peopleFacet=everyone'],
    wire: ['GET /me/member-discovery/browse', 'segment=connect', 'peopleFacet=everyone'],
    notSameAs: ['friends', 'guides_operators', 'intent_signal'],
  },
  teams: {
    id: 'teams',
    boundedContexts: ['social_graph', 'communication'],
    routes: ['/groups'],
    wire: ['social_groups', 'member_group.kind=team'],
    notSameAs: ['communities', 'outing_roster', 'friends'],
  },
  communities: {
    id: 'communities',
    boundedContexts: ['social_graph', 'member_discovery'],
    routes: ['/clubs/:slug', '/list?listCat=people&peopleTab=community'],
    wire: [
      'community_groups',
      'GET /explore/communities',
      'POST /me/communities',
      'VITE_COMMUNITY_DISCOVER',
    ],
    notSameAs: ['teams', 'friends'],
  },
  guides_operators: {
    id: 'guides_operators',
    boundedContexts: ['member_discovery', 'member_identity'],
    routes: ['/member/:userId', '/agency/:slug', '/shop/:id'],
    wire: [
      'profileRoleLabel: professional_guide | agency | shop_owner',
      'publishingPurpose: professional | business',
    ],
    notSameAs: ['friends', 'intent_signal', 'directory'],
  },
  outing_roster: {
    id: 'outing_roster',
    boundedContexts: ['participation', 'communication'],
    routes: ['/activity/:id?tab=crew', '/activity/:id/crew'],
    wire: [
      'viewerAccess.canAccessCrewSurfaces',
      'member_group.kind=outing_crew',
      'activity group chat',
    ],
    notSameAs: ['teams', 'friends', 'communities'],
  },
  intent_signal: {
    id: 'intent_signal',
    boundedContexts: ['compose', 'member_discovery', 'engagement'],
    routes: ['/explore?compose=intent:open', '/explore?compose=intent:fixed:*', '/plan'],
    wire: [
      'PUT /me/availability',
      'member_availability',
      'GET /explore/map?sources=availability',
      'compose=intent:*',
    ],
    notSameAs: ['friends', 'outing_roster'],
  },
};

export const isCrewPillarId = (value: string): value is CrewPillarId =>
  (CREW_PILLAR_IDS as readonly string[]).includes(value);

export type CrewPeopleFacetWire = 'recommended' | 'friends' | 'available' | 'everyone';

/** People tab facet → pillar (discover browse). */
export const crewPeopleFacetToPillar = (facet: CrewPeopleFacetWire): CrewPillarId => {
  switch (facet) {
    case 'friends':
      return 'friends';
    case 'available':
      return 'intent_signal';
    case 'everyone':
      return 'directory';
    case 'recommended':
    default:
      return 'intent_signal';
  }
};

/** @deprecated Prefer {@link crewPeopleFacetToPillar}. */
export const crewHubStatTabToPillar = (
  tab: 'friends' | 'available' | 'everyone'
): CrewPillarId => crewPeopleFacetToPillar(tab);