import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { ExploreActivityDatePreset } from '../../explore/exploreActivityDateFilter';
import { ExploreMemberDiscoveryList } from '../../explore/ui/ExploreMemberDiscoveryList';
import { useMemberDiscoveryRoster } from '../../explore/useMemberDiscoveryRoster';
import { activityDetailPath } from '../../config/routingCatalog';
import type { BuddiesDiscoverySegment } from '../buddiesDiscoverySegment';

type ListDiscoverPeopleViewProps = {
  searchQuery: string;
  segment: BuddiesDiscoverySegment;
  activityDatePreset: ExploreActivityDatePreset;
};

export const ListDiscoverPeopleView = ({
  searchQuery,
  segment,
  activityDatePreset,
}: ListDiscoverPeopleViewProps) => {
  const { user } = useAuth();
  const userRole = user?.role;
  const navigate = useNavigate();
  const roster = useMemberDiscoveryRoster({
    enabled: Boolean(user),
    search: searchQuery,
    activityDatePreset,
  });

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
