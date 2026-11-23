import type { MemberBrowseCardDTO } from './member-pro-engagement.js';
import type {
  MemberDiscoveryAvailabilityRowDTO,
  MemberDiscoveryRosterDTO,
} from './member-discovery-roster.js';
import type { MemberDiscoveryQuotaDTO } from './member-discovery-quota.js';
import type { SocialPersonRowDTO } from './social-people.js';

export const CREW_DISCOVER_FEED_SCHEMA_VERSION = 1 as const;

/** Federated Find crew read model (`GET /discover/crew`). */
export type CrewDiscoverFeedDTO = MemberDiscoveryRosterDTO & {
  schemaVersion: typeof CREW_DISCOVER_FEED_SCHEMA_VERSION;
  directory: MemberBrowseCardDTO[];
  /** Fixed availability pins — from `member_availability`, not full map assembly. */
  availabilityFixed: MemberDiscoveryAvailabilityRowDTO[];
};

export type CrewDiscoverFeedMetaDTO = {
  page: number;
  pageSize: number;
  quota: MemberDiscoveryQuotaDTO;
};