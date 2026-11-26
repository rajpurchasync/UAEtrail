import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarDays, Car, ChevronRight, MapPinned } from 'lucide-react';
import type { DiscoverCrewRecommendationBucket } from '@uaetrail/shared-types';
import { SecureAvatar } from '../../../components/ui';
import { EXPLORE_LIST_ROW, EXPLORE_TYPE } from '../../../config/exploreTheme';
import { messagesToUserPath } from '../../../config/routingCatalog';
import { CrewRecommendationBucketChip } from './CrewRecommendationBucketChip';
import type {
  CrewBrowseAvailabilityDetail,
  CrewBrowseAvailabilitySocialLabel,
  FindCrewTrustBadge,
} from '../../availabilityBrowseCardCopy';
import {
  CREW_BROWSE_AVAILABILITY_LABEL_DESTINATIONS,
  CREW_BROWSE_AVAILABILITY_LABEL_AS,
  CREW_BROWSE_AVAILABILITY_LABEL_DATES,
  CREW_BROWSE_AVAILABILITY_LABEL_FOR,
  CREW_BROWSE_AVAILABILITY_SECTION_TITLE,
  CREW_BROWSE_SOCIAL_LABEL_FRIEND,
  CREW_BROWSE_SOCIAL_LABEL_FOLLOWED,
  FIND_CREW_TRUST_BADGE_PRO,
  FIND_CREW_TRUST_BADGE_VERIFIED,
} from '../../availabilityBrowseCardCopy';
import type { FindCrewAvailabilityNarrative } from '../../findCrewAvailabilityNarrative';
import {
  FIND_CREW_CTA_PROPOSE_PLAN,
  FIND_CREW_MATCHES_YOUR_DATES,
  FIND_CREW_PROFILE_PRIVATE,
} from '@/discovery/discoveryPortListFindCrew';
import { memberProfileRoleLabel } from '../../../member/memberProfileRoleLabel';
import type { MemberAvailabilitySlotDTO } from '@uaetrail/shared-types';
import { writeFindCrewPlanAnchorSession } from '@/discovery/discoverySessionFindCrewPrefill';

export type CrewBrowseMemberBadge = {
  label: string;
};

export type CrewBrowseMemberRowPresentation = 'default' | 'findCrew';

const FIND_CREW_BODY_INDENT = 'pl-[3.25rem]';
const FIND_CREW_AVATAR =
  'h-11 w-11 shrink-0 rounded-lg text-sm ring-1 ring-neutral-200/80';

const socialLabelClass = (label: CrewBrowseAvailabilitySocialLabel) =>
  label === CREW_BROWSE_SOCIAL_LABEL_FRIEND
    ? 'bg-emerald-100 text-emerald-800 ring-emerald-200'
    : 'bg-sky-50 text-sky-900 ring-sky-200';

const trustBadgeClass = (badge: FindCrewTrustBadge) =>
  badge === 'pro'
    ? 'bg-violet-100 text-violet-900 ring-violet-200'
    : 'bg-amber-50 text-amber-950 ring-amber-200';

const trustBadgeLabel = (badge: FindCrewTrustBadge) =>
  badge === 'pro' ? FIND_CREW_TRUST_BADGE_PRO : FIND_CREW_TRUST_BADGE_VERIFIED;

const findCrewActionPrimary =
  'inline-flex min-h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-2.5 text-sm font-bold text-white active:bg-emerald-700';

const findCrewCardInteractive =
  'cursor-pointer transition active:bg-neutral-50/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/80';

