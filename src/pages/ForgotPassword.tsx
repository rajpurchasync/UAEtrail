import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowLeft, ShieldCheck, CheckCircle } from 'lucide-react';
import { apiRequest } from '../api/client';
import { PageMeta } from '../components/seo/PageMeta';

type Step = 'email' | 'otp' | 'reset' | 'done';

export const ForgotPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const incomingState = location.state as {
    email?: string;
    resetToken?: string;
    step?: Step;
  } | null;

  const [step, setStep] = useState<Step>(incomingState?.step ?? 'email');
  const [email, setEmail] = useState(incomingState?.email ?? '');
  const [resetToken, setResetToken] = useState(incomingState?.resetToken ?? '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Step 1: Request password reset
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiRequest<{ message: string; resetToken?: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      if (res.resetToken) {
        setResetToken(res.resetToken);
      }
      setStep('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset code.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP (navigate to verify page)
  const handleVerifyOTP = () => {
    navigate('/verify', {
      state: { email, verificationToken: resetToken, mode: 'password-reset' },
    });
  };

  // Step 3: Reset password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      await apiRequest('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token: resetToken, password: newPassword }),
      });
      setStep('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ios-bg flex items-center justify-center p-6 safe-area-top safe-area-bottom">
      <PageMeta title="Reset password" noIndex />
      <div className="max-w-md w-full bg-white rounded-[20px] shadow-ios p-8">
        {/* Step 1: Enter email */}
        {step === 'email' && (
          <>
            <Link
              to="/signin"
              className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-5"
            >
              <ArrowLeft className="w-4 h-4" /> Back to login
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Forgot password?</h1>
            <p className="text-sm text-gray-500 mb-6">
              Enter your email and we&apos;ll send you a code to reset your password.
            </p>
            <form onSubmit={handleRequestReset} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 text-white rounded-lg py-2.5 hover:bg-emerald-700 disabled:opacity-60 text-sm font-medium transition-colors"
              >
                {loading ? 'Sending...' : 'Send Reset Code'}
              </button>
            </form>
          </>
        )}

        {/* Step 2: OTP sent — redirect to verify page or enter token directly */}
        {step === 'otp' && (
          <div className="text-center">
            <div className="mx-auto w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
              <ShieldCheck className="w-7 h-7 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Check your email</h1>
            <p className="text-sm text-gray-500 mb-6">
              We sent a password reset code to <strong>{email}</strong>
            </p>

            {import.meta.env.DEV && resetToken && (
              <p className="text-xs text-gray-400 mb-4">
                Dev token: <span className="font-mono text-gray-500 select-all">{resetToken}</span>
              </p>
            )}

            {/* In this flow, skip OTP page and go straight to reset since we have the token */}
            <button
              onClick={() => setStep('reset')}
              className="w-full bg-emerald-600 text-white rounded-lg py-2.5 hover:bg-emerald-700 text-sm font-medium transition-colors mb-3"
            >
              Continue to Reset Password
            </button>

            <button
              type="button"
              onClick={handleVerifyOTP}
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              Enter verification code instead
            </button>
          </div>
        )}

        {/* Step 3: Enter new password */}
        {step === 'reset' && (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Set new password</h1>
            <p className="text-sm text-gray-500 mb-6">
              Choose a strong password for your account.
            </p>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full border rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Min 8 characters"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full border rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Re-enter password"
                    required
                  />
                </div>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 text-white rounded-lg py-2.5 hover:bg-emerald-700 disabled:opacity-60 text-sm font-medium transition-colors"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          </>
        )}

        {/* Step 4: Success */}
        {step === 'done' && (
          <div className="text-center">
            <div className="mx-auto w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-7 h-7 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Password updated!</h1>
            <p className="text-sm text-gray-500 mb-6">
              Your password has been changed successfully.
            </p>
            <Link
              to="/signin"
              className="inline-flex items-center justify-center w-full bg-emerald-600 text-white rounded-lg py-2.5 hover:bg-emerald-700 text-sm font-medium transition-colors"
            >
              Log In
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
