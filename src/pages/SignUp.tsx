import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Mountain } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const SignUp = () => {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGmailSignUp = () => {
    // Placeholder — in production this calls Google OAuth
    setError('Google sign-up will be available soon. Please sign up with email for now.');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!agreedToTerms) {
      setError('Please agree to the Terms and Conditions and Privacy Policy.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      const response = await register({
        email: formData.email,
        password: formData.password,
        displayName: formData.displayName,
        accountType: 'visitor',
      });
      // Navigate to OTP verification
      navigate('/verify', {
        state: {
          email: formData.email,
          verificationToken: response.verificationToken,
        },
      });
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Could not create account.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-xl border shadow-sm p-8">
        <Link to="/" className="flex items-center justify-center gap-2 mb-6">
          <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-emerald-700 rounded-lg flex items-center justify-center">
            <Mountain className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900 tracking-tight">UAE Trails</span>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Create Account</h1>
        <p className="text-sm text-gray-500 mb-6">Join UAE Trails and start exploring</p>

        {/* Gmail sign-up */}
        <button
          type="button"
          onClick={handleGmailSignUp}
          className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 mb-4"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-3 text-gray-400">or sign up with email</span>
          </div>
        </div>

        {/* Email form */}
        <form className="space-y-3" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Full Name</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Your full name"
              value={formData.displayName}
              onChange={(e) => setFormData((c) => ({ ...c, displayName: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                className="w-full border rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData((c) => ({ ...c, email: e.target.value }))}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Password</label>
              <input
                type="password"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Min 8 characters"
                value={formData.password}
                onChange={(e) => setFormData((c) => ({ ...c, password: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Confirm</label>
              <input
                type="password"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Re-enter password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData((c) => ({ ...c, confirmPassword: e.target.value }))}
                required
              />
            </div>
          </div>

          {/* Terms checkbox */}
          <label className="flex items-start gap-2 mt-2">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-xs text-gray-600 leading-relaxed">
              By signing up, I agree to UAE Trails{' '}
              <a href="/terms" className="text-emerald-700 hover:underline">Terms and Conditions</a>{' '}
              and{' '}
              <a href="/privacy" className="text-emerald-700 hover:underline">Privacy Policy</a>.
            </span>
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white rounded-lg py-2.5 hover:bg-emerald-700 disabled:opacity-60 text-sm font-medium transition-colors"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-sm text-gray-500 mt-5 text-center">
          Already have an account?{' '}
          <Link to="/signin" className="text-emerald-700 hover:text-emerald-900 font-medium">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};
