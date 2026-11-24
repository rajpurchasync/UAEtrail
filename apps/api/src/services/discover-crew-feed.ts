import { CREW_DISCOVER_FEED_SCHEMA_VERSION, type CrewDiscoverFeedDTO } from '@uaetrail/shared-types';
import { loadMemberDiscoveryRoster } from './member-discovery-roster.js';

export const loadDiscoverCrewFeed = async (input: {
  viewerUserId: string | null;
  userRole?: string | null;
  datePresetRaw?: string | null;
  search?: string;
  skip: number;
  take: number;
  omitDirectory?: boolean;
}): Promise<{
  data: CrewDiscoverFeedDTO;
  quota: import('@uaetrail/shared-types').MemberDiscoveryQuotaDTO;
}> => {
  const { data, quota } = await loadMemberDiscoveryRoster(input);
  return {
    quota,
    data: {
      schemaVersion: CREW_DISCOVER_FEED_SCHEMA_VERSION,
      friendsGoing: data.friendsGoing,
      hostsGoing: data.hostsGoing,
      followed: data.followed,
      directory: data.directory,
      availabilityOnMap: data.availabilityOnMap,
      availabilityFixed: data.availabilityOnMap,
    },
  };
};