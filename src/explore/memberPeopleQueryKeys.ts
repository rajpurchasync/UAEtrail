import type { ExploreActivityDatePreset } from './routing';
import { serializeExploreActivityDatePreset } from './routing';

export type MemberDiscoveryRosterQueryParams = {
  q: string;
  datePreset: ExploreActivityDatePreset;
  omitDirectory: boolean;
};

export const memberDiscoveryRosterQueryKey = (params: MemberDiscoveryRosterQueryParams) =>
  [
    'member-discovery',
    'roster',
    {
      q: params.q.trim(),
      date: serializeExploreActivityDatePreset(params.datePreset) || null,
      omitDirectory: params.omitDirectory,
    },
  ] as const;

export const memberPeopleNetworkQueryKey = (segment: string) =>
  ['member-people', 'network', segment] as const;

export const memberPeopleNetworkPreviewQueryKey = () =>
  ['member-people', 'network-preview'] as const;

export type ExplorePeopleAvailabilityQueryParams = {
  from: string;
  to: string;
  area?: string | null;
  kind?: string | null;
};

export const explorePeopleAvailabilityQueryKey = (params: ExplorePeopleAvailabilityQueryParams) =>
  ['explore-people', 'availability', params] as const;
