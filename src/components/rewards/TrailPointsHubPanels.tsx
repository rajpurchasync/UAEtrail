import { Link } from 'react-router-dom';
import {
  Award,
  Check,
  Copy,
  Gift,
  MapPin,
  MessageCircle,
  Mountain,
  Star,
  Trophy,
  Users,
} from 'lucide-react';
import type { RewardLeaderboardEntryDTO, RewardSummaryDTO } from '@uaetrail/shared-types';
import { MEMBERSHIP_TIERS, EARN_WAYS } from '../../constants/membershipTiers';
import { GlassCard } from '../mobile/GlassCard';
import { TrailPointsProgressCard } from './TrailPointsProgressCard';
import { TierUnlockShareCard } from './TierUnlockShareCard';
import { TrailPointsHubSheet } from './TrailPointsHubSheet';

const EARN_ICONS: Record<string, typeof MapPin> = {
  LOCATION_SUBMITTED: MapPin,
  ACTIVITY_PUBLISHED: Mountain,
  TRIP_ATTENDED: Users,
  COMMUNITY_POST: MessageCircle,
  COMMUNITY_REPLY: MessageCircle,
  REVIEW_WRITTEN: Star,
  REFERRAL_BONUS_REFERRER: Gift,
};

export type TrailPointsHubPanel = 'earn' | 'badges' | 'invite' | 'activity' | 'tiers' | 'share' | null;

interface TrailPointsHubPanelsProps {
  panel: TrailPointsHubPanel;
  onClose: () => void;
  summary: RewardSummaryDTO;
  leaderboard: RewardLeaderboardEntryDTO[];
  inviteLink: string;
  copied: boolean;
  onCopyInvite: () => void;
}

