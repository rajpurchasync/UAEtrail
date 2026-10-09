import { useAuth } from '../../context/AuthContext';
import { PeopleBrowseTabContent } from '../../explore/ui/peopleBrowse';
import type { useMemberDiscoveryRoster } from '../../explore/useMemberDiscoveryRoster';
import type { useExplorePeopleAvailability } from '../../explore/useExplorePeopleAvailability';
import type { BuddiesDiscoverySegment } from '../buddiesDiscoverySegment';

type MemberDiscoveryRosterState = ReturnType<typeof useMemberDiscoveryRoster>;
type PeopleAvailabilityState = ReturnType<typeof useExplorePeopleAvailability>;

type ListDiscoverPeopleViewProps = {
  segment: BuddiesDiscoverySegment;
  roster: MemberDiscoveryRosterState;
  availability: PeopleAvailabilityState;
};

const segmentToTab = (segment: BuddiesDiscoverySegment) => {
  if (segment === 'available') return 'available' as const;
  if (segment === 'going') return 'going' as const;
  return 'connect' as const;
};

export const ListDiscoverPeopleView = ({
  segment,
  roster,
  availability,
}: ListDiscoverPeopleViewProps) => {
  const { user } = useAuth();
  const tab = segmentToTab(segment);

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
    />
  );
};
