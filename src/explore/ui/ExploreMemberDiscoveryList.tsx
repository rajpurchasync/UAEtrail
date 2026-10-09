import type {
  MemberBrowseCardDTO,
  MemberDiscoveryLookingRowDTO,
  MemberDiscoveryQuotaDTO,
  SocialPersonRowDTO,
} from '@uaetrail/shared-types';
import type { UserRole } from '@uaetrail/shared-types';
import type { BuddiesDiscoverySegment } from '../../list/buddiesDiscoverySegment';
import { PeopleBrowseTabContent } from './peopleBrowse';
import type { PeopleBrowseTabKey } from './peopleBrowse';

type ExploreMemberDiscoveryListProps = {
  variant?: 'panel' | 'list';
  segment?: BuddiesDiscoverySegment;
  friendsGoing: SocialPersonRowDTO[];
  hostsGoing: SocialPersonRowDTO[];
  lookingFor: MemberDiscoveryLookingRowDTO[];
  followed: MemberBrowseCardDTO[];
  directory: MemberBrowseCardDTO[];
  quota: MemberDiscoveryQuotaDTO | null;
  loading: boolean;
  error: string | null;
  isSignedIn: boolean;
  userRole?: UserRole;
  onOpenActivity: (activityId: string) => void;
  onRefresh?: () => void;
};

const segmentToTab = (segment: BuddiesDiscoverySegment): PeopleBrowseTabKey =>
  segment === 'going' ? 'going' : 'connect';

/** @deprecated Use `PeopleBrowseTabContent` — kept for list hygiene imports. */
export const ExploreMemberDiscoveryList = ({
  segment = 'connect',
  friendsGoing,
  hostsGoing,
  directory,
  quota,
  loading,
  error,
  isSignedIn,
}: ExploreMemberDiscoveryListProps) => (
  <PeopleBrowseTabContent
    tab={segmentToTab(segment)}
    isSignedIn={isSignedIn}
    availabilityPeople={[]}
    availabilityLoading={false}
    availabilityError={null}
    friendsGoing={friendsGoing}
    hostsGoing={hostsGoing}
    directory={directory}
    discoveryQuota={quota}
    discoveryLoading={loading}
    discoveryError={error}
  />
);
