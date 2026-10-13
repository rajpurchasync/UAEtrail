import { useMemo, useState } from 'react';
import { useSafeAsyncEffect } from '../hooks/useSafeAsyncEffect';
import type { RewardBadgeDTO } from '@uaetrail/shared-types';
import { fetchMemberBadges } from '../hooks/memberProfileApi';
import { useAuth } from '../context/AuthContext';
import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { ConsumerLoadingSpinner, ConsumerErrorCard } from '../components/mobile/ConsumerFeedback';
import { PageMeta } from '../components/seo/PageMeta';
import { ProfileBadgeDetailDialog } from '../components/profile/ProfileBadgeDetailDialog';
import { ProfileBadgeListCard } from '../components/profile/ProfileBadgeListCard';
import { resolveProfileSharePath } from '../utils/profileShare';
import { useHostStatus } from '../hooks/useHostStatus';
import { sortBadgesByCatalogOrder } from '../constants/memberBadges';

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
  const { ownedProfiles } = useHostStatus({ enabled: Boolean(user) });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [badges, setBadges] = useState<RewardBadgeDTO[]>([]);
  const [selected, setSelected] = useState<RewardBadgeDTO | null>(null);

  const displayName = user?.displayName ?? 'Explorer';
  const sharePath = resolveProfileSharePath(ownedProfiles, {
    fallbackPath: user?.id ? `/member/${user.id}` : '/explore',
  });

  useSafeAsyncEffect(async (isActive) => {
    if (isActive()) {
      setLoading(true);
    }
    try {
      const list = await fetchMemberBadges();
      if (isActive()) {
        setBadges(list);
        setError(null);
      }
    } catch (err) {
      if (isActive()) {
        setError(err instanceof Error ? err.message : 'Could not load badges');
      }
    } finally {
      if (isActive()) {
        setLoading(false);
      }
    }
  }, []);

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
