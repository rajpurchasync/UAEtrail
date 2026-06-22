import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  Copy,
  Gift,
  MapPin,
  MessageCircle,
  Mountain,
  Share2,
  Star,
  Trophy,
  Users,
  Check,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { RewardLeaderboardEntryDTO, RewardSummaryDTO } from '@uaetrail/shared-types';
import { api } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { GlassCard } from '../components/mobile/GlassCard';
import { MembershipTierBadge } from '../components/ui/MembershipTierBadge';
import { TrailPointsProgressCard, TierUnlockShareCard } from '../components/rewards';
import { PAGE_BANNERS } from '../config/pageBanners';

const EARN_ICONS: Record<string, typeof MapPin> = {
  LOCATION_SUBMITTED: MapPin,
  EVENT_PUBLISHED: Mountain,
  TRIP_ATTENDED: Users,
  COMMUNITY_POST: MessageCircle,
  COMMUNITY_REPLY: MessageCircle,
  REVIEW_WRITTEN: Star,
  REFERRAL_BONUS_REFERRER: Gift,
};

/** Logged-in Trail Points wallet & badges. */
export const MyRewards = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<RewardSummaryDTO | null>(null);
  const [leaderboard, setLeaderboard] = useState<RewardLeaderboardEntryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
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
  }, [user]);

  const inviteLink = useMemo(() => {
    if (!summary?.referralCode) return '';
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/signup?ref=${summary.referralCode}`;
  }, [summary?.referralCode]);

  const progressPercent = useMemo(() => {
    if (!summary?.nextTier) return 100;
    const currentMin = summary.membershipTier.minPoints;
    const nextMin = summary.nextTier.minPoints;
    const span = nextMin - currentMin;
    if (span <= 0) return 100;
    return Math.min(100, Math.round(((summary.points - currentMin) / span) * 100));
  }, [summary]);

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

  return (
    <ConsumerShell
      layout="stack"
      title="My Trail Points"
      banner={{ src: PAGE_BANNERS.profile, alt: 'Mountain landscape' }}
    >
      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        </div>
      )}

      {error && (
        <GlassCard padding className="mb-3 border-red-200/50 bg-red-50/50">
          <p className="text-sm text-red-600">{error}</p>
        </GlassCard>
      )}

      {summary && !loading && (
        <div className="space-y-4 animate-fade-up">
          <GlassCard padding className="bg-gradient-to-br from-emerald-600 to-emerald-800 text-white border-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-emerald-100 text-xs font-semibold uppercase tracking-wider mb-1">Your balance</p>
                <p className="text-4xl font-extrabold tracking-tight">{summary.points.toLocaleString()}</p>
                <p className="text-emerald-100 text-sm mt-1">Trail Points</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center text-2xl">
                {summary.membershipTier.emoji ?? '🌱'}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <MembershipTierBadge
                tierKey={summary.membershipTier.key}
                name={summary.membershipTier.name}
                emoji={summary.membershipTier.emoji}
                size="md"
              />
              {summary.membershipTier.key === 'free' && (
                <span className="text-emerald-100 text-sm">Earn points to unlock Active</span>
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-white/20">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="font-semibold">{summary.membershipTier.name} tier</span>
                {summary.nextTier ? (
                  <span className="text-emerald-100">
                    {summary.nextTier.pointsRemaining} pts to {summary.nextTier.name}
                  </span>
                ) : (
                  <span className="text-emerald-100">GOAT — highest tier</span>
                )}
              </div>
              <div className="h-2 rounded-full bg-white/20 overflow-hidden">
                <div
                  className="h-full rounded-full bg-white transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </GlassCard>

          {summary.membershipTier.benefits && summary.membershipTier.benefits.length > 0 && (
            <GlassCard padding>
              <h2 className="font-bold text-gray-900 mb-2">Your tier benefits</h2>
              <ul className="space-y-1.5">
                {summary.membershipTier.benefits.map((b) => (
                  <li key={b} className="text-sm text-gray-600 flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
            </GlassCard>
          )}

          <TierUnlockShareCard tier={summary.membershipTier} referralCode={summary.referralCode} />

          {summary.pathToNextTier && (
            <TrailPointsProgressCard summary={summary} />
          )}

          <Link
            to="/trail-points"
            className="flex items-center justify-between gap-2 px-4 py-3 bg-white rounded-xl border border-gray-100 text-sm font-medium text-emerald-700 hover:bg-emerald-50 transition-colors"
          >
            How Trail Points & tiers work
            <ExternalLink className="w-4 h-4" />
          </Link>

          <GlassCard padding>
            <div className="flex items-center gap-2 mb-2">
              <Share2 className="w-4 h-4 text-emerald-600" />
              <h2 className="font-bold text-gray-900">Invite friends</h2>
            </div>
            <p className="text-sm text-gray-500 mb-3">
              Share your link — you earn <strong>50 pts</strong> when they join, they get <strong>25 pts</strong>.
            </p>
            <div className="flex gap-2">
              <input
                readOnly
                value={inviteLink}
                className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-700 truncate"
              />
              <button
                type="button"
                onClick={copyInvite}
                className="shrink-0 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold flex items-center gap-1.5 hover:bg-emerald-700 transition-colors"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </GlassCard>

          <GlassCard padding>
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-4 h-4 text-amber-500" />
              <h2 className="font-bold text-gray-900">Tier badges</h2>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {summary.tierBadges.map((badge) => (
                <div
                  key={badge.key}
                  className={`p-3 rounded-xl border text-center ${
                    badge.earned ? 'border-amber-200 bg-amber-50/80' : 'border-gray-100 bg-gray-50/50 opacity-50'
                  }`}
                >
                  <span className="text-2xl block mb-1">{badge.emoji}</span>
                  <p className="text-xs font-semibold text-gray-900">{badge.name}</p>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard padding>
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-4 h-4 text-emerald-600" />
              <h2 className="font-bold text-gray-900">Achievements</h2>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {summary.badges.map((badge) => (
                <div
                  key={badge.key}
                  className={`p-3 rounded-xl border text-center ${
                    badge.earned ? 'border-emerald-200 bg-emerald-50/80' : 'border-gray-100 bg-gray-50/50 opacity-60'
                  }`}
                >
                  <span className="text-2xl block mb-1">{badge.emoji}</span>
                  <p className="text-xs font-semibold text-gray-900">{badge.name}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">{badge.description}</p>
                </div>
              ))}
            </div>
          </GlassCard>

          {leaderboard.length > 0 && (
            <GlassCard padding>
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="w-4 h-4 text-emerald-600" />
                <h2 className="font-bold text-gray-900">Top contributors</h2>
              </div>
              <ul className="space-y-2">
                {leaderboard.map((entry) => (
                  <li key={entry.userId} className="flex items-center gap-3 py-2">
                    <span className="w-6 text-center text-sm font-bold text-gray-400">#{entry.rank}</span>
                    {entry.avatarUrl ? (
                      <img src={entry.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs font-bold">
                        {entry.displayName.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{entry.displayName}</p>
                      <p className="text-xs text-gray-500">{entry.tier ?? entry.level}</p>
                    </div>
                    <span className="text-sm font-bold text-emerald-700">{entry.points}</span>
                  </li>
                ))}
              </ul>
            </GlassCard>
          )}

          {summary.recentActivity.length > 0 && (
            <GlassCard padding>
              <h2 className="font-bold text-gray-900 mb-3">Recent activity</h2>
              <ul className="space-y-2">
                {summary.recentActivity.map((entry) => {
                  const Icon = EARN_ICONS[entry.action] ?? Award;
                  return (
                    <li key={entry.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 truncate">{entry.label}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(entry.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-emerald-600">+{entry.points}</span>
                    </li>
                  );
                })}
              </ul>
            </GlassCard>
          )}
        </div>
      )}
    </ConsumerShell>
  );
};