export const TrailPointsHubPanels = ({
  panel,
  onClose,
  summary,
  leaderboard,
  inviteLink,
  copied,
  onCopyInvite,
}: TrailPointsHubPanelsProps) => (
  <>
    <TrailPointsHubSheet open={panel === 'earn'} title="Earn more points" onClose={onClose}>
      <TrailPointsProgressCard summary={summary} />
    </TrailPointsHubSheet>

    <TrailPointsHubSheet open={panel === 'share'} title="Share your tier" onClose={onClose}>
      <TierUnlockShareCard tier={summary.membershipTier} referralCode={summary.referralCode} />
    </TrailPointsHubSheet>

    <TrailPointsHubSheet open={panel === 'badges'} title="Badges & achievements" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-neutral-500">Tier badges</h3>
          <div className="grid grid-cols-2 gap-2">
            {summary.tierBadges.map((badge) => (
              <div
                key={badge.key}
                className={`rounded-xl border p-3 text-center ${
                  badge.earned ? 'border-amber-200 bg-amber-50/80' : 'border-neutral-100 bg-neutral-50/80 opacity-60'
                }`}
              >
                <span className="mb-1 block text-2xl">{badge.emoji}</span>
                <p className="text-xs font-semibold leading-snug text-neutral-900">{badge.name}</p>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-neutral-500">Achievements</h3>
          <ul className="space-y-2">
            {summary.badges.map((badge) => (
              <li
                key={badge.key}
                className={`flex items-start gap-3 rounded-xl border p-3 ${
                  badge.earned ? 'border-emerald-200 bg-emerald-50/80' : 'border-neutral-100 bg-neutral-50/60 opacity-70'
                }`}
              >
                <span className="text-xl shrink-0">{badge.emoji}</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-neutral-900">{badge.name}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-neutral-500">{badge.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </TrailPointsHubSheet>

    <TrailPointsHubSheet open={panel === 'invite'} title="Invite friends" onClose={onClose}>
      <GlassCard padding>
        <p className="text-sm leading-relaxed text-neutral-600">
          Share your link — you earn <strong>50 pts</strong> when they join, they get <strong>25 pts</strong>.
        </p>
        <div className="mt-4 space-y-2">
          <input
            readOnly
            value={inviteLink}
            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-xs text-neutral-700"
          />
          <button
            type="button"
            onClick={onCopyInvite}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied' : 'Copy invite link'}
          </button>
        </div>
      </GlassCard>
    </TrailPointsHubSheet>

    <TrailPointsHubSheet open={panel === 'activity'} title="Activity & leaderboard" onClose={onClose}>
      <div className="space-y-4">
        {leaderboard.length > 0 && (
          <GlassCard padding>
            <div className="mb-3 flex items-center gap-2">
              <Trophy className="h-4 w-4 shrink-0 text-emerald-600" />
              <h3 className="font-bold text-neutral-900">Top contributors</h3>
            </div>
            <ul className="space-y-1">
              {leaderboard.map((entry) => (
                <li
                  key={entry.userId}
                  className="flex items-center gap-3 border-b border-neutral-50 py-2.5 last:border-0"
                >
                  <span className="w-6 shrink-0 text-center text-sm font-bold text-neutral-400">#{entry.rank}</span>
                  {entry.avatarUrl ? (
                    <img src={entry.avatarUrl} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                      {entry.displayName.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-neutral-900">{entry.displayName}</p>
                    <p className="truncate text-xs text-neutral-500">{entry.tier ?? entry.level}</p>
                  </div>
                  <span className="shrink-0 text-sm font-bold text-emerald-700">{entry.points}</span>
                </li>
              ))}
            </ul>
          </GlassCard>
        )}

        {summary.recentActivity.length > 0 ? (
          <GlassCard padding>
            <h3 className="mb-3 font-bold text-neutral-900">Recent activity</h3>
            <ul className="space-y-1">
              {summary.recentActivity.map((entry) => {
                const Icon = EARN_ICONS[entry.action] ?? Award;
                return (
                  <li
                    key={entry.id}
                    className="flex items-center gap-3 border-b border-neutral-50 py-2.5 last:border-0"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                      <Icon className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-snug text-neutral-900">{entry.label}</p>
                      <p className="mt-0.5 text-xs text-neutral-400">
                        {new Date(entry.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-bold text-emerald-600">+{entry.points}</span>
                  </li>
                );
              })}
            </ul>
          </GlassCard>
        ) : (
          <p className="text-sm text-neutral-500">No recent activity yet — join a trip or post in the community.</p>
        )}
      </div>
    </TrailPointsHubSheet>

    <TrailPointsHubSheet open={panel === 'tiers'} title="How tiers work" onClose={onClose}>
      <div className="space-y-3">
        {MEMBERSHIP_TIERS.map((tier) => (
          <div key={tier.key} className="rounded-2xl border border-neutral-100 bg-neutral-50/80 p-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{tier.emoji}</span>
              <div>
                <p className="font-bold text-neutral-900">{tier.name}</p>
                <p className="text-xs text-neutral-500">{tier.minPoints.toLocaleString()} pts · {tier.tagline}</p>
              </div>
            </div>
            <ul className="mt-3 space-y-1">
              {tier.benefits.slice(0, 3).map((benefit) => (
                <li key={benefit} className="flex gap-2 text-xs leading-relaxed text-neutral-600">
                  <Star className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600" fill="currentColor" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
        ))}
        <Link
          to="/trail-points"
          onClick={onClose}
          className="block text-center text-sm font-semibold text-emerald-700"
        >
          Full Trail Points guide →
        </Link>
      </div>
    </TrailPointsHubSheet>
  </>
);

export const TRAIL_POINTS_QUICK_WINS = [
  {
    icon: Gift,
    title: 'Create account',
    hook: 'Land +25 pts before your first hike',
    points: '+25',
    path: '/signup',
    guestOnly: true,
  },
  {
    icon: Mountain,
    title: 'Join a trip',
    hook: 'Show up, check in, earn +30',
    points: '+30',
    path: '/activities',
  },
  {
    icon: MessageCircle,
    title: 'Share a post',
    hook: 'Trip report, tip, or photo — +20',
    points: '+20',
    path: '/community',
  },
] as const;

export const TRAIL_POINTS_FAQS = [
  {
    question: 'What are Trail Points?',
    answer:
      'Trail Points are rewards you earn for exploring the outdoors on UAE Trail — joining trips, posting in the community, writing reviews, and more.',
  },
  {
    question: 'How do I earn Trail Points?',
    answer:
      'Create an account, join organized trips, share community posts, submit locations, invite friends, and write reviews after your adventures.',
  },
  {
    question: 'Do Trail Points expire?',
    answer: 'Trail Points stay on your account as you level up through membership tiers.',
  },
] as const;

/** Extra earn cards for the public about page (excluding duplicates in quick wins). */
export const TRAIL_POINTS_EXTRA_EARN = EARN_WAYS.filter(
  (item) => !['Welcome bonus', 'Join a trip', 'Community post'].includes(item.title)
);
