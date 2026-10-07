import { Link, useNavigate } from 'react-router-dom';
import { CalendarDays, MessageCircle, UserPlus } from 'lucide-react';
import type { SocialPersonRowDTO } from '@uaetrail/shared-types';
import type { UserRole } from '@uaetrail/shared-types';
import { SecureAvatar } from '../../components/ui';
import { BUDDIES_PATH } from '../../config/routingCatalog';
import {
  EXPLORE_SOCIAL_ACTION_ADD_FRIEND,
  EXPLORE_SOCIAL_ACTION_MESSAGE,
  EXPLORE_SOCIAL_ACTION_PLAN_TRIP,
  socialPersonAttendedLine,
  socialPersonTripHintLine,
} from '../../content/exploreSocialPanelCopy';
import { messagesRouteForRole } from '../../utils/authRouting';

export type ExploreSocialPersonOutingHint = {
  line: string;
  onClick?: () => void;
};

type ExploreSocialPersonCardProps = {
  person: SocialPersonRowDTO;
  userRole?: UserRole;
  profileTo: string;
  profileDisabled?: boolean;
  showPlanTrip?: boolean;
  onPlanTrip?: (userId: string) => void;
  onOpenActivity: (trip: { exploreItemId: string }) => void;
  outingHint?: ExploreSocialPersonOutingHint | null;
  busy?: boolean;
  onSendBuddyRequest?: (userId: string) => void;
};

export const ExploreSocialPersonCard = ({
  person,
  userRole,
  profileTo,
  profileDisabled = false,
  showPlanTrip = true,
  onPlanTrip,
  onOpenActivity,
  outingHint = null,
  busy = false,
  onSendBuddyRequest,
}: ExploreSocialPersonCardProps) => {
  const navigate = useNavigate();
  const metaLine = [person.cityLabel, socialPersonAttendedLine(person.activitiesAttended)]
    .filter(Boolean)
    .join(' · ');
  const trip = person.upcomingTrip;

  const profileInner = (
    <>
      <SecureAvatar src={person.avatarUrl} name={person.displayName} className="h-12 w-12 shrink-0" />
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
        {outingHint ? (
          outingHint.onClick ? (
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                outingHint.onClick?.();
              }}
              className="mt-1 flex max-w-full items-start gap-1 text-left text-xs font-medium text-emerald-700 hover:underline"
            >
              <CalendarDays className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="line-clamp-2">{outingHint.line}</span>
            </button>
          ) : (
            <p className="mt-1 text-xs font-medium text-emerald-800">{outingHint.line}</p>
          )
        ) : trip ? (
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
    </>
  );

  return (
    <article className="rounded-2xl border border-neutral-200/90 bg-white p-3 shadow-sm">
      {profileDisabled ? (
        <div className="flex min-w-0 items-start gap-3 opacity-70">{profileInner}</div>
      ) : (
        <Link to={profileTo} className="flex min-w-0 items-start gap-3 active:opacity-90">
          {profileInner}
        </Link>
      )}

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
            {showPlanTrip && onPlanTrip ? (
              <button
                type="button"
                onClick={() => onPlanTrip(person.userId)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white"
              >
                <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                {EXPLORE_SOCIAL_ACTION_PLAN_TRIP}
              </button>
            ) : null}
          </>
        ) : (
          <>
            {person.canSendBuddyRequest && onSendBuddyRequest ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => onSendBuddyRequest(person.userId)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 disabled:opacity-40"
              >
                <UserPlus className="h-3.5 w-3.5" aria-hidden />
                {EXPLORE_SOCIAL_ACTION_ADD_FRIEND}
              </button>
            ) : null}
            {person.buddyRequestState === 'incoming' ? (
              <Link
                to={BUDDIES_PATH}
                className="inline-flex items-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-900"
              >
                Respond in Friends
              </Link>
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
};
