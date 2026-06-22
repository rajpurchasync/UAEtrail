import { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Mail, Lock, Mountain } from 'lucide-react';
import { api } from '../api/services';
import { setActiveTenantId } from '../api/tenant';
import { GoogleAuthSection } from '../components/auth/GoogleAuthSection';
import { useAuth } from '../context/AuthContext';
import { accountRouteByRole, defaultRouteByRole } from '../utils/authRouting';
import { resolveAuthRedirect } from '../utils/authRedirect';
import { PageMeta } from '../components/seo/PageMeta';

export const SignIn = () => {
  const { signIn, signInWithGoogle, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

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

  const completeAuth = async (signedInUser: Awaited<ReturnType<typeof signIn>>) => {
    if (from && from !== '/' && from !== '/signin' && from !== '/signup') {
      navigate(from, { replace: true });
      return;
    }

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
      signedInUser.role === 'visitor'
        ? defaultRouteByRole(signedInUser.role)
        : accountRouteByRole(signedInUser.role),
      { replace: true }
    );
  };

  const demoAccounts = [
    { label: 'Admin', email: 'admin@uaetrails.app', password: 'Admin@12345' },
    { label: 'Organizer', email: 'organizer@uaetrails.app', password: 'Organizer@12345' },
    { label: 'Visitor', email: 'visitor@uaetrails.app', password: 'Visitor@12345' }
  ];

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

  return (
    <div className="min-h-screen consumer-bg flex flex-col p-6 safe-area-top safe-area-bottom">
      <PageMeta title="Sign in" noIndex />
      <div className="max-w-md w-full mx-auto mb-4">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-0.5 -ml-1 pl-1 pr-2 py-1 text-emerald-600 active:opacity-60"
        >
          <ChevronLeft className="w-6 h-6" strokeWidth={2.25} />
          <span className="text-[17px] font-medium">Back</span>
        </button>
      </div>
      <div className="max-w-md w-full mx-auto glass-card shadow-glass-lg p-8 flex-1 flex flex-col justify-center animate-fade-up">
        <Link to="/" className="flex items-center justify-center gap-2 mb-6">
          <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-emerald-700 rounded-[10px] flex items-center justify-center">
            <Mountain className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-neutral-900 tracking-tight">UAE Trail</span>
        </Link>
        <h1 className="text-[28px] font-bold text-neutral-900 mb-1 tracking-tight">Welcome back</h1>
        <p className="text-[15px] text-neutral-500 mb-6">Log in to your UAE Trail account</p>

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
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                className="ios-input pl-10 text-[17px]"
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
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                className="ios-input pl-10 text-[17px]"
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

        {import.meta.env.DEV && (
          <div className="mt-5 pt-4 border-t">
            <p className="text-xs font-medium text-gray-700 mb-2">Dev quick access</p>
            <div className="flex flex-wrap gap-2">
              {demoAccounts.map((account) => (
                <button
                  key={account.label}
                  type="button"
                  onClick={async () => {
                    setEmail(account.email);
                    setPassword(account.password);
                    try {
                      await completeAuth(await signIn(account.email, account.password));
                    } catch (submissionError) {
                      setError(submissionError instanceof Error ? submissionError.message : 'Sign in failed');
                    }
                  }}
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
