import { GoogleSignInButton } from './GoogleSignInButton';
import { isGoogleSignInOffered } from '../../config/authProviders';

interface GoogleAuthSectionProps {
  onSuccess: (idToken: string) => Promise<void>;
  onError?: (message: string) => void;
  text?: 'signin_with' | 'signup_with' | 'continue_with';
  disabled?: boolean;
}

/** Google button + email divider (hidden on native iOS — email-only per App Store 4.8). */
export const GoogleAuthSection = ({
  onSuccess,
  onError,
  text = 'continue_with',
  disabled = false
}: GoogleAuthSectionProps) => {
  if (!isGoogleSignInOffered()) {
    return null;
  }

  return (
    <div className="mb-6 space-y-4">
      <GoogleSignInButton onSuccess={onSuccess} onError={onError} text={text} disabled={disabled} />
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-neutral-200" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-3 text-neutral-400">or continue with email</span>
        </div>
      </div>
    </div>
  );
};
