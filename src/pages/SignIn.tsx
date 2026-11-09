import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { AuthFunnelShell } from '../components/auth/AuthFunnelShell';
import {
  AUTH_FUNNEL_INPUT_WITH_ICON_CLASS,
  AUTH_FUNNEL_LABEL_CLASS,
} from '../components/auth/authFieldStyles';
import { setActiveTenantId } from '../api/tenant';
import { fetchMeProfile } from '../hooks/memberProfileApi';
import { fetchMemberStatus } from '../hooks/memberStatusApi';
import { GoogleAuthSection } from '../components/auth/GoogleAuthSection';
import { useAuth } from '../context/AuthContext';
import { accountRouteByRole, defaultRouteByRole } from '../utils/authRouting';
import { isPlatformAdmin } from '../utils/roles';
import {
  AUTH_UNAVAILABLE_COPY,
  isRejectedAuthRedirectParam,
  navigateAuthBack,
  navigateAuthClose,
  resolveAuthRedirect
} from '../utils/authRedirect';
import {
  AUTH_UNAVAILABLE_STATE,
  navigateToPostAuthReturn,
  resolvePostAuthReturnPath,
} from '../utils/authPostLoginNavigation';
import { isPendingEmailVerification } from '../utils/authVerification';
import { SIGNUP_PATH, hasSessionExpiredQuery } from '../config/routingCatalog';
import { sessionExpiredLandingPath } from '../utils/authSessionLanding';
import { buildAuthGateUrls, clearAuthReturnContext } from '../utils/authReturnContext';
import { PageMeta } from '../components/seo/PageMeta';
import { PRODUCT_AUTH_SIGNIN_SUBLINE } from '../content/productNorthStar';
import { shouldForceSignupWelcome } from '../utils/signupProfileGate';

