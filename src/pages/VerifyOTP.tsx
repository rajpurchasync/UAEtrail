import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { apiRequest } from '../api/client';

export const VerifyOTP = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as {
    email?: string;
    verificationToken?: string;
    mode?: 'email' | 'password-reset';
  } | null;

  const email = state?.email ?? '';
  const verificationToken = state?.verificationToken ?? '';
  const mode = state?.mode ?? 'email';

  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // In dev mode, auto-fill the OTP boxes with the first 6 chars of the token
  useEffect(() => {
    if (import.meta.env.DEV && verificationToken) {
      const chars = verificationToken.slice(0, 6).split('');
      setOtp((prev) => chars.map((c, i) => c ?? prev[i] ?? ''));
    }
  }, [verificationToken]);

  // Redirect if no email
  useEffect(() => {
    if (!email) {
      navigate('/signin', { replace: true });
    }
  }, [email, navigate]);

  const handleChange = (index: number, value: string) => {
    if (!/^[a-zA-Z0-9]?$/.test(value)) return;
    const updated = [...otp];
    updated[index] = value;
    setOtp(updated);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text').trim().slice(0, 6);
    if (pasted.length > 0) {
      e.preventDefault();
      const chars = pasted.split('');
      setOtp((prev) => prev.map((c, i) => chars[i] ?? c));
      const nextIndex = Math.min(chars.length, 5);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  const handleVerify = async () => {
    setError(null);
    // We use the actual token for verification, not the 6-char display
    const token = verificationToken;
    if (!token) {
      setError('No verification token available. Please try again.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'email') {
        await apiRequest('/auth/verify-email', {
          method: 'POST',
          body: JSON.stringify({ token }),
        });
        setSuccess(true);
        // Navigate to onboarding after a brief moment
        setTimeout(() => {
          navigate('/onboarding', { replace: true });
        }, 1200);
      } else if (mode === 'password-reset') {
        // For password reset, pass the token to the reset step
        navigate('/forgot-password', {
          state: { email, resetToken: token, step: 'reset' },
          replace: true,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError(null);
    try {
      // For email verification: re-register is not ideal, so we show a message
      // For password reset: call forgot-password again
      if (mode === 'password-reset') {
        const res = await apiRequest<{ resetToken?: string }>('/auth/forgot-password', {
          method: 'POST',
          body: JSON.stringify({ email }),
        });
        if (import.meta.env.DEV && res.resetToken) {
          // Update state with new token
          navigate('/verify', {
            state: { email, verificationToken: res.resetToken, mode: 'password-reset' },
            replace: true,
          });
        }
      }
      setError(null);
    } catch {
      setError('Could not resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  if (!email) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl border shadow-sm p-8 text-center">
        <div className="mx-auto w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
          <ShieldCheck className="w-7 h-7 text-emerald-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          {success ? 'Verified!' : 'Verify your email'}
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          {success
            ? 'Your email has been verified successfully.'
            : `We sent a verification code to ${email}`}
        </p>

        {!success && (
          <>
            {/* OTP Input boxes */}
            <div className="flex justify-center gap-2 mb-5">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => { inputRefs.current[idx] = el; }}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  onPaste={idx === 0 ? handlePaste : undefined}
                  className="w-11 h-12 text-center text-lg font-semibold border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              ))}
            </div>

            {import.meta.env.DEV && verificationToken && (
              <p className="text-xs text-gray-400 mb-3">
                Dev token: <span className="font-mono text-gray-500 select-all">{verificationToken}</span>
              </p>
            )}

            {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

            <button
              onClick={handleVerify}
              disabled={loading}
              className="w-full bg-emerald-600 text-white rounded-lg py-2.5 hover:bg-emerald-700 disabled:opacity-60 text-sm font-medium transition-colors mb-3"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>

            <p className="text-sm text-gray-500">
              Didn&apos;t receive the code?{' '}
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="text-emerald-600 hover:text-emerald-700 font-medium disabled:opacity-60"
              >
                {resending ? 'Sending...' : 'Resend'}
              </button>
            </p>
          </>
        )}

        {success && (
          <div className="text-emerald-600 text-sm font-medium">Redirecting to onboarding...</div>
        )}
      </div>
    </div>
  );
};
