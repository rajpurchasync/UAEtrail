import { FormEvent, useState, type ReactNode } from 'react';
import {
  changeAccountPassword,
  confirmAccountEmailChange,
  requestAccountEmailChange,
} from '../../hooks/accountSettingsApi';
import { OtpInput } from '../auth/OtpInput';
import { AppButton } from '../mobile/AppButton';
import { GlassCard } from '../mobile/GlassCard';
import { AccountDeleteSection } from '../account/AccountDeleteSection';
import { getPasswordValidationError } from '../../utils/passwordPolicy';

interface ProfileAccountSettingsSectionsProps {
  email: string;
  onEmailChanged: () => void | Promise<void>;
  onDeleted: () => void | Promise<void>;
  /** Flat blocks when nested in {@link ConsumerDetailSection}. */
  embedded?: boolean;
}

const AccountBlock = ({
  embedded,
  children,
  className = '',
}: {
  embedded: boolean;
  children: ReactNode;
  className?: string;
}) =>
  embedded ? (
    <div className={`space-y-3 rounded-xl border border-neutral-200/80 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-900/40 ${className}`}>
      {children}
    </div>
  ) : (
    <GlassCard padding className={className}>
      {children}
    </GlassCard>
  );

export const ProfileAccountSettingsSections = ({
  email,
  onEmailChanged,
  onDeleted,
  embedded = false,
}: ProfileAccountSettingsSectionsProps) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  const [newEmail, setNewEmail] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [emailStep, setEmailStep] = useState<'idle' | 'code-sent'>('idle');
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailMessage, setEmailMessage] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  const handleChangePassword = async (event: FormEvent) => {
    event.preventDefault();
    setPasswordMessage(null);

    const passwordError = getPasswordValidationError(newPassword);
    if (passwordError) {
      setPasswordMessage(passwordError);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage('New passwords do not match.');
      return;
    }

    setSavingPassword(true);
    try {
      await changeAccountPassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMessage('Password updated successfully.');
    } catch (err) {
      setPasswordMessage(err instanceof Error ? err.message : 'Could not update password.');
    } finally {
      setSavingPassword(false);
    }
  };

  const requestEmailChange = async () => {
    const trimmed = newEmail.trim().toLowerCase();
    if (!trimmed) {
      setEmailError('Enter a new email address.');
      return;
    }
    if (trimmed === email.toLowerCase()) {
      setEmailError('That is already your email address.');
      return;
    }
    setEmailBusy(true);
    setEmailError(null);
    setEmailMessage(null);
    try {
      const res = await requestAccountEmailChange(trimmed);
      setEmailStep('code-sent');
      setEmailMessage(`Verification code sent to ${res.email}.`);
      setEmailOtp('');
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : 'Could not send verification code.');
    } finally {
      setEmailBusy(false);
    }
  };

  const confirmEmailChange = async () => {
    const trimmed = newEmail.trim().toLowerCase();
    if (!/^\d{6}$/.test(emailOtp)) {
      setEmailError('Enter the 6-digit verification code.');
      return;
    }
    setEmailBusy(true);
    setEmailError(null);
    setEmailMessage(null);
    try {
      await confirmAccountEmailChange(trimmed, emailOtp);
      setEmailStep('idle');
      setNewEmail('');
      setEmailOtp('');
      setEmailMessage('Email updated successfully.');
      await onEmailChanged();
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : 'Could not verify email.');
    } finally {
      setEmailBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <AccountBlock embedded={embedded}>
        <h2 className="text-sm font-semibold text-neutral-900">✉️ Change email</h2>
        <p className="mt-1 text-xs text-neutral-600">Current: {email}</p>
        <div className="mt-3 space-y-3">
          <input
            type="email"
            className="ios-input text-[15px]"
            value={newEmail}
            onChange={(event) => {
              setNewEmail(event.target.value);
              setEmailStep('idle');
              setEmailError(null);
            }}
            placeholder="New email address"
            disabled={emailBusy || emailStep === 'code-sent'}
          />
          {emailStep === 'code-sent' && (
            <div className="space-y-2">
              <p className="text-xs text-neutral-600 text-center">
                Enter the 6-digit code sent to your new email
              </p>
              <OtpInput value={emailOtp} onChange={setEmailOtp} disabled={emailBusy} autoFocus />
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {emailStep === 'idle' ? (
              <button
                type="button"
                onClick={() => void requestEmailChange()}
                disabled={emailBusy || !newEmail.trim()}
                className="ios-btn min-h-[40px] px-3 text-sm bg-emerald-600 text-white"
              >
                {emailBusy ? 'Sending…' : 'Send verification code'}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => void confirmEmailChange()}
                  disabled={emailBusy || emailOtp.length !== 6}
                  className="ios-btn min-h-[40px] px-3 text-sm bg-emerald-600 text-white"
                >
                  {emailBusy ? 'Verifying…' : 'Confirm new email'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmailStep('idle');
                    setEmailOtp('');
                    setEmailError(null);
                  }}
                  disabled={emailBusy}
                  className="ios-btn min-h-[40px] px-3 text-sm"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
          {emailMessage && <p className="text-xs text-emerald-700">{emailMessage}</p>}
          {emailError && <p className="text-xs text-red-600">{emailError}</p>}
        </div>
      </AccountBlock>

      <AccountBlock embedded={embedded}>
        <h2 className="text-sm font-semibold text-neutral-900">🔒 Change password</h2>
        <p className="mt-1 text-xs text-neutral-600">
          Enter your current password, then choose a new one.
        </p>
        <form className="mt-3 space-y-2" onSubmit={handleChangePassword}>
          <input
            type="password"
            className="ios-input text-[15px]"
            placeholder="Current password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
          <input
            type="password"
            className="ios-input text-[15px]"
            placeholder="New password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
          <input
            type="password"
            className="ios-input text-[15px]"
            placeholder="Retype new password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
          <AppButton type="submit" disabled={savingPassword} fullWidth>
            {savingPassword ? 'Updating…' : 'Update password'}
          </AppButton>
        </form>
        {passwordMessage && (
          <p
            className={`mt-2 text-xs ${
              passwordMessage.toLowerCase().includes('success') ? 'text-emerald-700' : 'text-red-600'
            }`}
          >
            {passwordMessage}
          </p>
        )}
      </AccountBlock>

      <AccountDeleteSection onDeleted={() => void onDeleted()} />
    </div>
  );
};
