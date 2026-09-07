import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  CalendarPlus,
  CheckCircle,
  Globe2,
  HandHeart,
  Heart,
  Loader2,
  Mountain,
  Sparkles,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { GlassCard } from '../components/mobile/GlassCard';
import { PAGE_BANNERS } from '../config/pageBanners';
import { PageMeta } from '../components/seo/PageMeta';
import { MobileBecomeHostFlow } from '../components/host/MobileBecomeHostFlow';
import { parseHostFlowIntent } from '../components/host/becomeHostFlow';
import { useHostGate } from '../hooks/useHostGate';

const whyHostReasons = [
  {
    icon: Users,
    title: 'Make new friends',
    description:
      'Bring together people who love the outdoors. A shared summit, a campfire chat — hosting turns strangers into your trail family.',
    accent: 'bg-sky-50 text-sky-600',
  },
  {
    icon: HandHeart,
    title: 'Give back to the community',
    description:
      'Welcome beginners, share safety tips, and help more residents & visitors experience the UAE outdoors with confidence.',
    accent: 'bg-rose-50 text-rose-600',
  },
  {
    icon: Globe2,
    title: 'Promote the UAE',
    description:
      'From Fossil Rock to Jebel Jais — show the landscapes you love and inspire others to explore beyond the city.',
    accent: 'bg-amber-50 text-amber-600',
  },
  {
    icon: Heart,
    title: 'Create real connections',
    description:
      'This is not just logistics. You are building memories — sunrise coffees, summit high-fives, and stories people retell for years.',
    accent: 'bg-emerald-50 text-emerald-600',
  },
  {
    icon: Sparkles,
    title: 'Grow your reputation',
    description:
      'Earn reviews, build a following, and become a trusted voice in the outdoor community — one great trip at a time.',
    accent: 'bg-violet-50 text-violet-600',
  },
  {
    icon: Mountain,
    title: 'Host your way',
    description:
      'Solo guide, tour agency, or shop. You choose the pace, places, and people you lead.',
    accent: 'bg-teal-50 text-teal-600',
  },
];

const howItWorks = [
  { step: '1', title: 'Set up profile', desc: 'Guide, licensed agency, or gear shop pin — about a minute each.' },
  { step: '2', title: 'Create activity', desc: 'Guides and agencies post hikes, camps, and trips on the map.' },
  { step: '3', title: 'Welcome your group', desc: 'Meet participants and lead the day.' },
  { step: '4', title: 'Grow', desc: 'Earn reviews and build your outdoor community.' },
];

const communityQuotes = [
  '"I hosted my first wadi walk and left with eight new hiking buddies."',
  '"Giving newcomers their first summit view — that feeling never gets old."',
  '"The UAE has so much to offer. Hosting lets me share that pride every weekend."',
];

