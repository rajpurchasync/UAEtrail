import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Mail, Mountain } from 'lucide-react';
import { apiRequest } from '../api/client';
import { OtpInput } from '../components/auth/OtpInput';
import { PageMeta } from '../components/seo/PageMeta';
import { useAuth } from '../context/AuthContext';

const OTP_LENGTH = 6;

type VerifyLocationState = {
  email?: string;
  expiresAt?: string;
  expiresInSeconds?: number;
  mode?: 'email' | 'password-reset';
  redirectTo?: string;
  notice?: string;
};

type ResendResponse = {
  expiresAt?: string;
  expiresInSeconds?: number;
  resetToken?: string;
};

export const VerifyOTP = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyEmail } = useAuth();
  const state = (location.state as VerifyLocationState | null) ?? {};

  const email = state.email ?? '';
  const mode = state.mode ?? 'email';
  const redirectTo = state.redirectTo ?? '/';

  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [expiresAt, setExpiresAt] = useState<number | null>(() => {
    if (state.expiresAt) return new Date(state.expiresAt).getTime();
    if (state.expiresInSeconds) return Date.now() + state.expiresInSeconds * 1000;
    return Date.now() + 60_000;
  });
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (!email) {
      navigate('/signin', { replace: true });
    }
  }, [email, navigate]);

  useEffect(() => {
    if (!expiresAt) return undefined;

    const tick = () => {
      const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      setSecondsLeft(remaining);
    };

    tick();
    const timer = window.setInterval(tick, 250);
    return () => window.clearInterval(timer);
  }, [expiresAt]);

  const runVerify = async (code: string) => {
    if (code.length !== OTP_LENGTH) {
      setError('Enter the 6-digit code from your email.');
      return;
    }
    if (secondsLeft <= 0) {
      setError('This code has expired. Request a new one.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (mode === 'password-reset') {
        navigate('/forgot-password', {
          state: { email, resetToken: code, step: 'reset' },
          replace: true
        });
        return;
      }

      await verifyEmail(email, code);
      navigate('/welcome', { replace: true, state: { redirectTo } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (otp.length === OTP_LENGTH && !loading && secondsLeft > 0) {
      void runVerify(otp);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- verify when OTP is complete
  }, [otp]);

  const handleResend = async () => {
    if (secondsLeft > 0 || resending) return;

    setResending(true);
    setError(null);
    setOtp('');
    try {
      if (mode === 'password-reset') {
        await apiRequest<ResendResponse>('/auth/forgot-password', {
          method: 'POST',
          body: JSON.stringify({ email })
        });
        setExpiresAt(Date.now() + 60_000);
      } else {
        const res = await apiRequest<ResendResponse>('/auth/resend-verification', {
          method: 'POST',
          body: JSON.stringify({ email })
        });
        if (res.expiresAt) {
          setExpiresAt(new Date(res.expiresAt).getTime());
        } else if (res.expiresInSeconds) {
          setExpiresAt(Date.now() + res.expiresInSeconds * 1000);
        } else {
          setExpiresAt(Date.now() + 60_000);
        }
      }
    } catch {
      setError('Could not resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  if (!email) return null;

  if (mode === 'password-reset') {
    return (
      <div className="min-h-screen bg-ios-bg flex items-center justify-center p-6 safe-area-top safe-area-bottom">
        <PageMeta title="Reset password" noIndex />
        <div className="max-w-md w-full bg-white rounded-[20px] shadow-ios p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Reset your password</h1>
          <p className="text-sm text-gray-500 mb-6">Check your email for the reset link sent to {email}.</p>
          <button
            type="button"
            onClick={() => navigate('/signin', { replace: true })}
            className="text-sm text-emerald-600 font-medium"
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ios-bg flex flex-col justify-center px-6 py-10 safe-area-top safe-area-bottom">
      <PageMeta title="Verify email" noIndex />
      <div className="max-w-md w-full mx-auto bg-white rounded-[20px] shadow-ios p-8">
        <Link to="/" className="flex items-center justify-center gap-2 mb-6">
          <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-emerald-700 rounded-[10px] flex items-center justify-center">
            <Mountain className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-neutral-900 tracking-tight">UAE Trail</span>
        </Link>

        <div className="mx-auto w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
          <Mail className="w-6 h-6 text-emerald-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 text-center mb-1">Verify your email</h1>
        {state.notice && (
          <p className="text-sm text-emerald-700 text-center mb-2">{state.notice}</p>
        )}
        <p className="text-sm text-gray-500 text-center mb-6">
          Enter the 6-digit code sent to <span className="font-medium text-gray-700">{email}</span>
        </p>

        <OtpInput value={otp} onChange={setOtp} disabled={loading || secondsLeft <= 0} autoFocus />

        <p className="text-center text-sm mt-4 text-gray-500">
          {secondsLeft > 0 ? (
            <>
              Code expires in <span className="font-semibold text-emerald-700">{secondsLeft}s</span>
            </>
          ) : (
            <span className="text-amber-700 font-medium">Code expired</span>
          )}
        </p>

        {error && <p className="text-sm text-red-600 text-center mt-3">{error}</p>}

        <button
          type="button"
          onClick={() => void handleResend()}
          disabled={resending || secondsLeft > 0}
          className="w-full mt-6 bg-emerald-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {resending ? 'Sending…' : secondsLeft > 0 ? `Resend in ${secondsLeft}s` : 'Resend code'}
        </button>

        <p className="text-xs text-center text-gray-400 mt-4">
          Wrong email?{' '}
          <Link to="/signup" className="text-emerald-600 font-medium">
            Start over
          </Link>
          {' · '}
          <Link to="/signin" className="text-emerald-600 font-medium">
            Sign in to resend code
          </Link>
        </p>
      </div>
    </div>
  );
};
