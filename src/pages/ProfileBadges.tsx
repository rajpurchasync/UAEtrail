import { useMemo, useState } from 'react';
import type { RewardBadgeDTO } from '@uaetrail/shared-types';
import { useAuth } from '../context/AuthContext';
import { useMemberBadges } from '../hooks/useMemberBadges';
import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { ConsumerLoadingSpinner, ConsumerErrorCard } from '../components/mobile/ConsumerFeedback';
import { PageMeta } from '../components/seo/PageMeta';
import { ProfileBadgeDetailDialog } from '../components/profile/ProfileBadgeDetailDialog';
import { ProfileBadgeListCard } from '../components/profile/ProfileBadgeListCard';
import { resolveProfileSharePath } from '../utils/profileShare';
import { useMemberStatus } from '../hooks/useMemberStatus';
import { sortBadgesByCatalogOrder } from '../constants/memberBadges';
import { memberProfileLink } from '../config/routingCatalog';

const BadgeSection = ({
  title,
  badges,
  onSelect,
  emptyMessage,
}: {
  title: string;
  badges: RewardBadgeDTO[];
  onSelect: (badge: RewardBadgeDTO) => void;
  emptyMessage?: string;
}) => (
  <section aria-labelledby={`badge-section-${title}`}>
    <h2 id={`badge-section-${title}`} className="mb-2 text-sm font-bold text-neutral-900">
      {title}
    </h2>
    {badges.length === 0 && emptyMessage ? (
      <p className="mb-1 text-sm text-neutral-500">{emptyMessage}</p>
    ) : null}
    {badges.length > 0 ? (
      <ul className="grid grid-cols-2 gap-2.5">
        {badges.map((badge) => (
          <li key={badge.key} className="min-w-0">
            <ProfileBadgeListCard badge={badge} onSelect={() => onSelect(badge)} />
          </li>
        ))}
      </ul>
    ) : null}
  </section>
);

export const ProfileBadges = () => {
  const { user } = useAuth();
  const { ownedProfiles } = useMemberStatus({ enabled: Boolean(user) });
  const { badges, loading, error } = useMemberBadges(user?.id);
  const [selected, setSelected] = useState<RewardBadgeDTO | null>(null);

  const displayName = user?.displayName ?? 'Explorer';
  const sharePath = resolveProfileSharePath(ownedProfiles, {
    fallbackPath: user?.id ? memberProfileLink(user.id) : '/explore',
  });

  const earned = useMemo(
    () => sortBadgesByCatalogOrder(badges.filter((b) => b.earned)),
    [badges]
  );
  const pipeline = useMemo(
    () => sortBadgesByCatalogOrder(badges.filter((b) => !b.earned)),
    [badges]
  );

  return (
    <ConsumerShell
      layout="stack"
      title="My badges"
      maxWidth="4xl"
      showJourney={false}
      back={{ fallbackTo: '/profile', label: 'Profile' }}
    >
      <PageMeta title="My badges" noIndex />

      {loading ? (
        <ConsumerLoadingSpinner />
      ) : error ? (
        <ConsumerErrorCard message={error} />
      ) : (
        <div className="space-y-6 pb-nav-safe animate-fade-up">
          <p className="text-sm text-neutral-600">Tap a badge for details.</p>

          <BadgeSection
            title="Earned"
            badges={earned}
            onSelect={setSelected}
            emptyMessage="Your first badge shows up here after you get outside with the community."
          />

          <BadgeSection title="Pipeline" badges={pipeline} onSelect={setSelected} />
        </div>
      )}

      <ProfileBadgeDetailDialog
        badge={selected}
        displayName={displayName}
        sharePath={sharePath}
        onClose={() => setSelected(null)}
      />
    </ConsumerShell>
  );
};
