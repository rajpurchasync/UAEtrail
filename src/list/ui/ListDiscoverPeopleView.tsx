import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ExploreMemberDiscoveryList } from '../../explore/ui/ExploreMemberDiscoveryList';
import { ExploreMemberAvailabilityList } from '../../explore/ui/ExploreMemberAvailabilityList';
import type { useMemberDiscoveryRoster } from '../../explore/useMemberDiscoveryRoster';
import type { useExplorePeopleAvailability } from '../../explore/useExplorePeopleAvailability';
import { activityDetailPath } from '../../config/routingCatalog';
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
  const userRole = user?.role;
  const navigate = useNavigate();

  if (segment === 'available') {
    return (
      <ExploreMemberAvailabilityList
        variant="list"
        people={availability.people}
        loading={availability.loading}
        error={availability.error}
        isSignedIn={Boolean(user)}
        onRefresh={() => void availability.refresh()}
      />
    );
  }

  if (segment === 'going') {
    return (
      <ExploreMemberDiscoveryList
        variant="list"
        segment="going"
        friendsGoing={roster.friendsGoing}
        hostsGoing={roster.hostsGoing}
        lookingFor={roster.lookingFor}
        followed={roster.followed}
        directory={roster.directory}
        quota={roster.quota}
        loading={roster.loading}
        error={roster.error}
        isSignedIn={Boolean(user)}
        userRole={userRole}
        onRefresh={() => void roster.refresh()}
        onOpenActivity={(activityId) => navigate(activityDetailPath(activityId))}
      />
    );
  }

  return (
    <ExploreMemberDiscoveryList
      variant="list"
      segment="connect"
      friendsGoing={roster.friendsGoing}
      hostsGoing={roster.hostsGoing}
      lookingFor={roster.lookingFor}
      followed={roster.followed}
      directory={roster.directory}
      quota={roster.quota}
      loading={roster.loading}
      error={roster.error}
      isSignedIn={Boolean(user)}
      userRole={userRole}
      onRefresh={() => void roster.refresh()}
      onOpenActivity={(activityId) => navigate(activityDetailPath(activityId))}
    />
  );
};
