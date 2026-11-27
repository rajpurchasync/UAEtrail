import { EXPLORE_MAP_PATH, proMembershipPath, signInPath } from '../config/routingCatalog';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { GlassCard } from '../components/mobile/GlassCard';
import { AppButton } from '../components/mobile/AppButton';
import { PageMeta } from '../components/seo/PageMeta';
import { useAuth } from '../context/AuthContext';
import { ProProfileApplicationFlow } from '../operator/apply/ProProfileApplicationFlow';
import {
  parseHostFlowIntent,
  proMembershipPathIntent,
  type HostFlowIntent,
} from '../operator/apply/hostWizardFlow';
import { useMemberStatus } from '../hooks/useMemberStatus';
import { ProfileMapPresenceSection } from '../components/profile/ProfileMapPresenceSection';
import { resolveAuthRedirect } from '../utils/authRedirect';
import { useProfileHubBackChrome } from '../hooks/useProfileHubBackChrome';
import { navigateBack } from '../utils/backStack';

/** Pro Membership — professional guide, agency, or shop application (community Host / publish uses profile complete + `/welcome`). */
export const ProfileProMembership = () => {
  const backChrome = useProfileHubBackChrome();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const intent = parseHostFlowIntent(searchParams.get('intent'));
  const returnTo = resolveAuthRedirect(null, searchParams.get('redirect')) ?? EXPLORE_MAP_PATH;

  const { refresh: refreshHostGate } = useMemberStatus({ enabled: Boolean(user) });
  const [flowOpen, setFlowOpen] = useState(false);

  const proReturnPath = proMembershipPath({
    intent: proMembershipPathIntent(intent),
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
    navigate(`/profile/pro-membership?${params.toString()}`, {
      replace: true,
      state: location.state,
    });
    setFlowOpen(true);
  };

  const handleSubmitted = async () => {
    setFlowOpen(false);
    await refreshHostGate();
    navigateBack(navigate, returnTo);
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
        title="Pro membership"
        showJourney={false}
        back={backChrome}
      >
        <div className="mx-auto max-w-lg space-y-4 pb-nav-safe animate-fade-up">
          <GlassCard padding className="!p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800">
                <Sparkles className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h2 className="text-lg font-bold text-neutral-900">Go pro on the trail</h2>
                <p className="mt-1 text-sm leading-relaxed text-neutral-600">
                  Anyone with a completed profile can organize free and shared-cost outings on the map. Pro
                  membership is for a public operator profile: professional guides (individual), tour agencies, or
                  gear shops — each with their own profile page. Guides host free and shared-cost trips only;
                  verified business accounts (agency, shop, or partner) may list paid commercial trips when you
                  publish as that business; individual guides stay free and shared-cost only.
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
        <ProProfileApplicationFlow
          open={flowOpen}
          onClose={() => setFlowOpen(false)}
          onSubmitted={handleSubmitted}
          signInHref={signInHref}
          intent={intent}
        />
      ) : null}
    </>
  );
};
