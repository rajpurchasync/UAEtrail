import { Link } from 'react-router-dom';
import type { FullMemberProfile } from './MemberProfileView';
import { GlassCard } from '../mobile/GlassCard';
import { PublicProfileSectionHeading } from './PublicProfileSectionHeading';
import { TenantHostRatingInline } from '../reviews/TenantHostRatingInline';
import { memberProfileRoleLabel } from '../../member/memberProfileRoleLabel';

export const MemberProfileHostGuidePanel = ({
  profile,
  showHostingDetails = true,
}: {
  profile: FullMemberProfile;
  /** Trusted host surfaces — omit for public card (badges only). */
  showHostingDetails?: boolean;
}) => {
  const tenantId = profile.publishingTenantId?.trim() || null;
  const earnedBadges = profile.badges.filter((badge) => badge.earned);
  const roleLabel = profile.profileRoleLabel
    ? memberProfileRoleLabel(profile.profileRoleLabel)
    : profile.isHost
      ? 'Host'
      : null;
  const hostSurface =
    showHostingDetails && (profile.isHost || profile.isGuideStaff || profile.stats.activitiesHosted > 0);

  if (!hostSurface && earnedBadges.length === 0) return null;

  return (
    <GlassCard padding className="space-y-4">
      {hostSurface ? (
        <PublicProfileSectionHeading>Guide & hosting</PublicProfileSectionHeading>
      ) : (
        <PublicProfileSectionHeading>Badges</PublicProfileSectionHeading>
      )}
      {hostSurface && roleLabel ? <p className="text-sm font-semibold text-emerald-900">{roleLabel}</p> : null}
      {hostSurface && tenantId ? (
        <TenantHostRatingInline tenantId={tenantId} variant="host" linkToReviews />
      ) : hostSurface && profile.stats.activitiesHosted > 0 ? (
        <p className="text-sm text-neutral-600">
          Hosted {profile.stats.activitiesHosted.toLocaleString()} outing
          {profile.stats.activitiesHosted === 1 ? '' : 's'} on UAE Trail.
        </p>
      ) : null}
      {hostSurface && profile.hostProfilePath && profile.linkedOperatorName ? (
        <p className="text-sm text-neutral-700">
          Runs outings through{' '}
          <Link to={profile.hostProfilePath} className="font-semibold text-emerald-700 hover:underline">
            {profile.linkedOperatorName}
          </Link>
          .
        </p>
      ) : null}
      {earnedBadges.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {earnedBadges.map((badge) => (
            <li
              key={badge.key}
              title={badge.description}
              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50/80 px-3 py-1.5 text-xs font-semibold text-emerald-950"
            >
              <span aria-hidden>{badge.emoji}</span>
              {badge.name}
            </li>
          ))}
        </ul>
      ) : null}
    </GlassCard>
  );
};