const DefaultAvailabilityBlock = ({ detail }: { detail: CrewBrowseAvailabilityDetail }) => (
  <div className="mt-1 space-y-0.5" aria-label={CREW_BROWSE_AVAILABILITY_SECTION_TITLE}>
    <p className="text-xs font-semibold text-neutral-800">{CREW_BROWSE_AVAILABILITY_SECTION_TITLE}</p>
    <p className="line-clamp-2 text-xs leading-snug text-neutral-600">
      <span className="font-medium text-neutral-700">{CREW_BROWSE_AVAILABILITY_LABEL_DESTINATIONS}:</span>{' '}
      {detail.destinationLabels.join(', ')}
    </p>
    <p className="line-clamp-2 text-xs leading-snug text-neutral-600">
      <span className="font-medium text-neutral-700">{CREW_BROWSE_AVAILABILITY_LABEL_FOR}:</span> {detail.for}
    </p>
    <p className="text-xs leading-snug text-neutral-600">
      <span className="font-medium text-neutral-700">{CREW_BROWSE_AVAILABILITY_LABEL_AS}:</span> {detail.as}
    </p>
    {detail.datesLine ? (
      <p className="text-xs leading-snug text-neutral-600">
        <span className="font-medium text-neutral-700">{CREW_BROWSE_AVAILABILITY_LABEL_DATES}:</span>{' '}
        {detail.datesLine}
      </p>
    ) : null}
  </div>
);

const FindCrewMemberSubtitle = ({
  socialLabel,
  memberTypeLabel,
  trustBadges,
}: {
  socialLabel?: CrewBrowseAvailabilitySocialLabel | null;
  memberTypeLabel: string;
  trustBadges: FindCrewTrustBadge[];
}) => (
  <p className="mt-0.5 flex min-w-0 flex-wrap items-center gap-1">
    {socialLabel ? (
      <span
        className={`shrink-0 rounded-md px-1.5 py-px text-[10px] font-bold uppercase tracking-wide ring-1 ${socialLabelClass(socialLabel)}`}
      >
        {socialLabel}
      </span>
    ) : (
      <span className="truncate text-xs font-medium text-neutral-600">{memberTypeLabel}</span>
    )}
    {trustBadges.map((badge) => (
      <span
        key={badge}
        className={`shrink-0 rounded-md px-1.5 py-px text-[10px] font-bold uppercase tracking-wide ring-1 ${trustBadgeClass(badge)}`}
      >
        {trustBadgeLabel(badge)}
      </span>
    ))}
  </p>
);

const findCrewMetaRowClass = 'flex gap-1.5 text-xs leading-snug text-neutral-700';

const FindCrewActivityHeadline = ({
  activity,
}: {
  activity: FindCrewAvailabilityNarrative['activity'];
}) => (
  <p className="mt-1.5 text-sm leading-snug">
    <span className="font-bold text-neutral-950">{activity.headline}</span>
    {activity.detail ? <span className="font-medium text-neutral-800"> · {activity.detail}</span> : null}
  </p>
);

const FindCrewDestinationBlock = ({
  label,
  values,
  moreCount,
}: {
  label: string;
  values: string[];
  moreCount: number;
}) => (
  <div className="space-y-0.5">
    <p className={findCrewMetaRowClass}>
      <span className="shrink-0 font-semibold text-neutral-600">{label}:</span>
      {values.length === 1 ? (
        <span className="min-w-0 font-medium text-neutral-800">{values[0]}</span>
      ) : null}
    </p>
    {values.length > 1 ? (
      <ul className="list-none space-y-0.5 pl-0 text-xs font-medium text-neutral-800">
        {values.map((value) => (
          <li key={value} className="truncate pl-[4.75rem]">
            {value}
          </li>
        ))}
        {moreCount > 0 ? (
          <li className="pl-[4.75rem] text-neutral-500">+{moreCount} more</li>
        ) : null}
      </ul>
    ) : moreCount > 0 ? (
      <p className="pl-[4.75rem] text-xs font-medium text-neutral-500">+{moreCount} more</p>
    ) : null}
  </div>
);

