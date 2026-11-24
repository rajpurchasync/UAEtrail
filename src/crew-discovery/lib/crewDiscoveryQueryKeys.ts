import type { ExploreActivityDatePreset } from '@/explore/routing';
import { serializeExploreActivityDatePreset } from '@/explore/routing';

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
  area?: string | null;
  region?: string | null;
  kind?: string | null;
};

/** **Available** tab — members with published availability. */
export const crewDiscoveryAvailabilityQueryKey = (params: CrewDiscoveryAvailabilityQueryParams) =>
  [...CREW_DISCOVERY_ROOT, 'member-availability', params] as const;