export const SignIn = () => {
  const { signIn, signInDemo, signInWithGoogle, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  if (hasSessionExpiredQuery(searchParams)) {
    return <Navigate to={sessionExpiredLandingPath()} replace />;
  }
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isPrivateLanHost =
    /^192\.168\./.test(hostname) ||
    /^10\./.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(hostname);
  const isLocalDevHost =
    hostname === 'localhost' || hostname === '127.0.0.1';
  const isDevMode = import.meta.env.DEV;
  const isTestMode = import.meta.env.MODE === 'test';
  const runtimeEnv = String(import.meta.env.VITE_RUN_ENV ?? '').toLowerCase();
  const isNonProdRuntime = runtimeEnv === 'test' || runtimeEnv === 'staging';
  const showRoleQuickAccess =
    (isDevMode && (isLocalDevHost || isPrivateLanHost)) ||
    isTestMode ||
    isNonProdRuntime;

  const rawRedirect = searchParams.get('redirect');
  const from = resolveAuthRedirect(
    (location.state as { from?: string } | null)?.from,
    rawRedirect
  );
  const redirectUnavailable = isRejectedAuthRedirectParam(rawRedirect);

  const handleBack = () => navigateAuthBack(navigate, from);
  const handleClose = () => navigateAuthClose(navigate, from);
  const signUpHref = from
    ? buildAuthGateUrls(location, { returnPath: from }).signUpHref
    : SIGNUP_PATH;

  const redirectToVerify = (pending: {
    email: string;
    expiresAt?: string;
    expiresInSeconds?: number;
    message?: string;
  }) => {
    navigate('/verify', {
      replace: true,
      state: {
        email: pending.email,
        expiresAt: pending.expiresAt,
        expiresInSeconds: pending.expiresInSeconds,
        redirectTo: from,
        notice: pending.message
      }
    });
  };

  const completeAuth = async (signedInUser: Awaited<ReturnType<typeof signIn>>) => {
    if (isPendingEmailVerification(signedInUser)) {
      redirectToVerify(signedInUser);
      return;
    }

    const profile = await fetchMeProfile().catch(() => null);
    const postAuthDefault =
      signedInUser.role === 'participant' || isPlatformAdmin(signedInUser.role)
        ? defaultRouteByRole(signedInUser.role)
        : accountRouteByRole(signedInUser.role);
    const welcomeRedirectTo = resolvePostAuthReturnPath(from, signedInUser.role) ?? postAuthDefault;

    if (profile && shouldForceSignupWelcome(signedInUser.role, profile)) {
      navigate('/welcome', {
        replace: true,
        state: { redirectTo: welcomeRedirectTo },
      });
      return;
    }

    if (navigateToPostAuthReturn(navigate, from, signedInUser.role, searchParams)) {
      return;
    }

    if (from && !resolvePostAuthReturnPath(from, signedInUser.role)) {
      clearAuthReturnContext();
      navigate(postAuthDefault, { replace: true, state: AUTH_UNAVAILABLE_STATE });
      return;
    }

    clearAuthReturnContext();

    const memberStatus = await fetchMemberStatus().catch(() => null);
    const tenantId = memberStatus?.publish.tenantId;
    if (tenantId) {
      setActiveTenantId(tenantId);
    }

    navigate(
      signedInUser.role === 'participant' || isPlatformAdmin(signedInUser.role)
        ? defaultRouteByRole(signedInUser.role)
        : accountRouteByRole(signedInUser.role),
      { replace: true }
    );
  };

  const demoAccounts = [
    { label: 'Admin', email: 'admin@uaetrails.app' },
    { label: 'Participant', email: 'visitor@uaetrails.app' },
    { label: 'Individual host', email: 'host@uaetrails.app' },
    { label: 'Agency', email: 'organizer@uaetrails.app' },
    { label: 'Shop', email: 'shop@uaetrails.app' },
  ];

  const quickLogin = async (account: (typeof demoAccounts)[number]) => {
    setError(null);
    setEmail(account.email);
    setPassword('');
    try {
      await completeAuth(await signInDemo(account.email));
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'That didn\'t work — double-check your email and password.');
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      await completeAuth(await signIn(email, password));
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'That didn\'t work — double-check your email and password.');
    }
  };

  const handleGoogleSignIn = async (idToken: string) => {
    setError(null);
    try {
      await completeAuth(await signInWithGoogle(idToken));
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Google sign-in didn\'t complete — try again.');
    }
  };

  return (
    <AuthFunnelShell
      title="Welcome"
      subline={PRODUCT_AUTH_SIGNIN_SUBLINE}
      onBack={handleBack}
      onClose={handleClose}
    >
      <PageMeta title="Sign in" noIndex />

        <GoogleAuthSection
          onSuccess={handleGoogleSignIn}
          onError={setError}
          text="signin_with"
          disabled={loading}
        />

        {redirectUnavailable ? (
          <p className="mb-3 text-sm text-red-600 dark:text-red-400" role="status">
            {AUTH_UNAVAILABLE_COPY}
          </p>
        ) : null}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className={AUTH_FUNNEL_LABEL_CLASS}>Email</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-neutral-500 dark:text-neutral-400" />
              <input
                className={AUTH_FUNNEL_INPUT_WITH_ICON_CLASS}
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between gap-2">
              <label className={AUTH_FUNNEL_LABEL_CLASS}>Password</label>
              <Link
                to="/forgot-password"
                className="shrink-0 text-xs font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-neutral-500 dark:text-neutral-400" />
              <input
                className={AUTH_FUNNEL_INPUT_WITH_ICON_CLASS}
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <button type="submit" disabled={loading} className="ios-btn mt-1 w-full bg-emerald-600 text-white">
            {loading ? 'Signing in…' : 'Log In'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-600 md:text-left dark:text-neutral-400">
          Don&apos;t have an account?{' '}
          <Link
            className="font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
            to={signUpHref}
          >
            Sign up
          </Link>
        </p>

        {showRoleQuickAccess && (
          <div className="mt-6 border-t border-neutral-200/80 pt-4 dark:border-neutral-700">
            <p className="mb-2 text-xs font-medium text-neutral-600 dark:text-neutral-400">
              Role quick access (non-production)
            </p>
            <div className="flex flex-wrap gap-2">
              {demoAccounts.map((account) => (
                <button
                  key={account.label}
                  type="button"
                  onClick={() => void quickLogin(account)}
                  className="rounded-lg bg-neutral-100 px-2.5 py-1.5 text-xs font-medium text-neutral-700 active:bg-neutral-200 disabled:opacity-60 dark:bg-neutral-800 dark:text-neutral-200"
                  disabled={loading}
                >
                  {account.label}
                </button>
              ))}
            </div>
          </div>
        )}
    </AuthFunnelShell>
  );
};
