import { useEffect, useState, type ReactNode } from 'react';
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
  Star,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/services';
import { RewardStatsDTO } from '@uaetrail/shared-types';
import { MEMBERSHIP_TIERS, EARN_WAYS } from '../constants/membershipTiers';
import { MobileBackButton } from '../components/mobile/MobileBackButton';
import { PageMeta } from '../components/seo/PageMeta';
import { JsonLd } from '../components/seo/JsonLd';
import { faqPageSchema } from '../components/seo/schemas';

const TRAIL_POINTS_FAQS = [
  {
    question: 'What are Trail Points?',
    answer:
      'Trail Points are rewards you earn for exploring the outdoors on UAE Trail — joining trips, posting in the community, writing reviews, and more.'
  },
  {
    question: 'How do I earn Trail Points?',
    answer:
      'Create an account, join organized trips, share community posts, submit locations, invite friends, and write reviews after your adventures.'
  },
  {
    question: 'Do Trail Points expire?',
    answer: 'Trail Points stay on your account as you level up through membership tiers. Check the rewards page for current tier benefits.'
  }
];

const TIER_STYLES: Record<string, { card: string; accent: string; ring: string }> = {
  active: { card: 'from-sky-50 to-blue-50', accent: 'text-sky-700', ring: 'ring-sky-200/80' },
  pro: { card: 'from-emerald-50 to-teal-50', accent: 'text-emerald-800', ring: 'ring-emerald-300/80' },
  goat: { card: 'from-amber-50 to-orange-50', accent: 'text-amber-900', ring: 'ring-amber-300/80' },
};

const QUICK_WINS = [
  {
    icon: Gift,
    title: 'Create account',
    hook: 'Land +25 pts before your first hike',
    points: '+25',
    path: '/signup',
    label: 'Start free',
    guestOnly: true,
  },
  {
    icon: Mountain,
    title: 'Join a trip',
    hook: 'Show up, check in, earn +30',
    points: '+30',
    path: '/trips',
    label: 'Find a trip',
  },
  {
    icon: MessageCircle,
    title: 'Share a post',
    hook: 'Trip report, tip, or photo — +20',
    points: '+20',
    path: '/community',
    label: 'Write now',
  },
] as const;

const EARN_ICONS: Record<string, typeof MapPin> = {
  'Welcome bonus': Gift,
  'Invite a friend': Share2,
  'Submit a location': MapPin,
  'Host a trip': Mountain,
  'Join a trip': Users,
  'Community post': MessageCircle,
  'Help someone out': Sparkles,
  'Write a review': PenLine,
};

/** Mobile carousel / desktop grid */
function CarouselGrid({
  children,
  cols,
}: {
  children: ReactNode;
  cols: string;
}) {
  return (
    <div
      className={`-mx-4 pl-4 pr-3 flex gap-2 overflow-x-auto snap-x snap-mandatory scroll-touch scrollbar-none pb-1
        lg:mx-0 lg:px-0 lg:grid lg:gap-5 lg:overflow-visible lg:pb-0 ${cols}`}
    >
      {children}
    </div>
  );
}

function CarouselItem({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`shrink-0 snap-start w-[calc(100vw-2.75rem)] max-w-[340px] lg:w-auto lg:max-w-none lg:shrink ${className}`}
    >
      {children}
    </div>
  );
}