const FindCrewAvailabilityBlock = ({
  narrative,
  matchesSearchDates,
}: {
  narrative: FindCrewAvailabilityNarrative;
  matchesSearchDates: boolean;
}) => (
  <div className={`${FIND_CREW_BODY_INDENT} mt-1 space-y-1`}>
    <FindCrewDestinationBlock
      label={narrative.destinationLabel}
      values={narrative.destinationValues}
      moreCount={narrative.destinationMoreCount}
    />
    {narrative.toLabel && narrative.toValue ? (
      <p className={findCrewMetaRowClass}>
        <span className="shrink-0 font-semibold text-neutral-600">{narrative.toLabel}:</span>
        <span className="min-w-0 font-medium text-neutral-800">{narrative.toValue}</span>
      </p>
    ) : null}
    {narrative.dateRows.map((row) => (
      <p key={`${row.scheduleLabel}-${row.range}`} className={`${findCrewMetaRowClass} items-center`}>
        <CalendarDays className="h-3.5 w-3.5 shrink-0 text-emerald-700" aria-hidden />
        <span className="shrink-0 font-semibold text-neutral-800">{row.scheduleLabel}</span>
        <span className="min-w-0 font-medium text-neutral-700">{row.range}</span>
      </p>
    ))}
    {narrative.dateMoreCount > 0 ? (
      <p className="pl-5 text-xs font-medium text-neutral-500">+{narrative.dateMoreCount} more dates</p>
    ) : null}
    {narrative.logisticsLine ? (
      <p className={`${findCrewMetaRowClass} items-center`}>
        <Car className="h-3.5 w-3.5 shrink-0 text-emerald-700" aria-hidden />
        <span className="min-w-0 font-medium text-neutral-700">{narrative.logisticsLine}</span>
      </p>
    ) : null}
    {matchesSearchDates ? (
      <p className="text-[11px] font-semibold text-emerald-800">{FIND_CREW_MATCHES_YOUR_DATES}</p>
    ) : null}
  </div>
);

type FindCrewMemberCardProps = {
  userId: string;
  profileHref: string;
  proposePlanHref?: string;
  proposePlanAnchorSlot?: MemberAvailabilitySlotDTO | null;
  displayName: string;
  avatarUrl?: string | null;
  friendHighlight?: boolean;
  socialLabel?: CrewBrowseAvailabilitySocialLabel | null;
  title: ReactNode;
  roleTitle?: string | null;
  findCrewNarrative?: FindCrewAvailabilityNarrative | null;
  availabilityDetail?: CrewBrowseAvailabilityDetail | null;
  recommendationBucket?: DiscoverCrewRecommendationBucket;
  canOpenMemberProfile?: boolean;
  isSignedIn?: boolean;
  matchesSearchDates?: boolean;
};

