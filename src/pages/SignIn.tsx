import { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Mail, Lock, Mountain, X } from 'lucide-react';
import { api } from '../api/services';
import { setActiveTenantId } from '../api/tenant';
import { GoogleAuthSection } from '../components/auth/GoogleAuthSection';
import { useAuth } from '../context/AuthContext';
import { accountRouteByRole, defaultRouteByRole } from '../utils/authRouting';
import { resolveAuthRedirect } from '../utils/authRedirect';
import { isPendingEmailVerification } from '../utils/authVerification';
import {
  clearAuthReturnContext,
  parseAuthReturnContextFromSearch,
  saveAuthReturnContext
} from '../utils/authReturnContext';
import { PageMeta } from '../components/seo/PageMeta';

export const SignIn = () => {
  const { signIn, signInDemo, signInWithGoogle, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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

  const handleBack = () => {
    if (from && from !== '/signin' && from !== '/signup') {
      navigate(from);
      return;
    }
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate('/');
  };

  const isFromValidForRole = (path: string, role: string): boolean => {
    // non-visitor roles must always land on their hub unless returning to a role-specific path
    const organizerRoles = ['tenant_owner', 'tenant_admin', 'tenant_guide'];
    if (organizerRoles.includes(role)) return path.startsWith('/host') || path.startsWith('/organizer');
    if (role === 'platform_admin') return path.startsWith('/admin');
    if (role === 'merchant_admin') return path.startsWith('/merchant');
    return true;
  };

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
    if (from && from !== '/' && from !== '/signin' && from !== '/signup' &&
        isFromValidForRole(from, signedInUser.role)) {
      const context = parseAuthReturnContextFromSearch(searchParams, from);
      if (context) {
        saveAuthReturnContext(context);
      } else {
        clearAuthReturnContext();
      }
      navigate(from, { replace: true });
      return;
    }

    clearAuthReturnContext();

    if (
      signedInUser.role === 'tenant_owner' ||
      signedInUser.role === 'tenant_admin' ||
      signedInUser.role === 'tenant_guide'
    ) {
      const tenants = await api.getMyTenants().catch(() => null);
      const firstTenant = tenants?.data?.[0];
      if (firstTenant) {
        setActiveTenantId(firstTenant.tenantId);
      }
    }

    navigate(
      signedInUser.role === 'participant'
        ? defaultRouteByRole(signedInUser.role)
        : accountRouteByRole(signedInUser.role),
      { replace: true }
    );
  };

  const demoAccounts = [
    { label: 'Admin', email: 'admin@uaetrails.app', password: 'Admin@12345' },
    { label: 'Visitor', email: 'visitor@uaetrails.app', password: 'Visitor@12345' },
    { label: 'Vendor', email: 'vendor@uaetrails.app', password: 'Vendor@12345' },
    { label: 'Tour Operator', email: 'organizer@uaetrails.app', password: 'Organizer@12345' }
  ];

  const quickLogin = async (account: (typeof demoAccounts)[number]) => {
    setError(null);
    setEmail(account.email);
    setPassword(account.password);
    try {
      await completeAuth(await signInDemo(account.email));
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Sign in failed');
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      await completeAuth(await signIn(email, password));
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Sign in failed');
    }
  };

  const handleGoogleSignIn = async (idToken: string) => {
    setError(null);
    try {
      await completeAuth(await signInWithGoogle(idToken));
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Google sign in failed');
    }
  };

  const fieldClass = 'ios-input text-[17px] border border-neutral-300 bg-white';

  return (
    <div className="min-h-screen bg-ios-bg flex flex-col py-8 px-6 safe-area-top safe-area-bottom">
      <PageMeta title="Sign in" noIndex />

      <div className="max-w-md w-full mx-auto bg-white rounded-[20px] shadow-ios p-6 sm:p-8 flex-1">
        <div className="flex items-center justify-between mb-2">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-0.5 -ml-1 pl-1 pr-2 py-1 text-emerald-600 active:opacity-60"
          >
            <ChevronLeft className="w-6 h-6" strokeWidth={2.25} />
            <span className="text-[17px] font-medium">Back</span>
          </button>
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 active:opacity-60"
            aria-label="Close"
          >
            <X className="w-5 h-5" strokeWidth={2.25} />
          </button>
        </div>

        <Link to="/" className="flex items-center justify-center gap-2 mb-5 -mt-1">
          <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-emerald-700 rounded-[10px] flex items-center justify-center">
            <Mountain className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-neutral-900 tracking-tight">UAE Trail</span>
        </Link>
        <h1 className="text-[28px] font-bold text-neutral-900 mb-1 tracking-tight text-center">Welcome</h1>
        <p className="text-[15px] text-neutral-500 mb-6 text-center">Log in to your UAE Trail account</p>

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

        <p className="text-sm text-gray-500 mt-5 text-center">
          Don&apos;t have an account?{' '}
          <Link className="text-emerald-700 hover:text-emerald-900 font-medium" to="/signup">
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
      </div>
    </div>
  );
};
