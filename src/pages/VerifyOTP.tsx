import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { defaultRouteByRole } from '../utils/authRouting';
import { PageMeta } from '../components/seo/PageMeta';

export const VerifyOTP = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyEmail } = useAuth();
  const [searchParams] = useSearchParams();
  const state = location.state as {
    email?: string;
    verificationToken?: string;
    mode?: 'email' | 'password-reset';
    redirectTo?: string;
  } | null;

  const email = searchParams.get('email') ?? state?.email ?? '';
  const tokenFromUrl = searchParams.get('token') ?? '';
  const modeParam = searchParams.get('mode');
  const mode = modeParam === 'password-reset' ? 'password-reset' : (state?.mode ?? 'email');
  const verificationToken = tokenFromUrl || state?.verificationToken || '';

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const autoRan = useRef(false);

  useEffect(() => {
    if (!email) {
      navigate('/signin', { replace: true });
    }
  }, [email, navigate]);

  const runVerify = async (token: string) => {
    if (!token) {
      setError('No verification token. Check your email for the link or request a new one.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (mode === 'email') {
        const user = await verifyEmail(token);
        setSuccess(true);
        const redirectTo = state?.redirectTo ?? defaultRouteByRole(user.role);
        setTimeout(() => navigate(redirectTo, { replace: true }), 800);
      } else {
        navigate('/forgot-password', {
          state: { email, resetToken: token, step: 'reset' },
          replace: true
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (verificationToken && !autoRan.current) {
      autoRan.current = true;
      void runVerify(verificationToken);
    }
  }, [verificationToken]);

  const handleResend = async () => {
    setResending(true);
    setError(null);
    try {
      if (mode === 'password-reset') {
        const res = await apiRequest<{ resetToken?: string }>('/auth/forgot-password', {
          method: 'POST',
          body: JSON.stringify({ email })
        });
        if (import.meta.env.DEV && res.resetToken) {
          navigate(`/verify?token=${encodeURIComponent(res.resetToken)}&email=${encodeURIComponent(email)}&mode=password-reset`, {
            replace: true
          });
        }
      } else {
        const res = await apiRequest<{ verificationToken?: string }>('/auth/resend-verification', {
          method: 'POST',
          body: JSON.stringify({ email })
        });
        if (import.meta.env.DEV && res.verificationToken) {
          navigate(`/verify?token=${encodeURIComponent(res.verificationToken)}&email=${encodeURIComponent(email)}`, {
            replace: true
          });
        }
      }
    } catch {
      setError('Could not resend email. Please try again.');
    } finally {
      setResending(false);
    }
  };

  if (!email) return null;

  return (
    <div className="min-h-screen bg-ios-bg flex items-center justify-center p-6 safe-area-top safe-area-bottom">
      <PageMeta title="Verify email" noIndex />
      <div className="max-w-md w-full bg-white rounded-[20px] shadow-ios p-8 text-center">
        <div className="mx-auto w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
          <ShieldCheck className="w-7 h-7 text-emerald-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          {success ? 'Verified!' : mode === 'password-reset' ? 'Reset your password' : 'Verify your email'}
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          {success
            ? 'Your email has been verified. Taking you in…'
            : `We sent a link to ${email}. Open it on this device or paste the link below.`}
        </p>

        {!success && (
          <>
            {loading && (
              <p className="text-sm text-emerald-600 mb-4">Verifying…</p>
            )}

            {import.meta.env.DEV && verificationToken && (
              <p className="text-xs text-gray-400 mb-3 break-all">
                Dev token: <span className="font-mono text-gray-500">{verificationToken}</span>
              </p>
            )}

            {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

            {!verificationToken && (
              <button
                onClick={() => void handleResend()}
                disabled={resending}
                className="w-full bg-emerald-600 text-white rounded-lg py-2.5 hover:bg-emerald-700 disabled:opacity-60 text-sm font-medium transition-colors mb-3"
              >
                {resending ? 'Sending…' : 'Resend verification email'}
              </button>
            )}

            {verificationToken && !loading && error && (
              <button
                onClick={() => void runVerify(verificationToken)}
                className="w-full bg-emerald-600 text-white rounded-lg py-2.5 hover:bg-emerald-700 text-sm font-medium transition-colors mb-3"
              >
                Try again
              </button>
            )}

            <p className="text-sm text-gray-500">
              Didn&apos;t receive it?{' '}
              <button
                type="button"
                onClick={() => void handleResend()}
                disabled={resending}
                className="text-emerald-600 hover:text-emerald-700 font-medium disabled:opacity-60"
              >
                {resending ? 'Sending…' : 'Resend'}
              </button>
            </p>
          </>
        )}

        {success && (
          <div className="text-emerald-600 text-sm font-medium">Email verified — opening your account…</div>
        )}
      </div>
    </div>
  );
};
