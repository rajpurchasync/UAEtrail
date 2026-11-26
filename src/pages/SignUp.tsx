import { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Gift } from 'lucide-react';
import { AuthFunnelShell } from '../components/auth/AuthFunnelShell';
import {
  AUTH_FUNNEL_INPUT_CLASS,
  AUTH_FUNNEL_INPUT_WITH_ICON_CLASS,
  AUTH_FUNNEL_LABEL_CLASS,
} from '../components/auth/authFieldStyles';
import { GoogleAuthSection } from '../components/auth/GoogleAuthSection';
import { PasswordRequirements } from '../components/auth/PasswordRequirements';
import { useAuth } from '../context/AuthContext';
import { defaultRouteByRole } from '../utils/authRouting';
import {
  AUTH_UNAVAILABLE_COPY,
  isRejectedAuthRedirectParam,
  navigateAuthBack,
  navigateAuthClose,
  resolveAuthRedirect,
} from '../utils/authRedirect';
import {
  AUTH_UNAVAILABLE_STATE,
  navigateToPostAuthReturn,
  resolvePostAuthReturnPath,
} from '../utils/authPostLoginNavigation';
import { getPasswordValidationError } from '../utils/passwordPolicy';
import { PageMeta } from '../components/seo/PageMeta';
import { fetchMeProfile } from '../hooks/memberProfileApi';
import { resolveWelcomeFinishExplorePath } from '@/discovery/discoveryPortExploreGuest';
import { shouldForceSignupWelcome } from '../utils/signupProfileGate';
import { signInPath } from '../config/routingCatalog';
import { PRODUCT_AUTH_SIGNUP_SUBLINE } from '../content/productNorthStar';
import { PERSON_NAME_MAX, PERSON_NAME_MIN, sanitizePersonNameInput, validatePersonName } from '../utils/personName';

