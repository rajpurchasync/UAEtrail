import type { ExploreActivityDatePreset } from '@/discovery/discoveryPortExploreActivityDate';
import { useCrewDiscoverFeed } from '../discover/useCrewDiscoverFeed';

type Args = {
  enabled: boolean;
  search: string;
  activityDatePreset: ExploreActivityDatePreset;
  /** List crews hub omits public directory; Find crew panel keeps Everyone. */
  omitDirectory?: boolean;
};

/** Find crew · **Friends** / **Everyone** — `GET /discover/crew`. */
export const useCrewDiscoveryRoster = (args: Args) => useCrewDiscoverFeed(args);