export const TrailPointsAbout = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<RewardStatsDTO | null>(null);

  useEffect(() => {
    api.getRewardStats().then((res) => setStats(res.data)).catch(() => undefined);
  }, []);

  const primaryCta = user
    ? { path: '/my-rewards', label: 'My Trail Points' }
    : { path: '/signup', label: 'Join free — +25 pts' };

  const quickWins = QUICK_WINS.filter((w) => !('guestOnly' in w && w.guestOnly && user));

  const resolveEarnCta = (item: (typeof EARN_WAYS)[number]) => {
    if ('authRequired' in item && item.authRequired && !user) {
      return { path: `/signin?redirect=${encodeURIComponent(item.ctaPath)}`, label: item.ctaLabel };
    }
    return { path: item.ctaPath, label: item.ctaLabel };
  };

  return (
    <div className="min-h-screen consumer-bg pb-nav-safe lg:pb-16">
      <PageMeta
        title="Trail Points rewards"
        description="Earn Trail Points for hiking, camping, and community participation on UAE Trail. Unlock tiers and perks as you explore."
        path="/trail-points"
      />
      <JsonLd data={faqPageSchema(TRAIL_POINTS_FAQS)} id="trail-points-faq" />
      {/* Hero */}
      <section className="relative overflow-hidden min-h-0">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1551632811-561732d1e306?w=1200&q=80)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/55 to-[#eef6f3]" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-safe-plus-2 pb-8 sm:pb-10 lg:pb-16 lg:pt-8">
          <div className="md:hidden mb-3">
            <MobileBackButton fallbackTo="/" label="Home" />
          </div>

          <div className="lg:grid lg:grid-cols-2 lg:gap-12 lg:items-end">
            <div className="lg:py-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md px-3 py-1.5 ring-1 ring-white/20 mb-3 sm:mb-4">
                <Trophy className="w-4 h-4 text-amber-400 fill-amber-400/30" />
                <span className="text-amber-200/95 text-[11px] font-bold uppercase tracking-widest">
                  Trail Points
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.15]">
                Show up for the trails.
                <span className="block text-emerald-300 mt-1">Watch your status climb.</span>
              </h1>
              <p className="text-sm sm:text-base lg:text-lg text-white/80 mt-3 sm:mt-4 max-w-lg leading-relaxed">
                Every hike, post, and trip you lead earns points — and a badge your profile actually wears.
              </p>
              <div className="mt-5 sm:mt-6 flex flex-col gap-2.5 sm:flex-row sm:gap-3">
                <Link
                  to={primaryCta.path}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-full text-sm font-bold shadow-lg shadow-emerald-900/30 transition-colors"
                >
                  {primaryCta.label}
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="#start"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white/15 hover:bg-white/25 text-white rounded-full text-sm font-semibold ring-1 ring-white/25 backdrop-blur-sm transition-colors"
                >
                  Pick your first win
                </a>
              </div>
            </div>

            {stats && stats.contributorsCount > 0 && (
              <div className="mt-6 lg:mt-0 grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-2">
                {[
                  { label: 'Trail builders', value: stats.contributorsCount },
                  { label: 'Active badges', value: stats.activeCount },
                  { label: 'Pro members', value: stats.proCount },
                  { label: 'GOAT status', value: stats.goatCount },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl bg-white/10 backdrop-blur-md ring-1 ring-white/20 px-4 py-3 text-center"
                  >
                    <p className="text-2xl font-extrabold text-white tabular-nums">{item.value}</p>
                    <p className="text-[11px] font-medium text-white/70 mt-0.5">{item.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-2 space-y-10 lg:space-y-16 pb-24 lg:pb-8">
        {/* Quick wins — action first */}
        <section id="start" className="scroll-mt-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-1">Start here</p>
              <h2 className="text-xl lg:text-2xl font-extrabold text-gray-900">Your first points in minutes</h2>
            </div>
            <p className="text-sm text-gray-500 max-w-xs">No forms. No codes. Just do something good for the community.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
            {quickWins.map((win) => (
              <Link
                key={win.title}
                to={win.path}
                className="group glass-card-interactive p-5 flex flex-col h-full ring-1 ring-emerald-100/80 hover:ring-emerald-300/60"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/25 group-hover:scale-105 transition-transform">
                    <win.icon className="w-5 h-5" />
                  </span>
                  <span className="text-sm font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                    {win.points}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900">{win.title}</h3>
                <p className="text-sm text-gray-600 mt-1 flex-1">{win.hook}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-emerald-700 group-hover:gap-2 transition-all">
                  {win.label}
                  <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Journey — 3 steps, desktop row */}
        <section>
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-1">Simple as 1-2-3</p>
          <h2 className="text-xl lg:text-2xl font-extrabold text-gray-900 mb-5">How you level up</h2>
          <CarouselGrid cols="lg:grid-cols-3">
            {[
              { n: '1', emoji: '🥾', title: 'Show up', line: 'Hike, post, host — real contributions only.' },
              { n: '2', emoji: '✨', title: 'Points land', line: 'Automatic. No coupon codes or receipts.' },
              { n: '3', emoji: '🏆', title: 'Badge unlocked', line: 'Active → Pro → GOAT on your profile.' },
            ].map((step) => (
              <CarouselItem key={step.n}>
                <div className="glass-card p-5 h-full relative overflow-hidden">
                  <span className="absolute top-3 right-3 text-2xl opacity-90">{step.emoji}</span>
                  <span className="inline-flex w-8 h-8 rounded-xl bg-emerald-600 text-white text-sm font-bold items-center justify-center mb-3">
                    {step.n}
                  </span>
                  <h3 className="font-bold text-gray-900 text-lg mb-1">{step.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{step.line}</p>
                </div>
              </CarouselItem>
            ))}
          </CarouselGrid>
        </section>

        {/* Tiers */}
        <section>
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-1">Your trail cred</p>
          <h2 className="text-xl lg:text-2xl font-extrabold text-gray-900 mb-1">Which badge are you chasing?</h2>
          <p className="text-sm text-gray-500 mb-5">Earned — never bought. Visible on every profile.</p>
          <CarouselGrid cols="lg:grid-cols-3">
            {MEMBERSHIP_TIERS.map((tier) => {
              const styles = TIER_STYLES[tier.key] ?? TIER_STYLES.active;
              const isPro = tier.key === 'pro';
              return (
                <CarouselItem key={tier.key}>
                  <article
                    className={`rounded-2xl bg-gradient-to-b ${styles.card} p-5 h-full flex flex-col ring-2 ${styles.ring} ${
                      isPro ? 'lg:scale-[1.02] lg:shadow-lg' : ''
                    }`}
                  >
                    {isPro && (
                      <span className="self-center text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full mb-2">
                        Most popular path
                      </span>
                    )}
                    <div className="text-center mb-3">
                      <span className="text-4xl block mb-1">{tier.emoji}</span>
                      <h3 className={`text-xl font-extrabold ${styles.accent}`}>{tier.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">{tier.tagline}</p>
                    </div>
                    <p className={`text-center text-2xl font-extrabold tabular-nums mb-4 ${styles.accent}`}>
                      {tier.minPoints.toLocaleString()}
                      <span className="text-sm font-bold ml-1">pts</span>
                    </p>
                    <ul className="space-y-2 flex-1">
                      {tier.benefits.slice(0, 3).map((b) => (
                        <li key={b} className="text-sm text-gray-600 flex gap-2 leading-snug">
                          <Star className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${styles.accent}`} fill="currentColor" />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </article>
                </CarouselItem>
              );
            })}
          </CarouselGrid>
          <div className="mt-5 text-center">
            <Link
              to="/membership"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
            >
              See membership perks
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* More ways — desktop 4-col grid */}
        <section>
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-1">Keep going</p>
          <h2 className="text-xl lg:text-2xl font-extrabold text-gray-900 mb-5">More ways to stack points</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            {EARN_WAYS.filter((e) => !['Welcome bonus', 'Join a trip', 'Community post'].includes(e.title)).map(
              (item) => {
                const Icon = EARN_ICONS[item.title] ?? Zap;
                const cta = resolveEarnCta(item);
                return (
                  <Link
                    key={item.title}
                    to={cta.path}
                    className="group glass-card p-4 h-full flex flex-col hover:ring-2 hover:ring-emerald-200/80 transition-all"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                        <Icon className="w-4 h-4" />
                      </span>
                      <span className="text-xs font-bold text-emerald-700">{item.pointsLabel}</span>
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm">{item.title}</h3>
                    <p className="text-xs text-gray-500 mt-1 flex-1">{item.hook}</p>
                    <span className="mt-3 text-xs font-bold text-emerald-700 group-hover:underline">{cta.label} →</span>
                  </Link>
                );
              }
            )}
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-600 p-6 sm:p-8 lg:p-10 text-center text-white shadow-xl shadow-emerald-900/20">
          <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-white/10 blur-2xl" aria-hidden />
          <Trophy className="w-10 h-10 text-amber-300 fill-amber-300/30 mx-auto mb-3" />
          <h2 className="text-2xl lg:text-3xl font-extrabold tracking-tight">
            {user ? 'Your badge is waiting.' : 'The trails remember who showed up.'}
          </h2>
          <p className="text-emerald-100/90 mt-2 max-w-md mx-auto text-sm sm:text-base">
            {user
              ? 'Check your progress and grab your next win today.'
              : 'Join free, earn +25 points, and make your first mark on the community.'}
          </p>
          <Link
            to={primaryCta.path}
            className="mt-6 inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-emerald-800 rounded-full font-bold text-sm hover:bg-emerald-50 transition-colors shadow-lg"
          >
            {user ? 'Open My Trail Points' : 'Create free account'}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      </div>

      {/* Mobile sticky CTA */}
      <div className="lg:hidden fixed bottom-[calc(var(--nav-height)+0.5rem)] left-4 right-4 z-40">
        <Link
          to={primaryCta.path}
          className="flex items-center justify-center gap-2 w-full py-3.5 bg-emerald-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-900/30 ring-1 ring-emerald-500/50"
        >
          {primaryCta.label}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
