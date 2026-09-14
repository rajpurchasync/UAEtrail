import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  CalendarPlus,
  Loader2,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { GlassCard } from '../components/mobile/GlassCard';
import { AppButton } from '../components/mobile/AppButton';
import { PageMeta } from '../components/seo/PageMeta';
import { MobileBecomeOrganisationFlow } from '../components/organisation-console/MobileBecomeOrganisationFlow';
import { parseOrganisationFlowIntent } from '../components/organisation-console/becomeOrganisationFlow';
import { useOrganisationGate } from '../hooks/useOrganisationGate';
import { resolveAuthRedirect } from '../utils/authRedirect';
import { EXPLORE_MAP_PATH } from '../config/platform';

const setupSteps = [
  { emoji: '👋', title: 'Introduce yourself', detail: 'Guide, agency, or gear shop — pick what fits you.' },
  { emoji: '📍', title: 'Pin yourself on the map', detail: 'A photo and where you\'re based helps people find you.' },
  { emoji: '🏕️', title: 'Invite people along', detail: 'Post hikes, camps, carpools, and meetups when you\'re ready.' },
];

/** Become a host — guide, agency, or shop. Route: /become-host (alias /become-organizer). */
export const BecomeOrganisation = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const intent = parseOrganisationFlowIntent(searchParams.get('intent'));
  const returnTo =
    resolveAuthRedirect(null, searchParams.get('redirect')) ?? EXPLORE_MAP_PATH;
  const {
    canPublish,
    loading: hostGateLoading,
    refresh: refreshHostGate,
    hasGuideProfile,
    hasAgencyProfile,
    hasShopProfile,
  } = useOrganisationGate({
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
      navigate(returnTo, { replace: true });
    }
  }, [canPublish, justBecameHost, hostFlowOpen, navigate, intent, returnTo]);

  const openForm = () => setHostFlowOpen(true);

  const handlePrimaryAction = () => {
    if (!user) {
      const signupRedirect = encodeURIComponent(
        `/become-host?intent=${intent}${searchParams.get('redirect') ? `&redirect=${encodeURIComponent(searchParams.get('redirect')!)}` : ''}`
      );
      navigate(`/signup?redirect=${signupRedirect}`);
      return;
    }
    if (canPublish) {
      navigate(returnTo);
      return;
    }
    openForm();
  };

  const alreadyHostMessage =
    intent === 'add-shop'
      ? 'Your shop is already on the map — nice one.'
      : intent === 'add-agency'
        ? 'Your agency is already live with the community.'
        : intent === 'add-guide'
          ? 'You\'re already set up as a guide.'
          : null;

  const pageTitle =
    intent === 'add-shop'
      ? 'Share your shop'
      : intent === 'add-agency'
        ? 'Join as an agency'
        : intent === 'add-guide'
          ? 'Become a guide'
          : 'Set up as a host';

  const handleHostSubmitted = async (_tenantId: string | null) => {
    setHostFlowOpen(false);
    setJustBecameHost(true);
    await refreshHostGate();
  };

  const signInHref =
    intent === 'become-host'
      ? `/signin?redirect=${encodeURIComponent(`/become-host${searchParams.get('redirect') ? `?redirect=${encodeURIComponent(searchParams.get('redirect')!)}` : ''}`)}`
      : `/signin?redirect=${encodeURIComponent(`/become-host?intent=${intent}${searchParams.get('redirect') ? `&redirect=${encodeURIComponent(searchParams.get('redirect')!)}` : ''}`)}`;

  const primaryLabel = !user
    ? 'Join to get started'
    : hostGateLoading
      ? 'Just a moment…'
      : canPublish
        ? 'Back to the map'
        : 'Count me in';

  const headline =
    intent === 'add-shop'
      ? 'Got gear? Put your shop on the map'
      : intent === 'add-agency'
        ? 'Bring your agency to the trail community'
        : intent === 'add-guide'
          ? 'Love the outdoors? Lead the way'
          : 'Want to share an activity with everyone?';

  const subcopy =
    intent === 'become-host'
      ? 'Guides, agencies, and shops share activities here. A quick intro — then you can post hikes, camps, carpools, and more.'
      : intent === 'add-shop'
        ? 'Help hikers and campers find your gear shop when they\'re planning their next activity.'
        : intent === 'add-agency'
          ? 'Connect with people looking for guided adventures across the UAE.'
          : 'Share your experience and welcome others on the trails you know best.';

  const backFallback = user ? EXPLORE_MAP_PATH : '/';

  return (
    <>
      <PageMeta
        title={pageTitle}
        description="Join the UAE Trail community — share hikes, camps, and outdoor meetups as a guide, agency, or shop."
        path="/become-organizer"
      />
      <ConsumerShell
        layout="stack"
        title={pageTitle}
        showJourney={false}
        back={{ fallbackTo: backFallback, label: 'Back' }}
      >
        <div className="mx-auto max-w-lg space-y-4 pb-nav-safe animate-fade-up">
          {user && hostGateLoading && (
            <GlassCard padding className="text-center">
              <Loader2 className="mx-auto mb-3 h-7 w-7 animate-spin text-emerald-600" />
              <p className="text-sm text-neutral-500">Just a moment…</p>
            </GlassCard>
          )}

          {user && justBecameHost && (
            <GlassCard padding className="text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
                🎉
              </div>
              <h2 className="text-xl font-bold text-neutral-900">Welcome aboard!</h2>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                You&apos;re ready to host. Head back to the map and tap + whenever you want to invite people along.
              </p>
              <AppButton fullWidth onClick={() => navigate(returnTo)} className="mt-5">
                {returnTo.startsWith('/explore') ? 'Back to the map' : 'Continue'}
                <ArrowRight className="h-4 w-4" />
              </AppButton>
            </GlassCard>
          )}

          {user && !hostGateLoading && profileAlreadyExists && (
            <GlassCard padding className="text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
                ✓
              </div>
              <h2 className="text-xl font-bold text-neutral-900">You&apos;re already part of the crew</h2>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">{alreadyHostMessage}</p>
              <AppButton fullWidth onClick={() => navigate('/host/overview')} className="mt-5">
                Go to host console
                <ArrowRight className="h-4 w-4" />
              </AppButton>
            </GlassCard>
          )}

          {(!user || (!hostGateLoading && !justBecameHost && !profileAlreadyExists)) && (
            <GlassCard padding className="!p-5 sm:!p-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
                {intent === 'add-shop' ? '🛍️' : intent === 'add-agency' ? '🏢' : intent === 'add-guide' ? '🥾' : '🏕️'}
              </div>
              <h2 className="text-xl font-bold leading-snug text-neutral-900">{headline}</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-neutral-600">{subcopy}</p>
              <p className="mt-3 text-xs font-medium text-neutral-500">Takes about 2 minutes — promise.</p>

              <div className="mt-5">
                <AppButton
                  fullWidth
                  onClick={handlePrimaryAction}
                  disabled={Boolean(user && hostGateLoading)}
                >
                  {!user ? <UserPlus className="h-4 w-4" /> : <CalendarPlus className="h-4 w-4" />}
                  {primaryLabel}
                </AppButton>
              </div>

              {!user && (
                <p className="mt-3 text-xs text-neutral-500">
                  Already one of us?{' '}
                  <Link to={signInHref} className="font-semibold text-emerald-700 hover:underline">
                    Sign in
                  </Link>
                </p>
              )}

              <div className="mt-6 border-t border-neutral-100 pt-5 text-left">
                <p className="text-sm font-semibold text-neutral-900">Here&apos;s all it takes</p>
                <ul className="mt-3 space-y-3">
                  {setupSteps.map((item) => (
                    <li key={item.title} className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-neutral-50 text-base">
                        {item.emoji}
                      </span>
                      <div className="min-w-0 pt-0.5">
                        <p className="text-sm font-medium text-neutral-900">{item.title}</p>
                        <p className="text-xs leading-relaxed text-neutral-500">{item.detail}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </GlassCard>
          )}
        </div>

        {hostFlowOpen && (
          <MobileBecomeOrganisationFlow
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

/** @deprecated Import {@link BecomeOrganisation} — route `/become-host` unchanged. */
export const BecomeHost = BecomeOrganisation;
