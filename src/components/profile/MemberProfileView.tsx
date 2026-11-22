import { Link } from 'react-router-dom';
import { formatProfileMonthDayLabel, formatRideshareVehicleLabel } from '@uaetrail/shared-types';
import { SIGNIN_PATH, memberProfileLink } from '../../config/routingCatalog';
import type { ActivityDTO, BuddyRelationshipDTO, MemberProfileSocialGraphDTO } from '@uaetrail/shared-types';
import { MemberProfileDeferredSectionAnchor } from './MemberProfileDeferredSectionAnchor';
import { MemberProfileSocialGraphAnchor } from './MemberProfileSocialGraphAnchor';
import { MemberProfileSocialSections } from './MemberProfileSocialSections';
import { MemberFollowControls } from './MemberFollowControls';
import { MemberProfileFriendActions } from './MemberProfileFriendActions';
import type { PersonPublicProfileDTO } from '../../api/types';
import { GlassCard } from '../mobile/GlassCard';
import { PublicProfileSectionHeading } from './PublicProfileSectionHeading';
import { SecureAvatar } from '../ui/SecureAvatar';
import { ShareButton } from '../ui/ShareButton';
import { ProfileActivityListRow } from './ProfileActivityListRow';
import { AccountSectionHeader } from '../account/AccountSectionHeader';
import { parseLanguagesList } from '../../utils/profileLanguages';
import { resolvePublicMemberRoleLabel } from '../../utils/profileRoleLabel';
import { formatMemberJoinedLabel } from '../../utils/formatMemberSince';
import { PublicMemberYearGoal } from './PublicMemberYearGoal';
import { MemberProfileHostGuidePanel } from './MemberProfileHostGuidePanel';
import { MemberProfileHostReviews } from './MemberProfileHostReviews';
import { TenantHostRatingInline } from '../reviews/TenantHostRatingInline';
import { MemberProfilePresentationSwitch } from './MemberProfilePresentationSwitch';
import type { MemberProfilePresentationMode } from '../../member/memberProfilePresentation';

export type FullMemberProfile = Extract<PersonPublicProfileDTO, { visibilityState: 'full' }>;

const SectionHeading = PublicProfileSectionHeading;

const StatBlock = ({ label, value }: { label: string; value: number }) => (
  <div className="px-4 py-4 text-center">
    <p className="text-2xl font-bold tabular-nums text-neutral-900">{value.toLocaleString()}</p>
    <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">{label}</p>
  </div>
);

const DetailRow = ({
  icon,
  label,
  children,
}: {
  icon: string;
  label: string;
  children: React.ReactNode;
}) => (
  <div className="flex items-start gap-3">
    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-base" aria-hidden>
      {icon}
    </span>
    <div className="min-w-0 flex-1 pt-0.5">
      <p className="text-xs font-semibold text-neutral-500">{label}</p>
      <div className="mt-1">{children}</div>
    </div>
  </div>
);

interface MemberProfileViewProps {
  profile: FullMemberProfile;
  /** From `ProfileViewerAccessDTO` — trusted fields (goal, bio, upcoming), not page routing. */
  canViewPublicCardFields: boolean;
  canViewTrustedFields: boolean;
  isSelf: boolean;
  userId: string;
  userLoggedIn: boolean;
  buddyRel: BuddyRelationshipDTO | null;
  buddyBusy: boolean;
  buddyMessage: string | null;
  onBuddyMessage: (message: string | null) => void;
  onSendBuddyRequest: () => void;
  onAcceptBuddyRequest: () => void;
  onDeclineBuddyRequest: () => void;
  onCancelBuddyRequest: () => void;
  onMessage: () => void;
  upcomingActivities?: ActivityDTO[];
  pastActivities?: ActivityDTO[];
  activitiesLoading?: boolean;
  activitiesDeferActive?: boolean;
  onRequestMemberActivities?: () => void;
  socialGraph?: MemberProfileSocialGraphDTO | null;
  socialGraphLoading?: boolean;
  socialGraphLoadingFriends?: boolean;
  socialGraphLoadingCommon?: boolean;
  socialGraphDeferActive?: boolean;
  onRequestSocialGraph?: () => void;
  presentation?: MemberProfilePresentationMode;
  onPresentationChange?: (mode: MemberProfilePresentationMode) => void;
  showPresentationSwitch?: boolean;
}