/** Become a host — individual, agency, or shop. Route: /become-host (alias /become-organizer). */
export const BecomeHost = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const intent = parseHostFlowIntent(searchParams.get('intent'));
  const {
    canPublish,
    loading: hostGateLoading,
    refresh: refreshHostGate,
    hasGuideProfile,
    hasAgencyProfile,
    hasShopProfile,
  } = useHostGate({
    enabled: Boolean(user),
  });

  const [hostFlowOpen, setHostFlowOpen] = useState(false);
  const [justBecameHost, setJustBecameHost] = useState(false);

  const profileAlreadyExists =
    (intent === 'add-shop' && hasShopProfile) ||
    (intent === 'add-agency' && hasAgencyProfile) ||
    (intent === 'add-guide' && hasGuideProfile);

  const canOpenWizardForIntent =
    (intent === 'add-shop' && !hasShopProfile) ||
    (intent === 'add-agency' && !hasAgencyProfile) ||
    (intent === 'add-guide' && !hasGuideProfile) ||
    intent === 'become-host';

  useEffect(() => {
    if (intent === 'become-host' || !user || hostGateLoading) return;
    if (canOpenWizardForIntent) {
      setHostFlowOpen(true);
      return;
    }
    setHostFlowOpen(false);
  }, [intent, user, hostGateLoading, canOpenWizardForIntent]);

  useEffect(() => {
    if (canPublish && !justBecameHost && !hostFlowOpen && intent === 'become-host') {
      navigate('/', { replace: true });
    }
  }, [canPublish, justBecameHost, hostFlowOpen, navigate, intent]);

  const openForm = () => setHostFlowOpen(true);

  const handlePostEvent = () => {
    if (!user) {
      navigate(`/signup?redirect=${encodeURIComponent(`/become-host?intent=${intent}`)}`);
      return;
    }
    if (canPublish) {
      navigate('/');
      return;
    }
    openForm();
  };

  const alreadyHostMessage =
    intent === 'add-shop'
      ? 'Your gear shop is already on the map. Manage it from your profile.'
      : intent === 'add-agency'
        ? 'Your agency profile is live. Post paid trips from the map or host dashboard.'
        : intent === 'add-guide'
          ? 'You already have a community guide profile. Post activities from the map.'
          : null;

  const pageTitle =
    intent === 'add-shop'
      ? 'List a shop'
      : intent === 'add-agency'
        ? 'Register agency'
        : intent === 'add-guide'
          ? 'Become a guide'
          : 'Become a host';

  const handleHostSubmitted = async (_tenantId: string | null) => {
    setHostFlowOpen(false);
    setJustBecameHost(true);
    await refreshHostGate();
  };

  const signInHref =
    intent === 'become-host'
      ? '/signin?redirect=/become-host'
      : `/signin?redirect=${encodeURIComponent(`/become-host?intent=${intent}`)}`;

  const ctaLabel = canPublish ? 'Create on the map' : 'Set up profile';

  const PostEventButton = ({
    className = '',
    fullWidth = false,
  }: {
    className?: string;
    fullWidth?: boolean;
  }) => (
    <button
      type="button"
      onClick={handlePostEvent}
      disabled={Boolean(user && hostGateLoading)}
      className={`inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-full font-bold text-sm shadow-sm hover:bg-emerald-700 disabled:opacity-70 disabled:cursor-not-allowed transition-colors ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      <CalendarPlus className="w-4 h-4" />
      {hostGateLoading ? 'Loading…' : ctaLabel}
      {!hostGateLoading && <ArrowRight className="w-4 h-4" />}
    </button>
  );

  return (
    <>
      <PageMeta
        title={pageTitle}
        description="Join the UAE Trails community as a host — set up your profile, then post hikes, camps, and meetups."
        path="/become-organizer"
      />
      <ConsumerShell
        layout="editorial"
        maxWidth="4xl"
        eyebrow="Join the community"
        title={pageTitle}
        banner={{ src: PAGE_BANNERS.community, alt: 'Group of friends hiking together' }}
        back={{ fallbackTo: user ? '/profile' : '/activities', label: user ? 'Profile' : 'Activities' }}
        toolbar={
          <div className="space-y-3">
            <p className="text-sm text-neutral-700 leading-relaxed">
              <span className="font-semibold text-neutral-900">Share the trails. Grow the tribe.</span>{' '}
              Set up your host profile first, then create your first activity on the map.
            </p>
            <PostEventButton fullWidth />
            {!user && (
              <p className="text-xs text-neutral-500 text-center">
                Already have an account?{' '}
                <Link to="/signin?redirect=/become-host" className="text-emerald-700 font-semibold hover:underline">
                  Sign in
                </Link>
              </p>
            )}
          </div>
        }
      >
        <div className="space-y-8 md:space-y-10 pb-nav-safe animate-fade-up">
          <section>
            <div className="text-center mb-5">
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-1.5">Community first</p>
              <h2 className="text-xl md:text-2xl font-extrabold text-neutral-900">Why become a Host?</h2>
              <p className="mt-2 text-sm text-neutral-600 max-w-xl mx-auto leading-relaxed">
                Hosting is about people — not just routes on a map. Lead with heart, welcome newcomers, and help
                build the UAE&apos;s outdoor community.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {whyHostReasons.map((item) => (
                <GlassCard key={item.title} padding>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${item.accent}`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-neutral-900 mb-1">{item.title}</h3>
                  <p className="text-sm text-neutral-600 leading-relaxed">{item.description}</p>
                </GlassCard>
              ))}
            </div>
          </section>

          <section>
            <GlassCard padding className="bg-gradient-to-br from-emerald-800 to-emerald-950 text-white border-0">
              <p className="text-center text-xs font-bold uppercase tracking-widest text-emerald-200/90 mb-4">
                From the community
              </p>
              <div className="space-y-3">
                {communityQuotes.map((quote) => (
                  <blockquote key={quote} className="text-center text-sm text-emerald-50/95 italic leading-relaxed">
                    {quote}
                  </blockquote>
                ))}
              </div>
            </GlassCard>
          </section>

          <section>
            <h2 className="text-lg md:text-xl font-bold text-neutral-900 text-center mb-1">How it works</h2>
            <p className="text-sm text-neutral-500 text-center mb-5 max-w-md mx-auto">
              Host first, create second — no waiting for approval.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {howItWorks.map((s) => (
                <GlassCard key={s.step} padding className="text-center">
                  <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center mx-auto mb-2.5 text-sm">
                    {s.step}
                  </div>
                  <h3 className="font-semibold text-neutral-900 mb-1 text-sm">{s.title}</h3>
                  <p className="text-xs text-neutral-500 leading-relaxed">{s.desc}</p>
                </GlassCard>
              ))}
            </div>
          </section>

          <section id="host-status">
            {!user && (
              <GlassCard padding className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center mx-auto mb-4">
                  <CalendarPlus className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-lg font-bold text-neutral-900 mb-2">Ready to bring people together?</h2>
                <p className="text-sm text-neutral-600 mb-6 leading-relaxed">
                  Create a free account, become a host, then post your first activity on the map.
                </p>
                <PostEventButton fullWidth />
              </GlassCard>
            )}

            {user && hostGateLoading && (
              <GlassCard padding className="text-center">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
                <p className="text-sm text-neutral-500">Checking your host status…</p>
              </GlassCard>
            )}

            {user && justBecameHost && (
              <GlassCard padding className="text-center border-emerald-100">
                <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
                <h2 className="text-lg font-bold text-neutral-900 mb-2">You&apos;re a host — create your first activity</h2>
                <p className="text-sm text-neutral-600 mb-4 leading-relaxed">
                  Your profile is live. Tap below to open the map and publish a hike, camp, event, or carpool.
                </p>
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-full text-sm font-bold"
                >
                  Create on the map <ArrowRight className="w-4 h-4" />
                </Link>
              </GlassCard>
            )}

            {user && !hostGateLoading && profileAlreadyExists && (
              <GlassCard padding className="text-center border-amber-100">
                <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
                <h2 className="text-lg font-bold text-neutral-900 mb-2">Already set up</h2>
                <p className="text-sm text-neutral-600 mb-4 leading-relaxed">{alreadyHostMessage}</p>
                <Link
                  to="/profile#map-presence"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-full text-sm font-bold"
                >
                  Go to profile <ArrowRight className="w-4 h-4" />
                </Link>
              </GlassCard>
            )}

            {user && !hostGateLoading && !profileAlreadyExists && !justBecameHost && intent !== 'become-host' && (
              <GlassCard padding className="text-center">
                <Sparkles className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
                <h2 className="text-lg font-bold text-neutral-900 mb-2">Your community is waiting</h2>
                <p className="text-sm text-neutral-600 mb-6 leading-relaxed">
                  Choose individual guide, tour agency, or shop — setup takes about a minute, then you can post
                  activities.
                </p>
                <PostEventButton fullWidth />
              </GlassCard>
            )}
          </section>

          <GlassCard padding className="bg-gradient-to-br from-emerald-700 to-emerald-900 text-white border-0 text-center">
            <h2 className="text-lg md:text-xl font-extrabold mb-2">The UAE outdoors is better shared</h2>
            <p className="text-sm text-emerald-100/90 mb-5 leading-relaxed">
              Someone out there is looking for their first hiking friend. Maybe that&apos;s you — ready to host.
            </p>
            <PostEventButton className="!bg-white !text-emerald-800 hover:!bg-emerald-50" />
          </GlassCard>
        </div>

        {hostFlowOpen && (
          <MobileBecomeHostFlow
            open={hostFlowOpen}
            onClose={() => setHostFlowOpen(false)}
            onSubmitted={handleHostSubmitted}
            signInHref={signInHref}
            intent={intent}
          />
        )}
      </ConsumerShell>
    </>
  );
};