const FindCrewMemberCard = ({
  userId,
  profileHref,
  proposePlanHref,
  proposePlanAnchorSlot = null,
  displayName,
  avatarUrl,
  friendHighlight = false,
  socialLabel,
  title,
  roleTitle,
  findCrewNarrative,
  availabilityDetail,
  recommendationBucket,
  canOpenMemberProfile = true,
  isSignedIn = true,
  matchesSearchDates = false,
}: FindCrewMemberCardProps) => {
  const navigate = useNavigate();
  const profileReachable = canOpenMemberProfile || !isSignedIn;
  const showPrivateNotice = isSignedIn && !canOpenMemberProfile;
  const showProposeCta = Boolean(proposePlanHref) && profileReachable;
  const memberTypeLabel = roleTitle?.trim() || memberProfileRoleLabel(null);
  const trustBadges = availabilityDetail?.trustBadges ?? [];

  const openProfile = () => {
    if (profileReachable) navigate(profileHref);
  };

  const stopCardActivation = (event: { stopPropagation: () => void }) => {
    event.stopPropagation();
  };

  return (
    <article
      className={`${EXPLORE_LIST_ROW.shell} overflow-hidden rounded-xl ${
        profileReachable ? findCrewCardInteractive : ''
      }`}
      onClick={profileReachable ? openProfile : undefined}
      onKeyDown={
        profileReachable
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openProfile();
              }
            }
          : undefined
      }
      tabIndex={profileReachable ? 0 : undefined}
      role={profileReachable ? 'link' : undefined}
      aria-label={profileReachable ? `${displayName} — open profile` : undefined}
    >
      <div className="p-3">
        <div className="flex gap-2.5">
          <SecureAvatar
            src={avatarUrl}
            name={displayName}
            className={`${FIND_CREW_AVATAR} ${friendHighlight ? 'ring-2 ring-emerald-500' : ''}`}
          />
          <div className="min-w-0 flex-1">
            <h2 className={`truncate text-sm font-bold leading-snug text-neutral-950`}>{title}</h2>
            <FindCrewMemberSubtitle
              socialLabel={socialLabel}
              memberTypeLabel={memberTypeLabel}
              trustBadges={trustBadges}
            />
            {findCrewNarrative ? (
              <FindCrewActivityHeadline activity={findCrewNarrative.activity} />
            ) : null}
            {recommendationBucket ? (
              <p className="mt-1">
                <CrewRecommendationBucketChip bucket={recommendationBucket} />
              </p>
            ) : null}
          </div>
        </div>

        {findCrewNarrative &&
        (findCrewNarrative.destinationValues.length > 0 || findCrewNarrative.dateRows.length > 0) ? (
          <FindCrewAvailabilityBlock narrative={findCrewNarrative} matchesSearchDates={matchesSearchDates} />
        ) : null}

        {showPrivateNotice ? (
          <p className={`${FIND_CREW_BODY_INDENT} mt-2 text-xs font-medium leading-snug text-neutral-500`}>
            {FIND_CREW_PROFILE_PRIVATE}
          </p>
        ) : null}

        {showProposeCta && proposePlanHref ? (
          <div className={`${FIND_CREW_BODY_INDENT} mt-2`}>
            <Link
              to={proposePlanHref}
              className={findCrewActionPrimary}
              onClick={(event) => {
                stopCardActivation(event);
                if (proposePlanAnchorSlot) {
                  writeFindCrewPlanAnchorSession(userId, proposePlanAnchorSlot);
                }
              }}
            >
              <MapPinned className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {FIND_CREW_CTA_PROPOSE_PLAN}
            </Link>
          </div>
        ) : null}
      </div>
    </article>
  );
};

export type CrewBrowseMemberRowProps = {
  userId?: string;
  profileHref: string;
  actionHref?: string;
  messageHref?: string;
  displayName: string;
  avatarUrl?: string | null;
  friendHighlight?: boolean;
  socialLabel?: CrewBrowseAvailabilitySocialLabel | null;
  title: ReactNode;
  location?: string | null;
  roleTitle?: string | null;
  badge?: CrewBrowseMemberBadge | null;
  dateLine?: string | null;
  availabilityDetail?: CrewBrowseAvailabilityDetail | null;
  findCrewNarrative?: FindCrewAvailabilityNarrative | null;
  proposePlanHref?: string;
  proposePlanAnchorSlot?: MemberAvailabilitySlotDTO | null;
  footnote?: string | null;
  scheduleDetail?: ReactNode;
  titleClamp?: 'truncate' | 'line-clamp-2' | 'wrap';
  recommendationBucket?: DiscoverCrewRecommendationBucket;
  rowPresentation?: CrewBrowseMemberRowPresentation;
  canMessage?: boolean;
  canOpenMemberProfile?: boolean;
  isSignedIn?: boolean;
  matchesSearchDates?: boolean;
};

const avatarClass = (friendHighlight: boolean) =>
  `h-14 w-14 shrink-0 rounded-xl text-base ${
    friendHighlight ? 'ring-2 ring-emerald-500' : 'ring-1 ring-neutral-200/80'
  }`;

const badgeClass =
  'shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-neutral-700 ring-1 ring-neutral-200/80';

