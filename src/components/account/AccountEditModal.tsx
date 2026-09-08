import { useEffect, useState } from 'react';
import { Bell, LogOut } from 'lucide-react';
import { api, UserProfile } from '../../api/services';
import { DEFAULT_PHONE_DIAL } from '../../constants/phoneCountries';
import { AppButton } from '../mobile/AppButton';
import { Dialog } from '../ui/Dialog';
import { PhoneInput } from '../ui/PhoneInput';
import { OtpInput } from '../auth/OtpInput';
import { registerPushNotifications } from '../../utils/push';
import { formatE164Phone, isValidNationalPhone, splitStoredPhone } from '../../utils/phone';
interface AccountEditModalProps {
  open: boolean;
  onClose: () => void;
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  email: string;
  saving: boolean;
  message: string | null;
  pushStatus: string | null;
  setPushStatus: (value: string | null) => void;
  onSave: (payload: {
    displayName: string;
    bio?: string;
    phone?: string;
  }) => void | Promise<void>;
  onEmailChanged?: () => void | Promise<void>;
}

export const AccountEditModal = ({
  open,
  onClose,
  profile,
  setProfile,
  email,
  saving,
  message,
  pushStatus,
  setPushStatus,
  onSave,
  onEmailChanged,
}: AccountEditModalProps) => {
  const currentEmail = profile.email ?? email;
  const [phoneDial, setPhoneDial] = useState(DEFAULT_PHONE_DIAL);
  const [phoneNational, setPhoneNational] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [emailStep, setEmailStep] = useState<'idle' | 'code-sent'>('idle');
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailMessage, setEmailMessage] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const parts = splitStoredPhone(profile.phone);
    setPhoneDial(parts.dial);
    setPhoneNational(parts.national);
    setNewEmail('');
    setEmailOtp('');
    setEmailStep('idle');
    setEmailMessage(null);
    setEmailError(null);
  }, [open, profile.phone]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const displayName = profile.displayName?.trim() ?? '';
    if (displayName.length < 2) {
      setEmailError('Name must be at least 2 characters.');
      return;
    }
    setEmailError(null);

    let phone: string | undefined;
    if (phoneNational.trim()) {
      if (!isValidNationalPhone(phoneNational)) {
        setEmailError('Enter a valid phone number.');
        return;
      }
      phone = formatE164Phone(phoneDial, phoneNational);
    }

    const payload = {
      displayName,
      bio: profile.bio?.trim() || undefined,
      phone,
    };
    setProfile((prev) => ({ ...prev, ...payload }));
    await onSave(payload);
  };

  const requestEmailChange = async () => {
    const trimmed = newEmail.trim().toLowerCase();
    if (!trimmed) {
      setEmailError('Enter a new email address.');
      return;
    }
    if (trimmed === currentEmail.toLowerCase()) {
      setEmailError('That is already your email address.');
      return;
    }
    setEmailBusy(true);
    setEmailError(null);
    setEmailMessage(null);
    try {
      const res = await api.requestEmailChange(trimmed);
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
      const res = await api.confirmEmailChange(trimmed, emailOtp);
      setProfile((prev) => ({ ...prev, email: res.data.email }));
      setEmailStep('idle');
      setNewEmail('');
      setEmailOtp('');
      setEmailMessage('Email updated successfully.');
      await onEmailChanged?.();
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : 'Could not verify email.');
    } finally {
      setEmailBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title="Edit profile">
      <form className="space-y-4" onSubmit={handleProfileSubmit}>
        <div>
          <label className="text-xs font-bold uppercase tracking-wide text-neutral-400 mb-2 block">
            Name
          </label>
          <input
            className="ios-input text-[15px]"
            value={profile.displayName ?? ''}
            onChange={(e) => setProfile((p) => ({ ...p, displayName: e.target.value }))}
            placeholder="Your name"
            disabled={saving || emailBusy}
          />
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wide text-neutral-400 mb-2 block">
            About
          </label>
          <textarea
            className="ios-input text-[15px] min-h-[80px] resize-none"
            value={profile.bio ?? ''}
            onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
            rows={3}
            placeholder="Tell others a little about yourself"
            disabled={saving || emailBusy}
          />
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wide text-neutral-400 mb-2 block">
            Phone
          </label>
          <PhoneInput
            dialCode={phoneDial}
            nationalNumber={phoneNational}
            onDialCodeChange={setPhoneDial}
            onNationalNumberChange={setPhoneNational}
            disabled={saving || emailBusy}
          />
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 space-y-3">
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-neutral-400 mb-2 block">
              Email
            </label>
            <p className="text-sm text-gray-700 mb-2">Current: {currentEmail}</p>
            <input
              type="email"
              className="ios-input text-[15px]"
              value={newEmail}
              onChange={(e) => {
                setNewEmail(e.target.value);
                setEmailStep('idle');
                setEmailError(null);
              }}
              placeholder="New email address"
              disabled={saving || emailBusy || emailStep === 'code-sent'}
            />
          </div>

          {emailStep === 'code-sent' && (
            <div className="space-y-2">
              <p className="text-xs text-gray-600 text-center">Enter the 6-digit code sent to your new email</p>
              <OtpInput value={emailOtp} onChange={setEmailOtp} disabled={emailBusy} autoFocus />
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {emailStep === 'idle' ? (
              <button
                type="button"
                onClick={() => void requestEmailChange()}
                disabled={saving || emailBusy || !newEmail.trim()}
                className="ios-btn min-h-[40px] px-3 text-sm"
              >
                {emailBusy ? 'Sending…' : 'Send verification code'}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => void confirmEmailChange()}
                  disabled={saving || emailBusy || emailOtp.length !== 6}
                  className="ios-btn min-h-[40px] px-3 text-sm text-white bg-emerald-600 hover:bg-emerald-700"
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
                  Change email
                </button>
              </>
            )}
          </div>

          {emailMessage && <p className="text-xs text-emerald-700">{emailMessage}</p>}
          {emailError && <p className="text-xs text-red-600">{emailError}</p>}
        </div>

        <button
          type="button"
          onClick={async () => {
            const ok = await registerPushNotifications();
            setPushStatus(ok ? 'Notifications enabled.' : 'Could not enable notifications.');
          }}
          className="ios-btn w-full glass text-neutral-800 min-h-[48px] text-[15px]"
        >
          <Bell className="w-4 h-4" />
          Enable push notifications
        </button>
        {pushStatus && <p className="text-xs text-neutral-500 text-center">{pushStatus}</p>}

        <AppButton type="submit" disabled={saving || emailBusy} fullWidth>
          {saving ? 'Saving…' : 'Save profile'}
        </AppButton>
        {message && <p className="text-sm text-emerald-700 text-center font-medium">{message}</p>}
      </form>
    </Dialog>
  );
};

interface AccountSignOutButtonProps {
  onSignOut: () => void;
}

export const AccountSignOutButton = ({ onSignOut }: AccountSignOutButtonProps) => (
  <div className="mt-5 mb-4">
    <button
      type="button"
      onClick={onSignOut}
      className="ios-btn w-full glass text-red-500 min-h-[50px] font-semibold active:bg-red-50/80"
    >
      <LogOut className="w-4 h-4" />
      Sign out
    </button>
  </div>
);
