import type { CommunityDiscoverCardDTO, DiscoveryCardSections } from '@uaetrail/shared-types';
import type { DiscoveryCardModel } from './discoveryCardModel';
import { communityClubPath } from '../config/routingCatalog';
import { communityJoinPolicyLabel } from '../content/communityDiscoverCopy';

const communityDiscoverSections = (name: string): DiscoveryCardSections => ({
  listTitle: name,
  listWhen: null,
  listGoing: null,
  details: [],
});

/** Community directory row → shared {@link DiscoveryCardModel} (list + peek thumb chrome). */
export const buildDiscoveryCardModelFromCommunityDiscover = (
  row: CommunityDiscoverCardDTO
): DiscoveryCardModel => {
  const area = row.geoRef.names.area || row.geoRef.names.state;
  const geoLabel = [row.geoRef.names.country, area].filter(Boolean).join(' · ');
  const path = communityClubPath(row.slug);
  const memberLabel = `${row.memberCount} member${row.memberCount === 1 ? '' : 's'}`;

  return {
    id: `community:${row.id}`,
    path,
    source: 'agency',
    kind: 'event',
    tone: 'event',
    emoji: '👥',
    headline: row.name,
    listTitle: row.name,
    listHost: null,
    subtitle: row.summary,
    price: null,
    spotsLabel: memberLabel,
    venueHint: geoLabel,
    showJoinHint: false,
    primaryCta: 'View community',
    secondaryCta: null,
    showJoinActions: false,
    shareTitle: row.name,
    sharePath: path,
    routeLabel: null,
    whenLabel: communityJoinPolicyLabel(row.joinPolicy),
    scheduleDate: null,
    sections: communityDiscoverSections(row.name),
    coverImage: row.bannerUrl,
    geoRef: row.geoRef,
    requirementBadges: [communityJoinPolicyLabel(row.joinPolicy)],
    reviewCount: 0,
    childFriendly: false,
    difficulty: null,
    surfaceTypes: [],
  };
};