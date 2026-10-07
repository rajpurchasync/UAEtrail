import { Link } from 'react-router-dom';
import { SIGNIN_PATH } from '../../config/routingCatalog';
import type { ActivityDTO, BuddyRelationshipDTO } from '@uaetrail/shared-types';
import { MemberFollowControls } from './MemberFollowControls';
import { MemberProfileBuddyActions } from './MemberProfileBuddyActions';
import type { PersonPublicProfileDTO } from '../../api/index';
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
}

export const MemberProfileView = ({
  profile,
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
}: MemberProfileViewProps) => {
  const roleLabel = resolvePublicMemberRoleLabel(profile);
  const languages = parseLanguagesList(profile.languages);
  const hasDetails = Boolean(profile.city || languages.length > 0);
  const showConnectActions = !isSelf && userLoggedIn;
  const joinedLabel = formatMemberJoinedLabel(profile.memberSince);
  return (
    <div className="space-y-3 pb-nav-safe animate-fade-up">
      <GlassCard padding className="!p-0 overflow-hidden">
        <div className="relative bg-gradient-to-b from-emerald-50/90 to-white px-5 pb-5 pt-6 text-center">
          <div className="absolute right-3 top-3 flex items-center gap-1">
            <ShareButton
              title={`${profile.displayName} on UAE Trail`}
              text={`${profile.displayName} on UAE Trail — find hikes, camps, and outdoor activities across the UAE.`}
              path={`/member/${userId}`}
              iconOnly
              light
            />
          </div>
          <SecureAvatar
            src={profile.avatarUrl}
            name={profile.displayName}
            className="mx-auto h-24 w-24 text-2xl ring-4 ring-white shadow-md"
          />

          <h1 className="mt-4 text-2xl font-bold tracking-tight text-neutral-900">{profile.displayName}</h1>
          <p className="mt-1 text-sm font-medium text-neutral-500">{roleLabel}</p>
          {joinedLabel ? (
            <p className="mt-1.5 text-xs font-semibold text-neutral-500">{joinedLabel}</p>
          ) : null}

          {showConnectActions ? (
            <MemberProfileBuddyActions
              buddyRel={buddyRel}
              buddyBusy={buddyBusy}
              onSendBuddyRequest={onSendBuddyRequest}
              onAcceptBuddyRequest={onAcceptBuddyRequest}
              onDeclineBuddyRequest={onDeclineBuddyRequest}
              onCancelBuddyRequest={onCancelBuddyRequest}
              onMessage={onMessage}
            />
          ) : null}

          {!isSelf && !userLoggedIn ? (
            <Link
              to={SIGNIN_PATH}
              state={{ from: `/member/${profile.id}` }}
              className="mt-4 inline-block text-sm font-semibold text-emerald-700"
            >
              Log in to add as friend or message
            </Link>
          ) : null}

          {buddyMessage ? (
            <p className="mt-2 text-center text-xs font-medium text-neutral-600">{buddyMessage}</p>
          ) : null}
        </div>

        <div className="grid grid-cols-2 divide-x divide-neutral-100 border-t border-neutral-100">
          <StatBlock label="Activities joined" value={profile.stats.activitiesAttended} />
          <StatBlock label="Activities hosted" value={profile.stats.activitiesHosted} />
        </div>
      </GlassCard>

      {profile.yearGoal ? <PublicMemberYearGoal goal={profile.yearGoal} /> : null}

      {hasDetails && (
        <GlassCard padding>
          <SectionHeading>Details</SectionHeading>
          <div className="space-y-4">
            {profile.city && (
              <DetailRow icon="📍" label="Based in">
                <p className="text-[15px] font-semibold text-neutral-900">{profile.city}</p>
              </DetailRow>
            )}
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

      {profile.bio && (
        <GlassCard padding>
          <SectionHeading>About</SectionHeading>
          <p className="text-[15px] leading-7 text-neutral-700 whitespace-pre-line">{profile.bio}</p>
        </GlassCard>
      )}

      {upcomingActivities.length > 0 && (
        <GlassCard padding className="space-y-3">
          <AccountSectionHeader title="Upcoming activities" />
          <div className="space-y-2">
            {upcomingActivities.map((activity) => (
              <ProfileActivityListRow key={activity.id} activity={activity} />
            ))}
          </div>
        </GlassCard>
      )}

      {(showConnectActions || profile.hostProfilePath) && (
        <GlassCard padding className="space-y-3">
          <SectionHeading>More</SectionHeading>

          {profile.hostProfilePath && (
            <Link
              to={profile.hostProfilePath}
              className="ios-btn glass w-full text-neutral-900 active:bg-white/80"
            >
              View host profile
            </Link>
          )}

          {showConnectActions && (
            <MemberFollowControls targetUserId={userId} onStatusMessage={onBuddyMessage} />
          )}
        </GlassCard>
      )}
    </div>
  );
};
