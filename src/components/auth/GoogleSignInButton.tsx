import { useEffect, useRef, useState } from 'react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';

interface GoogleSignInButtonProps {
  onSuccess: (idToken: string) => Promise<void>;
  onError?: (message: string) => void;
  text?: 'signin_with' | 'signup_with' | 'continue_with';
  disabled?: boolean;
}

const LABELS: Record<NonNullable<GoogleSignInButtonProps['text']>, string> = {
  signin_with: 'Sign in with Google',
  signup_with: 'Sign up with Google',
  continue_with: 'Continue with Google'
};

export const getGoogleClientId = (): string =>
  (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim() ?? '';

export const isGoogleAuthEnabled = (): boolean => Boolean(getGoogleClientId());

const GoogleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path
      fill="#EA4335"
      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
    />
    <path
      fill="#4285F4"
      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.56 2.94-2.23 5.43-4.75 7.09l7.73 6.01C42.44 37.24 46.98 31.36 46.98 24.55z"
    />
    <path
      fill="#FBBC05"
      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
    />
    <path
      fill="#34A853"
      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6.01c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
    />
  </svg>
);

/** Google-styled button — used when OAuth client ID is not configured yet */
const GoogleBrandButton = ({
  label,
  disabled,
  onClick
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="w-full min-h-[44px] inline-flex items-center justify-center gap-3 rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-[15px] font-medium text-neutral-700 shadow-sm hover:bg-neutral-50 active:bg-neutral-100 disabled:opacity-60 disabled:pointer-events-none transition-colors"
  >
    <GoogleLogo />
    <span>{label}</span>
  </button>
);

export const GoogleSignInButton = ({
  onSuccess,
  onError,
  text = 'continue_with',
  disabled = false
}: GoogleSignInButtonProps) => {
  const clientId = getGoogleClientId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [buttonWidth, setButtonWidth] = useState(280);
  const label = LABELS[text];

  useEffect(() => {
    if (!clientId) return;
    const el = containerRef.current;
    if (!el) return;

    const updateWidth = () => {
      const next = Math.min(400, Math.max(200, Math.floor(el.clientWidth)));
      setButtonWidth(next);
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(el);
    return () => observer.disconnect();
  }, [clientId]);

  const handleSuccess = async (response: CredentialResponse) => {
    if (!response.credential) {
      onError?.('Google did not return a credential.');
      return;
    }
    try {
      await onSuccess(response.credential);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Google sign-in failed');
    }
  };

  const handleUnconfiguredClick = () => {
    onError?.(
      import.meta.env.DEV
        ? 'Google sign-in needs VITE_GOOGLE_CLIENT_ID in .env (and GOOGLE_CLIENT_ID in apps/api/.env). Restart dev servers after adding your Web client ID.'
        : 'Google sign-in is not available right now. Please use email instead.'
    );
  };

  if (!clientId) {
    return (
      <GoogleBrandButton label={label} disabled={disabled} onClick={handleUnconfiguredClick} />
    );
  }

  return (
    <div
      ref={containerRef}
      className={`w-full overflow-hidden ${disabled ? 'pointer-events-none opacity-60' : ''}`}
    >
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => onError?.('Google sign-in was cancelled or failed.')}
        theme="outline"
        size="large"
        width={buttonWidth}
        text={text}
        shape="rectangular"
      />
    </div>
  );
};