export const CrewBrowseMemberRow = ({
  userId,
  profileHref,
  actionHref,
  messageHref,
  displayName,
  avatarUrl,
  friendHighlight = false,
  socialLabel,
  title,
  location,
  roleTitle,
  badge,
  dateLine,
  availabilityDetail,
  findCrewNarrative,
  proposePlanHref,
  proposePlanAnchorSlot,
  footnote,
  scheduleDetail,
  titleClamp = 'truncate',
  recommendationBucket,
  rowPresentation = 'default',
  canOpenMemberProfile = true,
  isSignedIn = true,
  matchesSearchDates = false,
}: CrewBrowseMemberRowProps) => {
  const linkTo = actionHref ?? profileHref;
  const isFindCrew = rowPresentation === 'findCrew';

  if (isFindCrew && userId && !scheduleDetail) {
    return (
      <FindCrewMemberCard
        userId={userId}
        profileHref={profileHref}
        proposePlanHref={proposePlanHref}
        proposePlanAnchorSlot={proposePlanAnchorSlot}
        displayName={displayName}
        avatarUrl={avatarUrl}
        friendHighlight={friendHighlight}
        socialLabel={socialLabel}
        title={title}
        roleTitle={roleTitle}
        findCrewNarrative={findCrewNarrative}
        availabilityDetail={availabilityDetail}
        recommendationBucket={recommendationBucket}
        canOpenMemberProfile={canOpenMemberProfile}
        isSignedIn={isSignedIn}
        matchesSearchDates={matchesSearchDates}
      />
    );
  }

  const titleClass =
    titleClamp === 'wrap'
      ? `${EXPLORE_LIST_ROW.title} leading-snug`
      : `${titleClamp} ${EXPLORE_LIST_ROW.title}`;
  const mainRowClass = `${EXPLORE_LIST_ROW.main} items-start`;

  const textColumn = (
    <span className="min-w-0 flex-1 space-y-0.5">
      <span className="flex min-w-0 items-center gap-2">
        <span className={`min-w-0 ${titleClass}`}>{title}</span>
        {socialLabel ? (
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${socialLabelClass(socialLabel)}`}
          >
            {socialLabel}
          </span>
        ) : null}
      </span>
      {recommendationBucket ? (
        <p className="!mt-1">
          <CrewRecommendationBucketChip bucket={recommendationBucket} />
        </p>
      ) : null}
      {location ? <p className={`truncate ${EXPLORE_LIST_ROW.meta} !mt-0`}>{location}</p> : null}
      {availabilityDetail ? <DefaultAvailabilityBlock detail={availabilityDetail} /> : null}
      {!availabilityDetail && dateLine ? (
        <p className={`${EXPLORE_LIST_ROW.meta} !mt-0.5 leading-snug`}>{dateLine}</p>
      ) : null}
      {roleTitle ? (
        <p className={`truncate text-xs font-semibold leading-snug ${EXPLORE_TYPE.muted}`}>{roleTitle}</p>
      ) : null}
      {badge ? (
        <p className="!mt-0.5">
          <span className={badgeClass}>{badge.label}</span>
        </p>
      ) : null}
      {footnote ? (
        <p className={`truncate text-xs font-medium leading-snug ${EXPLORE_TYPE.caption}`}>{footnote}</p>
      ) : null}
    </span>
  );

  const mainInner = (
    <>
      <SecureAvatar src={avatarUrl} name={displayName} className={avatarClass(friendHighlight)} />
      {textColumn}
      <ChevronRight className="h-4 w-4 shrink-0 self-center text-gray-300" aria-hidden />
    </>
  );

  if (scheduleDetail) {
    return (
      <div className={EXPLORE_LIST_ROW.shell}>
        <Link
          to={linkTo}
          className={`${mainRowClass} rounded-t-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/80`}
        >
          {mainInner}
        </Link>
        <div className={`${EXPLORE_LIST_ROW.bodyIndent} ${EXPLORE_LIST_ROW.footer}`}>{scheduleDetail}</div>
      </div>
    );
  }

  return (
    <Link
      to={linkTo}
      className={`${EXPLORE_LIST_ROW.shell} ${mainRowClass} focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/80`}
    >
      {mainInner}
    </Link>
  );
};