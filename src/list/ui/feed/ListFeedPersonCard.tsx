import { Link, useNavigate } from 'react-router-dom';
import { CalendarDays, MessageCircle, UserPlus } from 'lucide-react';
import type { SocialPersonRowDTO } from '@uaetrail/shared-types';
import type { UserRole } from '@uaetrail/shared-types';
import { EnvironmentImage } from '../../../components/ui/EnvironmentImage';
import { SecureAvatar } from '../../../components/ui/SecureAvatar';
import { BUDDIES_PATH } from '../../../config/routingCatalog';
import {
  EXPLORE_SOCIAL_ACTION_ADD_FRIEND,
  EXPLORE_SOCIAL_ACTION_MESSAGE,
  socialPersonAttendedLine,
  socialPersonTripHintLine,
} from '../../../content/exploreSocialPanelCopy';
import type { ExploreSocialPersonOutingHint } from '../../../explore/ui/ExploreSocialPersonCard';
import { messagesRouteForRole } from '../../../utils/authRouting';
import { LIST_FEED } from '../../listFeedTheme';

const actionShell =
  'flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-neutral-700 transition active:bg-neutral-50 disabled:opacity-45';

const actionLabel = 'text-[10px] font-semibold leading-tight text-neutral-600';

const publisherRoleLabel = (person: SocialPersonRowDTO): string => {
  if (person.relationship === 'friend') return 'Friend';
  if (person.upcomingTrip?.role === 'hosting') return 'Guide';
  return 'Member';
};

export type ListFeedPersonCardProps = {
  person: SocialPersonRowDTO;
  profileTo: string;
  profileDisabled?: boolean;
  userRole?: UserRole;
  edgeToEdge?: boolean;
  outingHint?: ExploreSocialPersonOutingHint | null;
  busy?: boolean;
  onSendBuddyRequest?: (userId: string) => void;
  onOpenActivity: (trip: { exploreItemId: string }) => void;
};