export const SignUp = () => {
  const { register, signInWithGoogle, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get('ref')?.trim().toUpperCase() ?? undefined;
  const groupInviteToken = searchParams.get('groupInvite')?.trim() ?? undefined;
  const rawRedirect = searchParams.get('redirect');
  const redirectTo = resolveAuthRedirect(
    (location.state as { from?: string } | null)?.from,
    rawRedirect
  );
  const redirectUnavailable = isRejectedAuthRedirectParam(rawRedirect);
  const [formData, setFormData] = useState({
    givenName: '',
    surname: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBack = () => navigateAuthBack(navigate, redirectTo);
  const handleClose = () => navigateAuthClose(navigate, redirectTo);

  const handleGoogleSignUp = async (idToken: string) => {
    setError(null);
    if (!agreedToTerms) {
      setError('Quick step first — agree to our Terms and Privacy Policy to continue.');
      return;
    }
    try {
      const user = await signInWithGoogle(idToken, referralCode, groupInviteToken);
      const profile = await fetchMeProfile().catch(() => null);
      const postAuthDefault = defaultRouteByRole(user.role);
      const welcomeRedirectTo = resolveWelcomeFinishExplorePath(
        resolvePostAuthReturnPath(redirectTo, user.role) ?? postAuthDefault
      );
      if (profile && shouldForceSignupWelcome(user.role, profile)) {
        navigate('/welcome', { replace: true, state: { redirectTo: welcomeRedirectTo } });
        return;
      }
      if (navigateToPostAuthReturn(navigate, redirectTo, user.role, searchParams)) {
        return;
      }
      if (redirectTo && !resolvePostAuthReturnPath(redirectTo, user.role)) {
        navigate(postAuthDefault, { replace: true, state: AUTH_UNAVAILABLE_STATE });
        return;
      }
      navigate(postAuthDefault, { replace: true });
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'We couldn\'t finish sign-up — try again or use Google.');
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!agreedToTerms) {
      setError('Quick step first — agree to our Terms and Privacy Policy to continue.');
      return;
    }

    const givenNameError = validatePersonName(formData.givenName, 'Name');
    if (givenNameError) {
      setError(givenNameError);
      return;
    }
    const surnameError = validatePersonName(formData.surname, 'Surname');
    if (surnameError) {
      setError(surnameError);
      return;
    }

    const passwordError = getPasswordValidationError(formData.password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Those passwords don\'t match — try again.');
      return;
    }

    try {
      const response = await register({
        email: formData.email,
        password: formData.password,
        givenName: formData.givenName.trim(),
        surname: formData.surname.trim(),
        accountType: 'participant',
        referralCode,
        groupInviteToken,
      });
      navigate('/verify', {
        state: {
          email: formData.email,
          expiresAt: response.expiresAt,
          expiresInSeconds: response.expiresInSeconds,
          redirectTo,
          notice: response.message,
        },
      });
    } catch (submissionError) {
      const message =
        submissionError instanceof Error ? submissionError.message : 'We couldn\'t finish sign-up — check your email and try again.';
      if (
        submissionError instanceof Error &&
        'code' in submissionError &&
        submissionError.code === 'email_pending_verification'
      ) {
        setError(`${message} Use Log in below to continue.`);
        return;
      }
      setError(message);
    }
  };

  const signInHref = signInPath(redirectTo ? { redirect: redirectTo } : undefined);

  return (
    <AuthFunnelShell
      title="Create Account"
      subline={PRODUCT_AUTH_SIGNUP_SUBLINE}
      onBack={handleBack}
      onClose={handleClose}
    >
      <PageMeta title="Create account" noIndex />

        {redirectUnavailable ? (
          <p className="mb-3 text-sm text-red-600 dark:text-red-400" role="status">
            {AUTH_UNAVAILABLE_COPY}
          </p>
        ) : null}

        {referralCode && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-100">
            <Gift className="w-4 h-4 shrink-0" />
            <span>
              You were invited with code <strong>{referralCode}</strong> — welcome to the crew.
            </span>
          </div>
        )}

        {groupInviteToken && (
          <div className="mb-4 rounded-xl border border-sky-100 bg-sky-50 px-3 py-2.5 text-sm text-sky-800 dark:border-sky-800/50 dark:bg-sky-950/40 dark:text-sky-100">
            You were invited to join a group. Create your account and you&apos;ll be added automatically.
          </div>
        )}

        <GoogleAuthSection
          onSuccess={handleGoogleSignUp}
          onError={setError}
          text="signup_with"
          disabled={loading}
        />

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-3 max-md:grid-cols-1 md:grid-cols-2">
            <div>
              <label className={AUTH_FUNNEL_LABEL_CLASS}>Name</label>
              <input
                className={AUTH_FUNNEL_INPUT_CLASS}
                placeholder="First name"
                value={formData.givenName}
                onChange={(e) =>
                  setFormData((c) => ({ ...c, givenName: sanitizePersonNameInput(e.target.value) }))
                }
                required
                minLength={PERSON_NAME_MIN}
                maxLength={PERSON_NAME_MAX}
                autoComplete="given-name"
              />
            </div>
            <div>
              <label className={AUTH_FUNNEL_LABEL_CLASS}>Surname</label>
              <input
                className={AUTH_FUNNEL_INPUT_CLASS}
                placeholder="Surname"
                value={formData.surname}
                onChange={(e) =>
                  setFormData((c) => ({ ...c, surname: sanitizePersonNameInput(e.target.value) }))
                }
                required
                minLength={PERSON_NAME_MIN}
                maxLength={PERSON_NAME_MAX}
                autoComplete="family-name"
              />
            </div>
          </div>
          <div>
            <label className={AUTH_FUNNEL_LABEL_CLASS}>Email</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-neutral-500 dark:text-neutral-400" />
              <input
                type="email"
                className={AUTH_FUNNEL_INPUT_WITH_ICON_CLASS}
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData((c) => ({ ...c, email: e.target.value }))}
                required
              />
            </div>
          </div>
          <div>
            <label className={AUTH_FUNNEL_LABEL_CLASS}>Password</label>
            <input
              type="password"
              className={AUTH_FUNNEL_INPUT_CLASS}
              placeholder="Create a password"
              value={formData.password}
              onChange={(e) => setFormData((c) => ({ ...c, password: e.target.value }))}
              required
              minLength={8}
              autoComplete="new-password"
            />
            <PasswordRequirements password={formData.password} className="mt-2" />
          </div>
          <div>
            <label className={AUTH_FUNNEL_LABEL_CLASS}>Confirm password</label>
            <input
              type="password"
              className={AUTH_FUNNEL_INPUT_CLASS}
              placeholder="Re-enter password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData((c) => ({ ...c, confirmPassword: e.target.value }))}
              required
              minLength={8}
              autoComplete="new-password"
            />
            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">Passwords do not match.</p>
            )}
          </div>

          <label className="flex items-start gap-2 mt-2">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-xs leading-relaxed text-gray-600 dark:text-neutral-400">
              By signing up, I agree to UAE Trail{' '}
              <Link to="/terms" className="text-emerald-700 hover:underline dark:text-emerald-400">
                Terms and Conditions
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-emerald-700 hover:underline dark:text-emerald-400">
                Privacy Policy
              </Link>
              .
            </span>
          </label>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <button type="submit" disabled={loading} className="ios-btn w-full bg-emerald-600 text-white">
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-600 md:text-left dark:text-neutral-400">
          Already have an account?{' '}
          <Link
            to={signInHref}
            className="font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
          >
            Log in
          </Link>
        </p>
    </AuthFunnelShell>
  );
};
