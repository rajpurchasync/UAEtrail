import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { SocialPersonRowDTO } from '@uaetrail/shared-types';
import { BUDDIES_PATH, explorePlanWithBuddyPath } from '../../config/routingCatalog';
import { useHostStatus } from '../../hooks/useHostStatus';
import { ExploreGuestSignInCard } from './ExploreGuestSignInCard';
import type { UserRole } from '@uaetrail/shared-types';
import {
  EXPLORE_SOCIAL_EMPTY_ALL,
  EXPLORE_SOCIAL_EMPTY_FOLLOWED,
  EXPLORE_SOCIAL_EMPTY_FRIENDS,
  EXPLORE_SOCIAL_LOADING,
} from '../../content/exploreSocialPanelCopy';
import type { ExploreSocialTab } from './useExploreBrowseUrlState';
import { api } from '../../api/index';
import { ExploreSocialPersonCard } from './ExploreSocialPersonCard';

type ExploreSocialPeopleListProps = {
  people: SocialPersonRowDTO[];
  loading: boolean;
  error: string | null;
  isSignedIn: boolean;
  userRole: UserRole | undefined;
  tab: ExploreSocialTab;
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
}: ExploreSocialPeopleListProps) => {
  const navigate = useNavigate();
  const { canPublish } = useHostStatus({ enabled: isSignedIn });
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  if (!isSignedIn) {
    return <ExploreGuestSignInCard intent="explore-social" compact />;
  }

  if (loading) {
    return <p className="py-8 text-center text-sm text-gray-500">{EXPLORE_SOCIAL_LOADING}</p>;
  }

  if (error) {
    return <p className="py-8 text-center text-sm text-red-600">{error}</p>;
  }

  if (people.length === 0) {
    const emptyCopy =
      tab === 'friends'
        ? EXPLORE_SOCIAL_EMPTY_FRIENDS
        : tab === 'followed'
          ? EXPLORE_SOCIAL_EMPTY_FOLLOWED
          : EXPLORE_SOCIAL_EMPTY_ALL;
    return (
      <div className="rounded-2xl border border-dashed border-emerald-200/80 bg-emerald-50/30 px-4 py-8 text-center">
        <p className="text-sm text-neutral-600">{emptyCopy}</p>
        <Link to={BUDDIES_PATH} className="mt-3 inline-block text-sm font-semibold text-emerald-700 hover:underline">
          Manage buddy requests
        </Link>
      </div>
    );
  }

  const sendBuddyRequest = async (userId: string) => {
    setBusyUserId(userId);
    setActionError(null);
    setNotice(null);
    try {
      await api.sendBuddyRequest({ targetUserId: userId });
      setNotice('Buddy request sent.');
      onRefresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not send request.');
    } finally {
      setBusyUserId(null);
    }
  };

  const planTrip = (buddyUserId: string) => {
    navigate(explorePlanWithBuddyPath(buddyUserId, canPublish ? 'organize' : 'find'));
  };

  return (
    <div className="flex flex-col gap-2">
      {notice ? <p className="text-xs font-medium text-emerald-700">{notice}</p> : null}
      {actionError ? <p className="text-xs font-medium text-red-600">{actionError}</p> : null}
      {people.map((person) => (
        <ExploreSocialPersonCard
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

/** @deprecated Use `ExploreMemberPeopleNetworkList`. */
export const ExploreSocialPeopleList = ExploreMemberPeopleNetworkList;
