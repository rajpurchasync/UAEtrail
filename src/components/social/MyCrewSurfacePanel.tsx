import { useAuth } from '@/context/AuthContext';
import { useMeFriendsNetwork } from '@/hooks/useMeFriendsNetwork';
import { crewsHubHomePath } from '@/discovery/discoverySession';
import { ExploreGuestSignInCard } from '@/explore/ui/ExploreGuestSignInCard';
import { SocialHubIndex } from './SocialHubIndex';

const myCrewListAuthReturn = (): string => crewsHubHomePath();

/**
 * My crew surface on `/list?listCat=people&crewSurface=my` — same hub as `/crews`, no member_discovery roster.
 */
export const MyCrewSurfacePanel = () => {
  const { user } = useAuth();
  const signedIn = Boolean(user);
  const { incomingRequests, outgoingRequests } = useMeFriendsNetwork(signedIn);
  const requestCount = incomingRequests.length + outgoingRequests.length;

  if (!signedIn) {
    return (
      <ExploreGuestSignInCard intent="explore-people-browse" compact authReturnPath={myCrewListAuthReturn()} />
    );
  }

  return <SocialHubIndex requestCount={requestCount} />;
};