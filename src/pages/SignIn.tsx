import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api/services';
import { setActiveTenantId } from '../api/tenant';
import { useAuth } from '../context/AuthContext';
import { defaultRouteByRole } from '../utils/authRouting';

export const SignIn = () => {
  const { signIn, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const from = (location.state as { from?: string } | null)?.from ?? '/';
  const demoAccounts = [
    { label: 'Admin', email: 'admin@uaetrails.app', password: 'Admin@12345' },
    { label: 'Organizer', email: 'organizer@uaetrails.app', password: 'Organizer@12345' },
    { label: 'Visitor', email: 'visitor@uaetrails.app', password: 'Visitor@12345' }
  ];

  const completeSignIn = async (targetEmail: string, targetPassword: string) => {
    setError(null);
    const signedInUser = await signIn(targetEmail, targetPassword);

    if (from !== '/') {
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

    navigate(defaultRouteByRole(signedInUser.role), { replace: true });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await completeSignIn(email, password);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Sign in failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg border shadow-sm p-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Sign In</h1>
        <p className="text-sm text-gray-600 mb-6">Access admin, organizer, or user dashboards.</p>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              className="w-full border rounded-md px-3 py-2"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              className="w-full border rounded-md px-3 py-2"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white rounded-md py-2 hover:bg-emerald-700 disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p className="text-sm text-gray-600 mt-6">
          Need an account?{' '}
          <Link className="text-emerald-700 hover:text-emerald-900" to="/signup">
            Sign up
          </Link>
        </p>
        {import.meta.env.DEV && (
          <div className="mt-6 pt-5 border-t">
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
                      await completeSignIn(account.email, account.password);
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