export const ListFeedPersonCard = ({
  person,
  profileTo,
  profileDisabled = false,
  userRole,
  edgeToEdge = true,
  outingHint = null,
  busy = false,
  onSendBuddyRequest,
  onOpenActivity,
}: ListFeedPersonCardProps) => {
  const navigate = useNavigate();
  const trip = person.upcomingTrip;
  const metaLine = [person.cityLabel, socialPersonAttendedLine(person.activitiesAttended)]
    .filter(Boolean)
    .join(' · ');
  const tripLine = outingHint?.line ?? (trip ? socialPersonTripHintLine(trip) : null);

  const frameClass = edgeToEdge ? LIST_FEED.feedCardFrameEdge : LIST_FEED.feedCardFrame;
  const articleClass = edgeToEdge ? LIST_FEED.articleEdge : LIST_FEED.article;
  const headerClass = edgeToEdge ? LIST_FEED.headerEdge : LIST_FEED.header;

  const publisherInner = (
    <>
      <SecureAvatar
        src={person.avatarUrl}
        name={person.displayName}
        className="h-10 w-10 shrink-0 text-sm ring-2 ring-white"
      />
      <span className="min-w-0 flex-1">
        <span className={LIST_FEED.publisherName}>{person.displayName}</span>
        <span className={`mt-0.5 block ${LIST_FEED.publisherType}`}>{publisherRoleLabel(person)}</span>
      </span>
    </>
  );

  return (
    <article className={`relative ${articleClass}`}>
      <header className={`relative z-[2] ${headerClass}`}>
        {profileDisabled ? (
          <div className={`${LIST_FEED.publisherStatic} opacity-70`}>{publisherInner}</div>
        ) : (
          <Link to={profileTo} className={`${LIST_FEED.publisherLink} relative z-[3]`}>
            {publisherInner}
          </Link>
        )}
      </header>

      <div className={`relative z-[2] ${frameClass}`}>
        <div className={`relative ${LIST_FEED.mediaOnly}`}>
          {person.avatarUrl ? (
            <>
              <EnvironmentImage
                src={person.avatarUrl}
                alt=""
                className="absolute inset-0 z-0 block h-full w-full scale-110 object-cover object-center blur-md"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 z-[1] bg-neutral-900/45" aria-hidden />
            </>
          ) : (
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-emerald-700 via-teal-800 to-neutral-900" aria-hidden />
          )}

          <div
            className={`pointer-events-none absolute inset-0 z-[2] flex flex-col px-4 pb-4 pt-4 ${LIST_FEED.overlayPhotoScrimBase} ${LIST_FEED.overlayPhotoScrimBottom}`}
          >
            <div className={`${LIST_FEED.overlayHeroCenter} ${LIST_FEED.overlayTextShadow}`}>
              <div className={LIST_FEED.overlayHeroCopy}>
                {metaLine ? (
                  <p className={`${LIST_FEED.placeLine} ${LIST_FEED.placeOnPhoto}`}>{metaLine}</p>
                ) : null}
                <h3
                  className={`${LIST_FEED.title} ${LIST_FEED.titleFeed} ${LIST_FEED.titleOnPhoto} line-clamp-3`}
                >
                  {person.displayName}
                </h3>
              </div>
            </div>

            {tripLine ? (
              <div className={`mt-auto ${LIST_FEED.overlayFooterStack} ${LIST_FEED.overlayFooterLift}`}>
                <div className={LIST_FEED.overlayFactsPanel}>
                  <p className="text-center text-sm font-semibold leading-snug text-white">{tripLine}</p>
                </div>
              </div>
            ) : null}
          </div>

          <SecureAvatar
            src={person.avatarUrl}
            name={person.displayName}
            className="pointer-events-none absolute left-1/2 top-[38%] z-[3] h-24 w-24 -translate-x-1/2 -translate-y-1/2 text-2xl ring-4 ring-white/90"
          />
        </div>

        <div
          className="flex items-stretch border-t border-neutral-100 bg-white"
          onClick={(event) => event.stopPropagation()}
        >
          {person.relationship === 'friend' ? (
            <button
              type="button"
              disabled={!person.canMessage}
              className={actionShell}
              onClick={() => navigate(messagesRouteForRole(userRole ?? 'participant', person.userId))}
            >
              <MessageCircle className="h-[1.35rem] w-[1.35rem]" strokeWidth={2} aria-hidden />
              <span className={actionLabel}>{EXPLORE_SOCIAL_ACTION_MESSAGE}</span>
            </button>
          ) : (
            <>
              {person.canSendBuddyRequest && onSendBuddyRequest ? (
                <button
                  type="button"
                  disabled={busy}
                  className={actionShell}
                  onClick={() => onSendBuddyRequest(person.userId)}
                >
                  <UserPlus className="h-[1.35rem] w-[1.35rem]" strokeWidth={2} aria-hidden />
                  <span className={actionLabel}>{EXPLORE_SOCIAL_ACTION_ADD_FRIEND}</span>
                </button>
              ) : null}
              {person.buddyRequestState === 'incoming' ? (
                <Link to={BUDDIES_PATH} className={actionShell}>
                  <CalendarDays className="h-[1.35rem] w-[1.35rem]" strokeWidth={2} aria-hidden />
                  <span className={actionLabel}>Respond</span>
                </Link>
              ) : null}
            </>
          )}

          {trip && !outingHint ? (
            <button
              type="button"
              className={actionShell}
              onClick={() => onOpenActivity(trip)}
            >
              <CalendarDays className="h-[1.35rem] w-[1.35rem]" strokeWidth={2} aria-hidden />
              <span className={actionLabel}>Outing</span>
            </button>
          ) : outingHint?.onClick ? (
            <button type="button" className={actionShell} onClick={() => outingHint.onClick?.()}>
              <CalendarDays className="h-[1.35rem] w-[1.35rem]" strokeWidth={2} aria-hidden />
              <span className={actionLabel}>Plan</span>
            </button>
          ) : person.canMessage && person.relationship !== 'friend' ? (
            <button
              type="button"
              className={actionShell}
              onClick={() => navigate(messagesRouteForRole(userRole ?? 'participant', person.userId))}
            >
              <MessageCircle className="h-[1.35rem] w-[1.35rem]" strokeWidth={2} aria-hidden />
              <span className={actionLabel}>{EXPLORE_SOCIAL_ACTION_MESSAGE}</span>
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
};
