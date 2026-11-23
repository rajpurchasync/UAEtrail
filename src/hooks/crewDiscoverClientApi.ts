import type { CrewDiscoverFeedDTO, MemberDiscoveryQuotaDTO } from '@uaetrail/shared-types';
import { crewDiscoverApi } from '../api/domains/crewDiscover';

export type CrewDiscoverFeedPayload = CrewDiscoverFeedDTO & {
  quota: MemberDiscoveryQuotaDTO;
};

export const mapCrewDiscoverFeedToRoster = (
  feed: CrewDiscoverFeedDTO,
  quota: MemberDiscoveryQuotaDTO
): CrewDiscoverFeedPayload => ({
  ...feed,
  quota,
  availabilityOnMap: feed.availabilityFixed,
});

export const fetchDiscoverCrewFeed = async (options?: {
  q?: string;
  date?: string | null;
  omitDirectory?: boolean;
}): Promise<CrewDiscoverFeedPayload> => {
  const res = await crewDiscoverApi.getDiscoverCrewFeed({
    q: options?.q,
    date: options?.date,
    omitDirectory: options?.omitDirectory,
  });
  return mapCrewDiscoverFeedToRoster(res.data, res.meta.quota);
};