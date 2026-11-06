import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { AuthFunnelShell } from '../components/auth/AuthFunnelShell';
import { setActiveTenantId } from '../api/tenant';
import { fetchMeProfile } from '../hooks/memberProfileApi';
import { fetchMemberStatus } from '../hooks/memberStatusApi';
import { GoogleAuthSection } from '../components/auth/GoogleAuthSection';
import { useAuth } from '../context/AuthContext';
import { accountRouteByRole, defaultRouteByRole } from '../utils/authRouting';
import { isPlatformAdmin } from '../utils/roles';
import {
  navigateAuthBack,
  navigateAuthClose,
  resolveAuthRedirect
} from '../utils/authRedirect';
import { navigateToPostAuthReturn, resolvePostAuthReturnPath } from '../utils/authPostLoginNavigation';
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

  const from = resolveAuthRedirect(
    (location.state as { from?: string } | null)?.from,
    searchParams.get('redirect')
  );

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

  const fieldClass = 'ios-input text-[17px] border border-neutral-300 bg-white';

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

        <form className="space-y-3" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-neutral-500 pointer-events-none" />
              <input
                className={`${fieldClass} pl-11`}
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <Link to="/forgot-password" className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-neutral-500 pointer-events-none" />
              <input
                className={`${fieldClass} pl-11`}
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="ios-btn w-full bg-emerald-600 text-white mt-1"
          >
            {loading ? 'Signing in…' : 'Log In'}
          </button>
        </form>

        <p className="text-sm text-gray-500 mt-5 text-center md:text-left">
          Don&apos;t have an account?{' '}
          <Link className="text-emerald-700 hover:text-emerald-900 font-medium" to={signUpHref}>
            Sign up
          </Link>
        </p>

        {showRoleQuickAccess && (
          <div className="mt-5 pt-4 border-t">
            <p className="text-xs font-medium text-gray-700 mb-2">Role quick access (non-production)</p>
            <div className="flex flex-wrap gap-2">
              {demoAccounts.map((account) => (
                <button
                  key={account.label}
                  type="button"
                  onClick={() => void quickLogin(account)}
                  className="px-2 py-1 text-xs rounded bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-60"
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
