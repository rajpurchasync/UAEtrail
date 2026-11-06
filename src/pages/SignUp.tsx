import { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Gift } from 'lucide-react';
import { AuthFunnelShell } from '../components/auth/AuthFunnelShell';
import { GoogleAuthSection } from '../components/auth/GoogleAuthSection';
import { PasswordRequirements } from '../components/auth/PasswordRequirements';
import { useAuth } from '../context/AuthContext';
import { defaultRouteByRole } from '../utils/authRouting';
import { navigateAuthBack, navigateAuthClose, resolveAuthRedirect } from '../utils/authRedirect';
import {
  navigateToPostAuthReturn,
  resolvePostAuthReturnPath,
} from '../utils/authPostLoginNavigation';
import { getPasswordValidationError } from '../utils/passwordPolicy';
import { PageMeta } from '../components/seo/PageMeta';
import { fetchMeProfile } from '../hooks/memberProfileApi';
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
  const redirectTo = resolveAuthRedirect(
    (location.state as { from?: string } | null)?.from,
    searchParams.get('redirect')
  );
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
      const welcomeRedirectTo = resolvePostAuthReturnPath(redirectTo, user.role) ?? postAuthDefault;
      if (profile && shouldForceSignupWelcome(user.role, profile)) {
        navigate('/welcome', { replace: true, state: { redirectTo: welcomeRedirectTo } });
        return;
      }
      if (navigateToPostAuthReturn(navigate, redirectTo, user.role, searchParams)) {
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

  const fieldClass = 'ios-input text-[17px] border border-neutral-300 bg-white';

  return (
    <AuthFunnelShell
      title="Create Account"
      subline={PRODUCT_AUTH_SIGNUP_SUBLINE}
      onBack={handleBack}
      onClose={handleClose}
    >
      <PageMeta title="Create account" noIndex />

        {referralCode && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2.5 text-sm text-emerald-800">
            <Gift className="w-4 h-4 shrink-0" />
            <span>
              You were invited with code <strong>{referralCode}</strong> — welcome to the crew.
            </span>
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

        <form className="space-y-3" onSubmit={handleSubmit}>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Name</label>
              <input
                className={fieldClass}
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
              <label className="text-sm font-medium text-gray-700 block mb-1">Surname</label>
              <input
                className={fieldClass}
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
            <label className="text-sm font-medium text-gray-700 block mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                className={`${fieldClass} pl-10`}
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData((c) => ({ ...c, email: e.target.value }))}
                required
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Password</label>
            <input
              type="password"
              className={fieldClass}
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
            <label className="text-sm font-medium text-gray-700 block mb-1">Confirm password</label>
            <input
              type="password"
              className={fieldClass}
              placeholder="Re-enter password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData((c) => ({ ...c, confirmPassword: e.target.value }))}
              required
              minLength={8}
              autoComplete="new-password"
            />
            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <p className="text-xs text-red-600 mt-1">Passwords do not match.</p>
            )}
          </div>

          <label className="flex items-start gap-2 mt-2">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-xs text-gray-600 leading-relaxed">
              By signing up, I agree to UAE Trail{' '}
              <Link to="/terms" className="text-emerald-700 hover:underline">
                Terms and Conditions
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-emerald-700 hover:underline">
                Privacy Policy
              </Link>
              .
            </span>
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={loading} className="ios-btn w-full bg-emerald-600 text-white">
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-sm text-gray-500 mt-5 text-center md:text-left">
          Already have an account?{' '}
          <Link to={signInHref} className="text-emerald-700 hover:text-emerald-900 font-medium">
            Log in
          </Link>
        </p>
    </AuthFunnelShell>
  );
};
