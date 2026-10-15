import { useAuth } from '../../context/AuthContext';
import { PeopleBrowseTabContent } from '@/people-discovery/panel/peopleBrowse';
import type { useMemberDiscoveryRoster } from '@/people-discovery/hooks/useMemberDiscoveryRoster';
import type { useExplorePeopleAvailability } from '@/people-discovery/hooks/usePeopleAvailability';
import type { BuddiesDiscoverySegment } from '../buddiesDiscoverySegment';

type MemberDiscoveryRosterState = ReturnType<typeof useMemberDiscoveryRoster>;
type PeopleAvailabilityState = ReturnType<typeof useExplorePeopleAvailability>;

type ListDiscoverPeopleViewProps = {
  segment: BuddiesDiscoverySegment;
  roster: MemberDiscoveryRosterState;
  availability: PeopleAvailabilityState;
};

export const ListDiscoverPeopleView = ({
  segment,
  roster,
  availability,
}: ListDiscoverPeopleViewProps) => {
  const { user } = useAuth();
  const tab = segment;

  return (
    <PeopleBrowseTabContent
      tab={tab}
      isSignedIn={Boolean(user)}
      availabilityPeople={tab === 'available' ? availability.people : []}
      availabilityLoading={tab === 'available' ? availability.loading : false}
      availabilityError={tab === 'available' ? availability.error : null}
      friendsGoing={roster.friendsGoing}
      hostsGoing={roster.hostsGoing}
      directory={roster.directory}
      discoveryQuota={roster.quota}
      discoveryLoading={roster.loading}
      discoveryError={roster.error}
      seekingOnMap={roster.seekingOnMap}
    />
  );
};