export const MemberProfileView = ({
  profile,
  canViewPublicCardFields,
  canViewTrustedFields,
  isSelf,
  userId,
  userLoggedIn,
  buddyRel,
  buddyBusy,
  buddyMessage,
  onBuddyMessage,
  onSendBuddyRequest,
  onAcceptBuddyRequest,
  onDeclineBuddyRequest,
  onCancelBuddyRequest,
  onMessage,
  upcomingActivities = [],
  pastActivities = [],
  activitiesLoading = false,
  activitiesDeferActive = false,
  onRequestMemberActivities,
  socialGraph = null,
  socialGraphLoading = false,
  socialGraphLoadingFriends = false,
  socialGraphLoadingCommon = false,
  socialGraphDeferActive = false,
  onRequestSocialGraph,
  presentation = 'social',
  onPresentationChange,
  showPresentationSwitch = false,
}: MemberProfileViewProps) => {
  const roleLabel = resolvePublicMemberRoleLabel(profile);
  const languages = parseLanguagesList(profile.languages);
  const birthdayMonthDayLabel = profile.monthDay
    ? formatProfileMonthDayLabel(profile.monthDay)
    : null;
  const hasDetails = Boolean(
    profile.city ||
      languages.length > 0 ||
      profile.age != null ||
      profile.birthYear != null ||
      birthdayMonthDayLabel ||
      profile.dateOfBirth
  );
  const showConnectActions = !isSelf && userLoggedIn;
  const joinedLabel = formatMemberJoinedLabel(profile.memberSince);
  const profileLink = memberProfileLink(userId);
  const publishingTenantId = profile.publishingTenantId?.trim() || null;
  const showHostSurfaces =
    profile.isHost || profile.isGuideStaff || (profile.stats?.activitiesHosted ?? 0) > 0;
  const hostView = presentation === 'host';
  return (
    <div className="min-h-0 space-y-3 overflow-y-auto pb-nav-safe animate-fade-up">
      <div className="space-y-3">
      {showPresentationSwitch && onPresentationChange ? (
        <MemberProfilePresentationSwitch mode={presentation} onChange={onPresentationChange} />
      ) : null}
      <GlassCard padding className="!p-0 overflow-hidden">
        <div className="relative bg-gradient-to-b from-emerald-50/90 to-white px-5 pb-5 pt-6 text-center lg:flex lg:items-start lg:gap-5 lg:px-5 lg:py-4 lg:text-left">
          <div className="absolute right-3 top-3 flex items-center gap-1">
            <ShareButton
              title={`${profile.displayName} on UAE Trail`}
              text={`${profile.displayName} on UAE Trail — find hikes, camps, and outdoor activities across the UAE.`}
              path={profileLink}
              iconOnly
              light
            />
          </div>
          <SecureAvatar
            src={profile.avatarUrl}
            name={profile.displayName}
            className="mx-auto h-24 w-24 text-2xl ring-4 ring-white shadow-md lg:mx-0 lg:h-16 lg:w-16 lg:text-lg"
          />

          <div className="min-w-0 flex-1 lg:pt-1">
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-neutral-900 lg:mt-0 lg:text-xl">{profile.displayName}</h1>
          <p className="mt-1 text-sm font-medium text-neutral-500">{roleLabel}</p>
          {profile.linkedOperatorName && profile.hostProfilePath ? (
            <Link
              to={profile.hostProfilePath}
              className="mt-2 inline-block text-sm font-semibold text-emerald-700 hover:text-emerald-800"
            >
              {profile.linkedOperatorName}
            </Link>
          ) : null}
          {joinedLabel ? (
            <p className="mt-1.5 text-xs font-semibold text-neutral-500">{joinedLabel}</p>
          ) : null}
          {canViewTrustedFields && publishingTenantId && hostView ? (
            <div className="mt-2 flex justify-center lg:justify-start">
              <TenantHostRatingInline tenantId={publishingTenantId} variant="host" linkToReviews />
            </div>
          ) : null}

          {showConnectActions ? (
            <div className="lg:max-w-sm">
            <MemberProfileFriendActions
              buddyRel={buddyRel}
              buddyBusy={buddyBusy}
              onSendBuddyRequest={onSendBuddyRequest}
              onAcceptBuddyRequest={onAcceptBuddyRequest}
              onDeclineBuddyRequest={onDeclineBuddyRequest}
              onCancelBuddyRequest={onCancelBuddyRequest}
              onMessage={onMessage}
            />
            </div>
          ) : null}

          {!isSelf && !userLoggedIn ? (
            <Link
              to={SIGNIN_PATH}
              state={{ from: profileLink }}
              className="mt-4 inline-block text-sm font-semibold text-emerald-700"
            >
              Log in to add as friend or message
            </Link>
          ) : null}

          {buddyMessage ? (
            <p className="mt-2 text-center text-xs font-medium text-neutral-600 lg:text-left">{buddyMessage}</p>
          ) : null}
          </div>
        </div>

        {profile.stats ? (
          <div className="grid grid-cols-2 divide-x divide-neutral-100 border-t border-neutral-100">
            <StatBlock label="Activities joined" value={profile.stats.activitiesAttended} />
            <StatBlock label="Activities hosted" value={profile.stats.activitiesHosted} />
          </div>
        ) : null}
      </GlassCard>

      {canViewPublicCardFields && profile.bio && (
        <GlassCard padding>
          <SectionHeading>About</SectionHeading>
          <p className="text-[15px] leading-7 text-neutral-700 whitespace-pre-line">{profile.bio}</p>
        </GlassCard>
      )}

      {canViewPublicCardFields &&
      profile.badges.some((badge) => badge.earned) ? (
        <MemberProfileHostGuidePanel
          profile={profile}
          showHostingDetails={canViewTrustedFields && showHostSurfaces && hostView}
        />
      ) : canViewTrustedFields && showHostSurfaces && hostView ? (
        <MemberProfileHostGuidePanel profile={profile} showHostingDetails />
      ) : null}

      {canViewTrustedFields && profile.yearGoal ? (
        <PublicMemberYearGoal goal={profile.yearGoal} />
      ) : null}

      {canViewPublicCardFields && hasDetails && (
        <GlassCard padding>
          <SectionHeading>Details</SectionHeading>
          <div className="space-y-4">
            {profile.city && (
              <DetailRow icon="📍" label="Based in">
                <p className="text-[15px] font-semibold text-neutral-900">{profile.city}</p>
              </DetailRow>
            )}
            {profile.dateOfBirth ? (
              <DetailRow icon="🎂" label="Date of birth">
                <p className="text-[15px] font-semibold text-neutral-900">{profile.dateOfBirth}</p>
              </DetailRow>
            ) : birthdayMonthDayLabel ? (
              <DetailRow icon="🎂" label="Birthday">
                <p className="text-[15px] font-semibold text-neutral-900">{birthdayMonthDayLabel}</p>
              </DetailRow>
            ) : null}
            {languages.length > 0 && (
              <DetailRow icon="🗣️" label="Speaks">
                <div className="flex flex-wrap gap-1.5">
                  {languages.map((language) => (
                    <span
                      key={language}
                      className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-100"
                    >
                      {language}
                    </span>
                  ))}
                </div>
              </DetailRow>
            )}
          </div>
        </GlassCard>
      )}

      <MemberProfileSocialGraphAnchor
        active={socialGraphDeferActive}
        onVisible={() => onRequestSocialGraph?.()}
      >
        <MemberProfileSocialSections
          graph={socialGraph}
          loading={socialGraphLoading}
          loadingFriends={socialGraphLoadingFriends}
          loadingCommonFollows={socialGraphLoadingCommon}
          userLoggedIn={userLoggedIn}
          isSelf={isSelf}
        />
      </MemberProfileSocialGraphAnchor>

      <MemberProfileDeferredSectionAnchor
        active={activitiesDeferActive}
        onVisible={() => onRequestMemberActivities?.()}
      >
        {activitiesLoading ? (
          <GlassCard padding>
            <p className="text-sm text-neutral-500">Loading activities…</p>
          </GlassCard>
        ) : null}

        {upcomingActivities.length > 0 && (!showHostSurfaces || hostView) ? (
          <GlassCard padding className="space-y-3">
            <AccountSectionHeader
              title={hostView && showHostSurfaces ? 'Upcoming on the map' : 'Upcoming activities'}
            />
            <div className="space-y-2">
              {upcomingActivities.map((activity) => (
                <ProfileActivityListRow key={activity.id} activity={activity} />
              ))}
            </div>
          </GlassCard>
        ) : null}

        {pastActivities.length > 0 ? (
          <GlassCard padding className="space-y-3">
            <AccountSectionHeader title="Trip history" />
            <div className="space-y-2">
              {pastActivities.map((activity) => (
                <ProfileActivityListRow key={activity.id} activity={activity} />
              ))}
            </div>
          </GlassCard>
        ) : null}
      </MemberProfileDeferredSectionAnchor>

      {profile.vehicles && profile.vehicles.length > 0 ? (
        <GlassCard padding className="space-y-3">
          <SectionHeading>My cars</SectionHeading>
          <ul className="space-y-2">
            {profile.vehicles.map((vehicle) => (
              <li
                key={vehicle.id}
                className="rounded-xl border border-neutral-100 bg-neutral-50 px-3 py-2 text-sm text-neutral-800"
              >
                <p className="font-semibold text-neutral-900">{formatRideshareVehicleLabel(vehicle)}</p>
                {vehicle.plateNumber ? (
                  <p className="mt-0.5 text-xs font-medium text-neutral-500">Plate {vehicle.plateNumber}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </GlassCard>
      ) : null}

      {hostView && canViewTrustedFields && publishingTenantId ? (
        <MemberProfileHostReviews publishingTenantId={publishingTenantId} />
      ) : hostView && canViewTrustedFields && showHostSurfaces ? (
        <GlassCard padding id="reviews" className="scroll-mt-24">
          <SectionHeading>Host reviews</SectionHeading>
          <p className="text-sm leading-relaxed text-neutral-600">
            No community host reviews yet. Ratings show up here after people join their outings on
            the map.
          </p>
        </GlassCard>
      ) : null}

      {showConnectActions && !hostView ? (
        <GlassCard padding className="space-y-3">
          <SectionHeading>More</SectionHeading>
          <MemberFollowControls targetUserId={userId} onStatusMessage={onBuddyMessage} />
        </GlassCard>
      ) : null}
      </div>
    </div>
  );
};
