import { FormEvent, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { KeyRound, ShieldCheck, Smartphone, Eye, Lock, Download, Trash2, UserRound } from 'lucide-react';
import type { UserProfile } from '../api/types';
import {
  changeAccountPassword,
  requestChangePasswordOtp,
} from '../hooks/accountSettingsApi';
import { fetchMeProfile, updateMeProfile } from '../hooks/memberProfileApi';
import { useAuth } from '../context/AuthContext';
import { AccountDataExportSection, AccountDeleteSection } from '../components/account';
import { PageMeta } from '../components/seo/PageMeta';
import { isPublishingConsolePath, PUBLISHING_OVERVIEW_PATH, PROFILE_PATH } from '../config/routingCatalog';
import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { GlassCard } from '../components/mobile/GlassCard';

type ProfileVisibility = NonNullable<UserProfile['profileVisibility']>;

const VISIBILITY_OPTIONS: Array<{
  value: ProfileVisibility;
  label: string;
  description: string;
}> = [
  {
    value: 'public',
    label: 'Public',
    description: 'Other signed-in members can view your public member card. Guests must sign in first.',
  },
  {
    value: 'group_members',
    label: 'Friends & family only',
    description: 'Only people in your family or friends groups see your full profile.',
  },
  {
    value: 'private',
    label: 'Private',
    description:
      'Hidden from map browse unless you host activities. Friends, co-participants, and hosts on your activities can still view.',
  },
];

export const SecurityPrivacy = () => {
  const location = useLocation();
  const { signOut } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [profileVisibility, setProfileVisibility] = useState<ProfileVisibility>('public');
  const [savingVisibility, setSavingVisibility] = useState(false);
  const [visibilityMessage, setVisibilityMessage] = useState<string | null>(null);
  const requiresOtp = import.meta.env.PROD;

  const isConsolePath = isPublishingConsolePath(location.pathname);
  const backPath = isConsolePath ? PUBLISHING_OVERVIEW_PATH : PROFILE_PATH;
  const backLabel = isConsolePath ? 'Workspace' : 'Profile';

  useEffect(() => {
    void fetchMeProfile()
      .then((profile) => {
        setProfileVisibility(profile.profileVisibility ?? 'public');
      })
      .catch(() => {
        /* profile load is optional for this page */
      });
  }, []);

  const handleChangePassword = async (event: FormEvent) => {
    event.preventDefault();
    setPasswordMessage(null);
    if (requiresOtp && !otpToken.trim()) {
      setPasswordMessage('Enter the OTP sent to your email before updating password.');
      return;
    }
    setSavingPassword(true);
    try {
      await changeAccountPassword({
        currentPassword,
        newPassword,
        ...(otpToken.trim() ? { otpToken: otpToken.trim() } : {}),
      });
      setCurrentPassword('');
      setNewPassword('');
      setOtpToken('');
      setPasswordMessage('Password updated successfully.');
    } catch (error) {
      setPasswordMessage(error instanceof Error ? error.message : 'Could not update password');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSendOtp = async () => {
    setPasswordMessage(null);
    setSendingOtp(true);
    try {
      const res = await requestChangePasswordOtp();
      if (res.otpToken) {
        setOtpToken(res.otpToken);
      }
      setPasswordMessage('OTP sent to your email address.');
    } catch (error) {
      setPasswordMessage(error instanceof Error ? error.message : 'Could not send OTP');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVisibilityChange = async (next: ProfileVisibility) => {
    if (next === profileVisibility || savingVisibility) return;
    setVisibilityMessage(null);
    setSavingVisibility(true);
    setProfileVisibility(next);
    try {
      await updateMeProfile({ profileVisibility: next });
      setVisibilityMessage('Profile visibility updated.');
    } catch (error) {
      setProfileVisibility(profileVisibility);
      setVisibilityMessage(error instanceof Error ? error.message : 'Could not update visibility');
    } finally {
      setSavingVisibility(false);
    }
  };

  const handleDeleted = async () => {
    await signOut();
  };

  return (
    <>
      <PageMeta title="Security & Privacy" noIndex />
      <ConsumerShell
        layout="stack"
        title="Security & privacy"
        showJourney={false}
        back={{ fallbackTo: backPath, label: backLabel }}
      >
        <p className="mb-4 text-sm text-neutral-600">Keep your account secure and control your personal data.</p>

        <div className="space-y-3 pb-nav-safe">
          <GlassCard padding className="border-emerald-100/80">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Stay signed in</h2>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                  Your web session now stays active on this browser until you sign out.
                </p>
              </div>
            </div>
          </GlassCard>

          <GlassCard padding>
            <div className="flex items-start gap-3">
              <UserRound className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h2 className="text-sm font-semibold text-gray-900">Profile visibility</h2>
                <p className="text-xs text-gray-600 mt-1 mb-3 leading-relaxed">
                  Controls who can open your member profile after sign-in. Hosts still appear on their activity cards.
                  Friends and activity co-participants can view private profiles when allowed.
                </p>
                <div className="space-y-2">
                  {VISIBILITY_OPTIONS.map((option) => {
                    const selected = profileVisibility === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        disabled={savingVisibility}
                        onClick={() => void handleVisibilityChange(option.value)}
                        className={`w-full rounded-xl border px-3 py-2.5 text-left transition-colors ${
                          selected
                            ? 'border-emerald-300 bg-emerald-50'
                            : 'border-neutral-200 bg-white hover:border-neutral-300'
                        }`}
                      >
                        <p className="text-sm font-semibold text-neutral-900">{option.label}</p>
                        <p className="mt-0.5 text-xs text-neutral-600 leading-relaxed">{option.description}</p>
                      </button>
                    );
                  })}
                </div>
                {visibilityMessage && (
                  <p
                    className={`text-xs mt-2 ${
                      visibilityMessage.toLowerCase().includes('updated') ? 'text-emerald-700' : 'text-red-600'
                    }`}
                  >
                    {visibilityMessage}
                  </p>
                )}
              </div>
            </div>
          </GlassCard>

          <GlassCard padding>
            <div className="flex items-start gap-3">
              <KeyRound className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h2 className="text-sm font-semibold text-gray-900">Change password</h2>
                <p className="text-xs text-gray-600 mt-1 mb-3">Use a strong password with uppercase, lowercase, and numbers.</p>
                <form className="space-y-2" onSubmit={handleChangePassword}>
                  {requiresOtp && (
                    <>
                      <button
                        type="button"
                        className="ios-btn w-full border border-emerald-200 text-emerald-700 bg-emerald-50 min-h-[44px]"
                        onClick={() => void handleSendOtp()}
                        disabled={sendingOtp}
                      >
                        {sendingOtp ? 'Sending OTP…' : 'Send OTP to email'}
                      </button>
                      <input
                        type="text"
                        className="ios-input text-[15px]"
                        placeholder="Enter OTP token"
                        value={otpToken}
                        onChange={(event) => setOtpToken(event.target.value)}
                        autoCapitalize="off"
                        autoCorrect="off"
                        required
                      />
                    </>
                  )}
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
                  <button
                    type="submit"
                    className="ios-btn w-full bg-emerald-600 text-white min-h-[44px]"
                    disabled={savingPassword}
                  >
                    {savingPassword ? 'Updating…' : 'Update password'}
                  </button>
                </form>
                {passwordMessage && (
                  <p
                    className={`text-xs mt-2 ${
                      passwordMessage.toLowerCase().includes('success') || passwordMessage.toLowerCase().includes('otp sent')
                        ? 'text-emerald-700'
                        : 'text-red-600'
                    }`}
                  >
                    {passwordMessage}
                  </p>
                )}
              </div>
            </div>
          </GlassCard>

          <GlassCard padding>
            <h2 className="mb-2 text-sm font-semibold text-neutral-900">Common protections</h2>
            <ul className="space-y-2 text-xs text-gray-700">
              <li className="flex items-start gap-2">
                <Smartphone className="w-4 h-4 text-emerald-600 mt-0.5" />
                <span>Only sign in on trusted devices and sign out on shared/public computers.</span>
              </li>
              <li className="flex items-start gap-2">
                <Eye className="w-4 h-4 text-emerald-600 mt-0.5" />
                <span>Review profile details regularly and keep your phone/email current for recovery.</span>
              </li>
              <li className="flex items-start gap-2">
                <Lock className="w-4 h-4 text-emerald-600 mt-0.5" />
                <span>Never share one-time codes or passwords with anyone, including support staff.</span>
              </li>
              <li className="flex items-start gap-2">
                <Download className="w-4 h-4 text-emerald-600 mt-0.5" />
                <span>Export your data whenever you need a copy of your account information.</span>
              </li>
              <li className="flex items-start gap-2">
                <Trash2 className="w-4 h-4 text-emerald-600 mt-0.5" />
                <span>Delete your account if you no longer want to use the app.</span>
              </li>
            </ul>
          </GlassCard>

          <AccountDataExportSection />
          <AccountDeleteSection onDeleted={handleDeleted} />
        </div>
      </ConsumerShell>
    </>
  );
};
