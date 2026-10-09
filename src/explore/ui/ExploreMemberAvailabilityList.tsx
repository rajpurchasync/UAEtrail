import type { ExploreAvailablePersonDTO } from '@uaetrail/shared-types';
import { PeopleBrowseTabContent } from './peopleBrowse';

type ExploreMemberAvailabilityListProps = {
  variant?: 'panel' | 'list';
  people: ExploreAvailablePersonDTO[];
  loading: boolean;
  error: string | null;
  isSignedIn: boolean;
  onRefresh?: () => void;
};

/** @deprecated Use `PeopleBrowseTabContent` — kept for list hygiene imports. */
export const ExploreMemberAvailabilityList = ({
  people,
  loading,
  error,
  isSignedIn,
}: ExploreMemberAvailabilityListProps) => (
  <PeopleBrowseTabContent
    tab="available"
    isSignedIn={isSignedIn}
    availabilityPeople={people}
    availabilityLoading={loading}
    availabilityError={error}
    friendsGoing={[]}
    hostsGoing={[]}
    directory={[]}
    discoveryQuota={null}
    discoveryLoading={false}
    discoveryError={null}
  />
);
