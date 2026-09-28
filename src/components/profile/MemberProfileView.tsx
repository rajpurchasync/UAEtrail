import { Link } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import type { ActivityDTO, BuddyRelationshipDTO } from '@uaetrail/shared-types';
import type { PersonPublicProfileDTO } from '../../api/index';
import { GlassCard } from '../mobile/GlassCard';
import { AppButton } from '../mobile/AppButton';
import { ProfileStampsRow } from './ProfileStampsRow';
import { PublicProfileSectionHeading } from './PublicProfileSectionHeading';
import { SecureAvatar } from '../ui/SecureAvatar';
import { MembershipTierBadge } from '../ui/MembershipTierBadge';
import { ShareButton } from '../ui/ShareButton';
import { ProfileActivityListRow } from './ProfileActivityListRow';
import { AccountSectionHeader } from '../account/AccountSectionHeader';
import type { ProfileStamp } from '../../utils/profileStamps';
import { formatMemberAge } from '../../utils/profileAge';
import { parseLanguagesList } from '../../utils/profileLanguages';
import { resolvePublicMemberRoleLabel } from '../../utils/profileRoleLabel';

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
  stamps: ProfileStamp[];
  isSelf: boolean;
  userId: string;
  userLoggedIn: boolean;
  buddyRel: BuddyRelationshipDTO | null;
  buddyBusy: boolean;
  buddyMessage: string | null;
  onSendBuddyRequest: () => void;
  onAcceptBuddyRequest: () => void;
  onDeclineBuddyRequest: () => void;
  onMessage: () => void;
  hostedActivities?: ActivityDTO[];
}

export const MemberProfileView = ({
  profile,
  stamps,
  isSelf,
  userId,
  userLoggedIn,
  buddyRel,
  buddyBusy,
  buddyMessage,
  onSendBuddyRequest,
  onAcceptBuddyRequest,
  onDeclineBuddyRequest,
  onMessage,
  hostedActivities = [],
}: MemberProfileViewProps) => {
  const roleLabel = resolvePublicMemberRoleLabel(profile);
  const languages = parseLanguagesList(profile.languages);
  const hasDetails = Boolean(profile.city || profile.age != null || languages.length > 0);
  const showConnectActions = !isSelf && userLoggedIn;

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

          {profile.trailPointsEligible && profile.membershipTier.key !== 'free' && (
            <div className="mt-3 flex justify-center">
              <MembershipTierBadge
                tierKey={profile.membershipTier.key}
                name={profile.membershipTier.name}
                size="md"
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 divide-x divide-neutral-100 border-t border-neutral-100">
          <StatBlock label="Activities joined" value={profile.stats.activitiesAttended} />
          <StatBlock label="Activities hosted" value={profile.stats.activitiesHosted} />
        </div>
      </GlassCard>

      {hasDetails && (
        <GlassCard padding>
          <SectionHeading>Details</SectionHeading>
          <div className="space-y-4">
            {profile.city && (
              <DetailRow icon="📍" label="Based in">
                <p className="text-[15px] font-semibold text-neutral-900">{profile.city}</p>
              </DetailRow>
            )}
            {formatMemberAge(profile.age) && (
              <DetailRow icon="🎂" label="Age">
                <p className="text-[15px] font-semibold text-neutral-900">{formatMemberAge(profile.age)}</p>
              </DetailRow>
            )}
            {languages.length > 0 && (
              <DetailRow icon="🗣️" label="Languages">
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

      {stamps.length > 0 && (
        <GlassCard padding>
          <ProfileStampsRow stamps={stamps} title="Badges" align="start" />
        </GlassCard>
      )}

      {hostedActivities.length > 0 && (
        <GlassCard padding className="space-y-3">
          <AccountSectionHeader
            title="Activities hosted"
            actionTo={profile.hostProfilePath ?? undefined}
            actionLabel={profile.hostProfilePath ? 'Host profile' : undefined}
          />
          <div className="space-y-2">
            {hostedActivities.map((activity) => (
              <ProfileActivityListRow key={activity.id} activity={activity} />
            ))}
          </div>
        </GlassCard>
      )}

      {(showConnectActions || profile.hostProfilePath || (!isSelf && !userLoggedIn)) && (
        <GlassCard padding className="space-y-3">
          <SectionHeading>Connect</SectionHeading>

          {profile.hostProfilePath && (
            <Link
              to={profile.hostProfilePath}
              className="ios-btn glass w-full text-neutral-900 active:bg-white/80"
            >
              View host profile
            </Link>
          )}

          {showConnectActions && (
            <>
              <AppButton type="button" fullWidth onClick={onMessage}>
                Message
              </AppButton>

              {buddyRel?.areBuddies ? (
                <p className="text-center text-sm font-semibold text-emerald-700">Connected as buddies</p>
              ) : buddyRel?.incomingRequest ? (
                <div className="flex gap-2">
                  <AppButton type="button" className="flex-1" disabled={buddyBusy} onClick={onAcceptBuddyRequest}>
                    Accept buddy
                  </AppButton>
                  <AppButton
                    type="button"
                    variant="secondary"
                    className="flex-1"
                    disabled={buddyBusy}
                    onClick={onDeclineBuddyRequest}
                  >
                    Decline
                  </AppButton>
                </div>
              ) : buddyRel?.outgoingRequest ? (
                <p className="text-center text-sm font-semibold text-neutral-600">Buddy request sent</p>
              ) : buddyRel?.canSendRequest ? (
                <AppButton type="button" variant="secondary" fullWidth disabled={buddyBusy} onClick={onSendBuddyRequest}>
                  <UserPlus className="mr-2 inline h-4 w-4" />
                  Add buddy
                </AppButton>
              ) : null}

              {buddyMessage && <p className="text-center text-xs text-neutral-600">{buddyMessage}</p>}
            </>
          )}

          {!isSelf && !userLoggedIn && (
            <Link
              to="/signin"
              state={{ from: `/member/${profile.id}` }}
              className="block text-center text-sm font-semibold text-emerald-700"
            >
              Log in to message or connect
            </Link>
          )}
        </GlassCard>
      )}
    </div>
  );
};
