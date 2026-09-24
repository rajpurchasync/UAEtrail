import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Gift,
  MapPin,
  MessageCircle,
  Mountain,
  PenLine,
  Share2,
  Sparkles,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/index';
import { RewardStatsDTO } from '@uaetrail/shared-types';
import { MEMBERSHIP_TIERS } from '../constants/membershipTiers';
import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { GlassCard } from '../components/mobile/GlassCard';
import { AppButton } from '../components/mobile/AppButton';
import {
  TRAIL_POINTS_EXTRA_EARN,
  TRAIL_POINTS_FAQS,
  TRAIL_POINTS_QUICK_WINS,
} from '../components/rewards';
import { PageMeta } from '../components/seo/PageMeta';
import { JsonLd } from '../components/seo/JsonLd';
import { faqPageSchema } from '../components/seo/schemas';
import { PRODUCT_JOIN_CTA } from '../content/productNorthStar';

const EARN_ICONS: Record<string, typeof MapPin> = {
  'Welcome bonus': Gift,
  'Invite a friend': Share2,
  'Submit a location': MapPin,
  'Host an activity': Mountain,
  'Join an activity': Users,
  'Community post': MessageCircle,
  'Help someone out': Sparkles,
  'Write a review': PenLine,
};

/** Public Trail Points guide — compact mobile-first intro. */
export const TrailPointsAbout = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<RewardStatsDTO | null>(null);

  useEffect(() => {
    api.getRewardStats().then((res) => setStats(res.data)).catch(() => undefined);
  }, []);

  const quickWins = TRAIL_POINTS_QUICK_WINS.filter((w) => !('guestOnly' in w && w.guestOnly && user));
  const primaryCta = user
    ? { path: '/my-rewards', label: 'Open my wallet' }
    : { path: '/signup', label: `${PRODUCT_JOIN_CTA} — +25 pts` };

  const resolveEarnCta = (item: (typeof TRAIL_POINTS_EXTRA_EARN)[number]) => {
    if ('authRequired' in item && item.authRequired && !user) {
      return { path: `/signin?redirect=${encodeURIComponent(item.ctaPath)}`, label: item.ctaLabel };
    }
    return { path: item.ctaPath, label: item.ctaLabel };
  };

  return (
    <ConsumerShell layout="stack" title="Trail Points" showJourney={false} back={{ fallbackTo: '/', label: 'Home' }}>
      <PageMeta
        title="Trail Points rewards"
        description="Earn Trail Points for hiking, camping, and community participation on UAE Trail. Unlock tiers and perks as you explore."
        path="/trail-points"
      />
      <JsonLd data={faqPageSchema([...TRAIL_POINTS_FAQS])} id="trail-points-faq" />

      <div className="animate-fade-up space-y-4 pb-nav-safe">
        <GlassCard padding className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-sm">
            <Trophy className="h-6 w-6" />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-600">Rewards</p>
          <h2 className="mt-2 text-xl font-extrabold tracking-tight text-neutral-900">
            Show up for the trails
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">
            Every hike, post, and activity you lead earns points — and a badge your profile wears.
          </p>
          <Link to={primaryCta.path} className="mt-4 block">
            <AppButton fullWidth>
              {primaryCta.label}
              <ArrowRight className="ml-1 inline h-4 w-4" />
            </AppButton>
          </Link>
        </GlassCard>

        {stats && stats.contributorsCount > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Trail builders', value: stats.contributorsCount },
              { label: 'Active badges', value: stats.activeCount },
              { label: 'Pro members', value: stats.proCount },
              { label: 'GOAT status', value: stats.goatCount },
            ].map((item) => (
              <GlassCard key={item.label} padding className="!py-3 text-center">
                <p className="text-lg font-extrabold tabular-nums text-neutral-900">{item.value}</p>
                <p className="text-[11px] font-medium text-neutral-500">{item.label}</p>
              </GlassCard>
            ))}
          </div>
        )}

        <GlassCard padding>
          <h3 className="text-sm font-bold text-neutral-900">Your first points</h3>
          <div className="mt-3 space-y-2">
            {quickWins.map((win) => (
              <Link
                key={win.title}
                to={win.path}
                className="flex items-center gap-3 rounded-xl border border-neutral-100 bg-neutral-50/80 px-3 py-3 transition-colors active:bg-emerald-50"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
                  <win.icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-neutral-900">{win.title}</span>
                  <span className="block text-xs text-neutral-500">{win.hook}</span>
                </span>
                <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">
                  {win.points}
                </span>
              </Link>
            ))}
          </div>
        </GlassCard>

        <GlassCard padding>
          <h3 className="text-sm font-bold text-neutral-900">Membership tiers</h3>
          <div className="mt-3 space-y-2">
            {MEMBERSHIP_TIERS.map((tier) => (
              <div
                key={tier.key}
                className="flex items-center gap-3 rounded-xl border border-neutral-100 px-3 py-3"
              >
                <span className="text-2xl">{tier.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-neutral-900">{tier.name}</p>
                  <p className="text-xs text-neutral-500">
                    {tier.minPoints.toLocaleString()} pts · {tier.tagline}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard padding>
          <h3 className="text-sm font-bold text-neutral-900">More ways to earn</h3>
          <div className="mt-3 space-y-2">
            {TRAIL_POINTS_EXTRA_EARN.map((item) => {
              const Icon = EARN_ICONS[item.title] ?? Zap;
              const cta = resolveEarnCta(item);
              return (
                <Link
                  key={item.title}
                  to={cta.path}
                  className="flex items-center gap-3 rounded-xl border border-neutral-100 px-3 py-3 transition-colors active:bg-emerald-50"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-neutral-900">{item.title}</span>
                    <span className="block text-xs text-neutral-500">{item.hook}</span>
                  </span>
                  <span className="shrink-0 text-xs font-bold text-emerald-700">{item.pointsLabel}</span>
                </Link>
              );
            })}
          </div>
        </GlassCard>

        <GlassCard padding>
          <h3 className="mb-3 text-sm font-bold text-neutral-900">FAQ</h3>
          <div className="space-y-2">
            {TRAIL_POINTS_FAQS.map((item) => (
              <details key={item.question} className="rounded-xl border border-neutral-100 px-3 py-2">
                <summary className="cursor-pointer list-none text-sm font-semibold text-neutral-900">
                  {item.question}
                </summary>
                <p className="mt-2 text-xs leading-relaxed text-neutral-600">{item.answer}</p>
              </details>
            ))}
          </div>
        </GlassCard>
      </div>
    </ConsumerShell>
  );
};
