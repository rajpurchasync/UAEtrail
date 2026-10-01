import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import {
  Award,
  BookOpen,
  ChevronRight,
  Gift,
  Loader2,
  Share2,
  Sparkles,
  Users,
} from 'lucide-react';
import type { RewardLeaderboardEntryDTO, RewardSummaryDTO } from '@uaetrail/shared-types';
import { api } from '../api/index';
import { useAuth } from '../context/AuthContext';
import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { GlassCard } from '../components/mobile/GlassCard';
import {
  TrailPointsBalanceHero,
  TrailPointsHubPanels,
  TrailPointsTapCard,
  type TrailPointsHubPanel,
} from '../components/rewards';

/** Logged-in Trail Points wallet — tap-card hub with detail sheets. */
const PANEL_FROM_QUERY = new Set<TrailPointsHubPanel>([
  'earn',
  'badges',
  'invite',
  'activity',
  'tiers',
  'share',
]);

const parseRewardsPanel = (raw: string | null): TrailPointsHubPanel | null => {
  if (!raw || !PANEL_FROM_QUERY.has(raw as TrailPointsHubPanel)) return null;
  return raw as TrailPointsHubPanel;
};

export const MyRewards = () => {
  const { user, initializing } = useAuth();
  const [searchParams] = useSearchParams();
  const [summary, setSummary] = useState<RewardSummaryDTO | null>(null);
  const [leaderboard, setLeaderboard] = useState<RewardLeaderboardEntryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [panel, setPanel] = useState<TrailPointsHubPanel>(() =>
    parseRewardsPanel(searchParams.get('panel'))
  );

  useEffect(() => {
    setPanel(parseRewardsPanel(searchParams.get('panel')));
  }, [searchParams]);

  useEffect(() => {
    if (initializing) return;
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([api.getMyRewards(), api.getRewardsLeaderboard()])
      .then(([rewardsRes, boardRes]) => {
        setSummary(rewardsRes.data);
        setLeaderboard(boardRes.data);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load rewards'))
      .finally(() => setLoading(false));
  }, [user, initializing]);

  const inviteLink = useMemo(() => {
    if (!summary?.referralCode) return '';
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/signup?ref=${summary.referralCode}`;
  }, [summary?.referralCode]);

  const copyInvite = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Could not copy link');
    }
  };

  if (!initializing && !user) {
    return <Navigate to="/signin?redirect=%2Fmy-rewards" replace />;
  }

  const closePanel = () => setPanel(null);
  const showShare = summary && summary.membershipTier.key !== 'free';

  return (
    <ConsumerShell
      layout="stack"
      title="Trail Points"
      showJourney={false}
      back={{ fallbackTo: '/profile', label: 'Profile' }}
    >
      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      )}

      {error && (
        <GlassCard padding className="mb-3 border-red-200/50 bg-red-50/50">
          <p className="text-sm text-red-600">{error}</p>
        </GlassCard>
      )}

      {!loading && summary?.trailPointsEligible === false && (
        <GlassCard padding>
          <p className="text-sm leading-relaxed text-neutral-600">
            Trail Points are for participants and guide staff. Business host accounts manage events on the
            platform but do not earn personal Trail Points.
          </p>
        </GlassCard>
      )}

      {summary && summary.trailPointsEligible !== false && !loading && (
        <div className="animate-fade-up space-y-3 pb-nav-safe">
          <TrailPointsBalanceHero summary={summary} />

          <div className="space-y-2">
            <TrailPointsTapCard
              icon={Sparkles}
              title="Earn more"
              subtitle="Quick wins to reach your next tier"
              badge={
                summary.nextTier ? (
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                    +{summary.nextTier.pointsRemaining}
                  </span>
                ) : undefined
              }
              onClick={() => setPanel('earn')}
            />
            <TrailPointsTapCard
              icon={Award}
              title="Badges"
              subtitle={`${summary.badges.filter((b) => b.earned).length} achievements unlocked`}
              onClick={() => setPanel('badges')}
            />
            <TrailPointsTapCard
              icon={Gift}
              title="Invite friends"
              subtitle="You +50 pts · they +25 pts"
              onClick={() => setPanel('invite')}
            />
            <TrailPointsTapCard
              icon={Users}
              title="Activity & leaderboard"
              subtitle="Recent points and top contributors"
              onClick={() => setPanel('activity')}
            />
            <TrailPointsTapCard
              icon={BookOpen}
              title="How tiers work"
              subtitle="Active, Pro, and GOAT explained"
              onClick={() => setPanel('tiers')}
            />
            {showShare && (
              <TrailPointsTapCard
                icon={Share2}
                title="Share your tier"
                subtitle="Show off your trail status"
                onClick={() => setPanel('share')}
              />
            )}
          </div>

          <Link
            to="/trail-points"
            className="flex items-center justify-center gap-1 py-2 text-sm font-semibold text-emerald-700"
          >
            How Trail Points work
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {summary && (
        <TrailPointsHubPanels
          panel={panel}
          onClose={closePanel}
          summary={summary}
          leaderboard={leaderboard}
          inviteLink={inviteLink}
          copied={copied}
          onCopyInvite={copyInvite}
        />
      )}
    </ConsumerShell>
  );
};
