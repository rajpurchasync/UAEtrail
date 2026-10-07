import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarDays, MessageCircle, UserPlus } from 'lucide-react';
import type { SocialPersonRowDTO } from '@uaetrail/shared-types';
import { SecureAvatar } from '../../components/ui';
import { BUDDIES_PATH, explorePlanWithBuddyPath } from '../../config/routingCatalog';
import { useHostStatus } from '../../hooks/useHostStatus';
import { ExploreGuestSignInCard } from './ExploreGuestSignInCard';
import { messagesRouteForRole } from '../../utils/authRouting';
import type { UserRole } from '@uaetrail/shared-types';
import {
  EXPLORE_SOCIAL_ACTION_ADD_FRIEND,
  EXPLORE_SOCIAL_ACTION_MESSAGE,
  EXPLORE_SOCIAL_ACTION_PLAN_TRIP,
  EXPLORE_SOCIAL_EMPTY_ALL,
  EXPLORE_SOCIAL_EMPTY_FOLLOWED,
  EXPLORE_SOCIAL_EMPTY_FRIENDS,
  EXPLORE_SOCIAL_LOADING,
  socialPersonAttendedLine,
  socialPersonTripHintLine,
} from '../../content/exploreSocialPanelCopy';
import type { ExploreSocialTab } from './useExploreBrowseUrlState';
import { api } from '../../api/index';

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

export const ExploreSocialPeopleList = ({
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
    const path = explorePlanWithBuddyPath(buddyUserId, canPublish ? 'organize' : 'find');
    navigate(path);
  };

  return (
    <div className="flex flex-col gap-2">
      {notice ? <p className="text-xs font-medium text-emerald-700">{notice}</p> : null}
      {actionError ? <p className="text-xs font-medium text-red-600">{actionError}</p> : null}
      {people.map((person) => {
        const metaLine = [person.cityLabel, socialPersonAttendedLine(person.activitiesAttended)]
          .filter(Boolean)
          .join(' · ');
        const trip = person.upcomingTrip;

        return (
          <article
            key={person.userId}
            className="rounded-2xl border border-neutral-200/90 bg-white p-3 shadow-sm"
          >
            <Link
              to={`/member/${person.userId}`}
              className="flex min-w-0 items-start gap-3 active:opacity-90"
            >
              <SecureAvatar
                src={person.avatarUrl}
                name={person.displayName}
                className="h-12 w-12 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-bold text-gray-900">{person.displayName}</p>
                  {person.relationship === 'friend' ? (
                    <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-800">
                      Friend
                    </span>
                  ) : null}
                </div>
                {metaLine ? <p className="mt-0.5 text-xs text-neutral-600">{metaLine}</p> : null}
                {trip ? (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      onOpenActivity(trip);
                    }}
                    className="mt-1 flex max-w-full items-start gap-1 text-left text-xs font-medium text-emerald-700 hover:underline"
                  >
                    <CalendarDays className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                    <span className="line-clamp-2">{socialPersonTripHintLine(trip)}</span>
                  </button>
                ) : null}
              </div>
            </Link>

            <div className="mt-2 flex flex-wrap gap-2 border-t border-neutral-100 pt-2">
              {person.relationship === 'friend' ? (
                <>
                  <button
                    type="button"
                    disabled={!person.canMessage}
                    onClick={() => navigate(messagesRouteForRole(userRole ?? 'participant', person.userId))}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-800 disabled:opacity-40"
                  >
                    <MessageCircle className="h-3.5 w-3.5" aria-hidden />
                    {EXPLORE_SOCIAL_ACTION_MESSAGE}
                  </button>
                  <button
                    type="button"
                    onClick={() => planTrip(person.userId)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                    {EXPLORE_SOCIAL_ACTION_PLAN_TRIP}
                  </button>
                </>
              ) : (
                <>
                  {person.canSendBuddyRequest ? (
                    <button
                      type="button"
                      disabled={busyUserId === person.userId}
                      onClick={() => void sendBuddyRequest(person.userId)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 disabled:opacity-40"
                    >
                      <UserPlus className="h-3.5 w-3.5" aria-hidden />
                      {EXPLORE_SOCIAL_ACTION_ADD_FRIEND}
                    </button>
                  ) : null}
                  {person.canMessage ? (
                    <button
                      type="button"
                      onClick={() => navigate(messagesRouteForRole(userRole ?? 'participant', person.userId))}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-800"
                    >
                      <MessageCircle className="h-3.5 w-3.5" aria-hidden />
                      {EXPLORE_SOCIAL_ACTION_MESSAGE}
                    </button>
                  ) : null}
                </>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
};
