import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ExploreMemberDiscoveryList } from '../../explore/ui/ExploreMemberDiscoveryList';
import type { useMemberDiscoveryRoster } from '../../explore/useMemberDiscoveryRoster';
import { activityDetailPath } from '../../config/routingCatalog';
import type { BuddiesDiscoverySegment } from '../buddiesDiscoverySegment';

type MemberDiscoveryRosterState = ReturnType<typeof useMemberDiscoveryRoster>;

type ListDiscoverPeopleViewProps = {
  segment: BuddiesDiscoverySegment;
  roster: MemberDiscoveryRosterState;
};

export const ListDiscoverPeopleView = ({ segment, roster }: ListDiscoverPeopleViewProps) => {
  const { user } = useAuth();
  const userRole = user?.role;
  const navigate = useNavigate();

  return (
    <ExploreMemberDiscoveryList
      variant="list"
      segment={segment}
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
