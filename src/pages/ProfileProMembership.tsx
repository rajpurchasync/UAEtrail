import { EXPLORE_MAP_PATH, proMembershipPath, signInPath } from '../config/routingCatalog';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { GlassCard } from '../components/mobile/GlassCard';
import { AppButton } from '../components/mobile/AppButton';
import { PageMeta } from '../components/seo/PageMeta';
import { useAuth } from '../context/AuthContext';
import { BecomeHostFlow } from '../components/organisation-console/BecomeHostFlow';
import {
  parseHostFlowIntent,
  type HostFlowIntent,
} from '../components/organisation-console/hostWizardFlow';
import { useOrganisationGate } from '../hooks/useOrganisationGate';
import { ProfileMapPresenceSection } from '../components/profile/ProfileMapPresenceSection';
import { resolveAuthRedirect } from '../utils/authRedirect';

/** Pro / professional host onboarding — moved from `/become-host`. */
export const ProfileProMembership = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const intent = parseHostFlowIntent(searchParams.get('intent'));
  const returnTo = resolveAuthRedirect(null, searchParams.get('redirect')) ?? EXPLORE_MAP_PATH;

  const { refresh: refreshHostGate } = useOrganisationGate({ enabled: Boolean(user) });
  const [flowOpen, setFlowOpen] = useState(false);

  const proReturnPath = proMembershipPath({
    intent: intent ?? undefined,
    redirect: searchParams.get('redirect') ?? undefined,
  });
  const signInHref = signInPath({ redirect: proReturnPath });

  useEffect(() => {
    if (!user) return;
    const shouldOpen =
      intent === 'add-shop' || intent === 'add-agency' || intent === 'add-guide';
    if (shouldOpen) setFlowOpen(true);
  }, [intent, user]);

  const openFlow = (nextIntent: HostFlowIntent) => {
    if (!user) {
      navigate(signInHref);
      return;
    }
    const params = new URLSearchParams(searchParams);
    params.set('intent', nextIntent);
    navigate(`/profile/pro-membership?${params.toString()}`, { replace: true });
    setFlowOpen(true);
  };

  const handleSubmitted = async () => {
    setFlowOpen(false);
    await refreshHostGate();
    navigate(returnTo, { replace: true });
  };

  return (
    <>
      <PageMeta
        title="Pro Membership"
        description="Build a professional guide, agency, or shop profile on UAE Trail."
        path="/profile/pro-membership"
        noIndex
      />
      <ConsumerShell
        layout="stack"
        title="Pro Membership"
        showJourney={false}
        back={{ fallbackTo: '/profile', label: 'Profile' }}
      >
        <div className="mx-auto max-w-lg space-y-4 pb-nav-safe animate-fade-up">
          <GlassCard padding className="!p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
                <Sparkles className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h2 className="text-lg font-bold text-neutral-900">Go pro on the trail</h2>
                <p className="mt-1 text-sm leading-relaxed text-neutral-600">
                  Anyone with a completed profile can organize free outings on the map. Pro membership is for
                  licensed guides, agencies, and gear shops — paid trips, team access, and a public operator profile.
                </p>
                <p className="mt-2 text-xs font-medium text-neutral-500">
                  Membership tiers and billing are coming soon. You can still apply for a professional profile below.
                </p>
              </div>
            </div>
            {!user ? (
              <AppButton fullWidth className="mt-4" onClick={() => navigate(signInHref)}>
                Sign in to continue
              </AppButton>
            ) : (
              <AppButton fullWidth className="mt-4" onClick={() => openFlow('add-agency')}>
                Start professional profile
              </AppButton>
            )}
          </GlassCard>

          {user ? <ProfileMapPresenceSection /> : null}

          {!user ? (
            <p className="text-center text-xs text-neutral-500">
              Already have an account?{' '}
              <Link to={signInHref} className="font-semibold text-emerald-700 hover:underline">
                Sign in
              </Link>
            </p>
          ) : null}
        </div>
      </ConsumerShell>

      {user && flowOpen ? (
        <BecomeHostFlow
          open={flowOpen}
          onClose={() => setFlowOpen(false)}
          onSubmitted={handleSubmitted}
          signInHref={signInHref}
          intent={intent === 'become-host' ? 'add-agency' : intent}
        />
      ) : null}
    </>
  );
};
