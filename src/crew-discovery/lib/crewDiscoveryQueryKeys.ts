import type { ExploreActivityDatePreset } from '@/discovery/discoveryPortExploreActivityDate';
import { serializeExploreActivityDatePreset } from '@/discovery/discoveryPortExploreActivityDate';

const CREW_DISCOVERY_ROOT = ['crew-discovery'] as const;

export type CrewDiscoveryRosterQueryParams = {
  q: string;
  datePreset: ExploreActivityDatePreset;
  omitDirectory: boolean;
};

/** Friends / Everyone feed (`GET /discover/crew`). */
export const crewDiscoveryRosterQueryKey = (params: CrewDiscoveryRosterQueryParams) =>
  [
    ...CREW_DISCOVERY_ROOT,
    'roster',
    {
      q: params.q.trim(),
      date: serializeExploreActivityDatePreset(params.datePreset) || null,
      omitDirectory: params.omitDirectory,
    },
  ] as const;

export const crewDiscoveryNetworkPreviewQueryKey = () =>
  [...CREW_DISCOVERY_ROOT, 'network-preview'] as const;

export type CrewDiscoveryAvailabilityQueryParams = {
  from: string;
  to: string;
  destination?: string | null;
  region?: string | null;
  kind?: string | null;
};

/** **Available** tab — members with published availability. */
export const crewDiscoveryAvailabilityQueryKey = (params: CrewDiscoveryAvailabilityQueryParams) =>
  [...CREW_DISCOVERY_ROOT, 'member-availability', params] as const;