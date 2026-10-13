import { Link, useNavigate } from 'react-router-dom';
import type { SocialPersonRowDTO } from '@uaetrail/shared-types';
import { BUDDIES_PATH, explorePlanWithBuddyPath } from '../../config/routingCatalog';
import { useHostStatus } from '../../hooks/useHostStatus';
import { ExploreGuestSignInCard } from './ExploreGuestSignInCard';
import type { UserRole } from '@uaetrail/shared-types';
import {
  EXPLORE_PEOPLE_BROWSE_EMPTY_ALL,
  EXPLORE_PEOPLE_BROWSE_EMPTY_FOLLOWED,
  EXPLORE_PEOPLE_BROWSE_EMPTY_FRIENDS,
  EXPLORE_PEOPLE_BROWSE_LOADING,
} from '../../content/explorePeopleBrowseCopy';
import type { ExplorePeopleBrowseTab } from './useExploreBrowseUrlState';
import { useMemberPersonBuddyRequest } from '../useMemberPersonBuddyRequest';
import { ExploreMemberPersonCard } from './ExploreMemberPersonCard';

type ExploreMemberPeopleNetworkListProps = {
  people: SocialPersonRowDTO[];
  loading: boolean;
  error: string | null;
  isSignedIn: boolean;
  userRole: UserRole | undefined;
  tab: ExplorePeopleBrowseTab;
  onOpenActivity: (trip: { exploreItemId: string }) => void;
  onRefresh: () => void;
};

export const ExploreMemberPeopleNetworkList = ({
  people,
  loading,
  error,
  isSignedIn,
  userRole,
  tab,
  onOpenActivity,
  onRefresh,
}: ExploreMemberPeopleNetworkListProps) => {
  const navigate = useNavigate();
  const { canPublish } = useHostStatus({ enabled: isSignedIn });
  const { busyUserId, notice, actionError, sendBuddyRequest } = useMemberPersonBuddyRequest({
    onSuccess: onRefresh,
  });

  if (!isSignedIn) {
    return <ExploreGuestSignInCard intent="explore-people-browse" compact />;
  }

  if (loading) {
    return <p className="py-8 text-center text-sm text-gray-500">{EXPLORE_PEOPLE_BROWSE_LOADING}</p>;
  }

  if (error) {
    return <p className="py-8 text-center text-sm text-red-600">{error}</p>;
  }

  if (people.length === 0) {
    const emptyCopy =
      tab === 'friends'
        ? EXPLORE_PEOPLE_BROWSE_EMPTY_FRIENDS
        : tab === 'followed'
          ? EXPLORE_PEOPLE_BROWSE_EMPTY_FOLLOWED
          : EXPLORE_PEOPLE_BROWSE_EMPTY_ALL;
    return (
      <div className="rounded-2xl border border-dashed border-emerald-200/80 bg-emerald-50/30 px-4 py-8 text-center">
        <p className="text-sm text-neutral-600">{emptyCopy}</p>
        <Link to={BUDDIES_PATH} className="mt-3 inline-block text-sm font-semibold text-emerald-700 hover:underline">
          Manage buddy requests
        </Link>
      </div>
    );
  }

  const planTrip = (buddyUserId: string) => {
    navigate(explorePlanWithBuddyPath(buddyUserId, canPublish ? 'organize' : 'find'));
  };

  return (
    <div className="flex flex-col gap-2">
      {notice ? <p className="text-xs font-medium text-emerald-700">{notice}</p> : null}
      {actionError ? <p className="text-xs font-medium text-red-600">{actionError}</p> : null}
      {people.map((person) => (
        <ExploreMemberPersonCard
          key={person.userId}
          person={person}
          userRole={userRole}
          profileTo={`/member/${person.userId}`}
          showPlanTrip
          onPlanTrip={planTrip}
          onOpenActivity={onOpenActivity}
          busy={busyUserId === person.userId}
          onSendBuddyRequest={(userId) => void sendBuddyRequest(userId)}
        />
      ))}
    </div>
  );
};
