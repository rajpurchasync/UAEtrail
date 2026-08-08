import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Mountain, Gift } from 'lucide-react';
import { GoogleAuthSection } from '../components/auth/GoogleAuthSection';
import { useAuth } from '../context/AuthContext';
import { defaultRouteByRole } from '../utils/authRouting';
import { resolveAuthRedirect } from '../utils/authRedirect';
import { PageMeta } from '../components/seo/PageMeta';

export const SignUp = () => {
  const { register, signInWithGoogle, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get('ref')?.trim().toUpperCase() ?? undefined;
  const groupInviteToken = searchParams.get('groupInvite')?.trim() ?? undefined;
  const redirectTo = resolveAuthRedirect(null, searchParams.get('redirect'));
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignUp = async (idToken: string) => {
    setError(null);
    if (!agreedToTerms) {
      setError('Please agree to the Terms and Conditions and Privacy Policy.');
      return;
    }
    try {
      const user = await signInWithGoogle(idToken, referralCode, groupInviteToken);
      navigate(redirectTo ?? defaultRouteByRole(user.role), { replace: true });
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Google sign up failed');
    }
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
        referralCode,
        groupInviteToken,
      });
      // Navigate to OTP verification
      navigate('/verify', {
        state: {
          email: formData.email,
          verificationToken: response.verificationToken,
          redirectTo,
        },
      });
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Could not create account.');
    }
  };

  return (
    <div className="min-h-screen bg-ios-bg flex items-center justify-center py-12 px-6 safe-area-top safe-area-bottom">
      <PageMeta title="Create account" noIndex />
      <div className="max-w-md w-full bg-white rounded-[20px] shadow-ios p-8">
        <Link to="/" className="flex items-center justify-center gap-2 mb-6">
          <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-emerald-700 rounded-[10px] flex items-center justify-center">
            <Mountain className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-neutral-900 tracking-tight">UAE Trail</span>
        </Link>
        <h1 className="text-[28px] font-bold text-neutral-900 mb-1 tracking-tight">Create Account</h1>
        <p className="text-[15px] text-neutral-500 mb-6">Join UAE Trail and start exploring</p>

        {referralCode && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2.5 text-sm text-emerald-800">
            <Gift className="w-4 h-4 shrink-0" />
            <span>You&apos;ll earn <strong>25 bonus Trail Points</strong> with invite code <strong>{referralCode}</strong></span>
          </div>
        )}

        {groupInviteToken && (
          <div className="mb-4 rounded-xl bg-sky-50 border border-sky-100 px-3 py-2.5 text-sm text-sky-800">
            You were invited to join a group. Create your account and you&apos;ll be added automatically.
          </div>
        )}

        <GoogleAuthSection
          onSuccess={handleGoogleSignUp}
          onError={setError}
          text="signup_with"
          disabled={loading}
        />

        {/* Email form */}
        <form className="space-y-3" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Full Name</label>
            <input
              className="ios-input text-[17px]"
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
                className="ios-input pl-10 text-[17px]"
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
                className="ios-input text-[17px]"
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
                className="ios-input text-[17px]"
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
              By signing up, I agree to UAE Trail{' '}
              <Link to="/terms" className="text-emerald-700 hover:underline">Terms and Conditions</Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-emerald-700 hover:underline">Privacy Policy</Link>.
            </span>
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="ios-btn w-full bg-emerald-600 text-white"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-sm text-gray-500 mt-5 text-center">
          Already have an account?{' '}
          <Link
            to={redirectTo ? `/signin?redirect=${encodeURIComponent(redirectTo)}` : '/signin'}
            className="text-emerald-700 hover:text-emerald-900 font-medium"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};
