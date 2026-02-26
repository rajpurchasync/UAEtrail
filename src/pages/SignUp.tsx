import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

type AccountType = 'visitor' | 'company' | 'guide';

export const SignUp = () => {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
    accountType: 'visitor' as AccountType,
    organizationName: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setVerificationToken(null);
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      const response = await register({
        email: formData.email,
        password: formData.password,
        displayName: formData.displayName,
        accountType: formData.accountType,
        organizationName: formData.accountType === 'visitor' ? undefined : formData.organizationName || undefined
      });
      setVerificationToken(response.verificationToken ?? null);
      navigate('/dashboard/overview');
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Could not create account.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-lg w-full bg-white rounded-lg border shadow-sm p-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Create Account</h1>
        <p className="text-sm text-gray-600 mb-6">Join UAE Trails as visitor, company organizer, or independent guide.</p>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm text-gray-700 block mb-1">Full Name</label>
            <input
              className="w-full border rounded-md px-3 py-2"
              value={formData.displayName}
              onChange={(event) => setFormData((current) => ({ ...current, displayName: event.target.value }))}
              required
            />
          </div>
          <div>
            <label className="text-sm text-gray-700 block mb-1">Email</label>
            <input
              type="email"
              className="w-full border rounded-md px-3 py-2"
              value={formData.email}
              onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))}
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-700 block mb-1">Password</label>
              <input
                type="password"
                className="w-full border rounded-md px-3 py-2"
                value={formData.password}
                onChange={(event) => setFormData((current) => ({ ...current, password: event.target.value }))}
                required
              />
            </div>
            <div>
              <label className="text-sm text-gray-700 block mb-1">Confirm Password</label>
              <input
                type="password"
                className="w-full border rounded-md px-3 py-2"
                value={formData.confirmPassword}
                onChange={(event) => setFormData((current) => ({ ...current, confirmPassword: event.target.value }))}
                required
              />
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-700 block mb-1">Account Type</label>
            <select
              className="w-full border rounded-md px-3 py-2"
              value={formData.accountType}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  accountType: event.target.value as AccountType
                }))
              }
            >
              <option value="visitor">Visitor</option>
              <option value="company">Company Organizer</option>
              <option value="guide">Independent Guide</option>
            </select>
          </div>
          {formData.accountType !== 'visitor' && (
            <div>
              <label className="text-sm text-gray-700 block mb-1">Organization or Brand Name</label>
              <input
                className="w-full border rounded-md px-3 py-2"
                value={formData.organizationName}
                onChange={(event) => setFormData((current) => ({ ...current, organizationName: event.target.value }))}
                required
              />
            </div>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          {verificationToken && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
              Dev verification token: {verificationToken}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white rounded-md py-2 hover:bg-emerald-700 disabled:opacity-60"
          >
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>
        <p className="text-sm text-gray-600 mt-6">
          Already have an account?{' '}
          <Link to="/signin" className="text-emerald-700 hover:text-emerald-900">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};
