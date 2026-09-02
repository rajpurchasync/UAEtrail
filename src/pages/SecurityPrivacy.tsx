import { FormEvent, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { KeyRound, ShieldCheck, Smartphone, Eye, Lock, Download, Trash2 } from 'lucide-react';
import { api } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { AccountDataExportSection, AccountDeleteSection } from '../components/account';
import { PageMeta } from '../components/seo/PageMeta';
import { MobileBackButton } from '../components/mobile/MobileBackButton';

export const SecurityPrivacy = () => {
  const location = useLocation();
  const { signOut } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const requiresOtp = import.meta.env.PROD;

  const isOrganizerPath = location.pathname.startsWith('/host/');
  const backPath = isOrganizerPath ? '/host/overview' : '/profile';
  const backLabel = isOrganizerPath ? 'Organizer' : 'Profile';

  const handleChangePassword = async (event: FormEvent) => {
    event.preventDefault();
    setPasswordMessage(null);
    if (requiresOtp && !otpToken.trim()) {
      setPasswordMessage('Enter the OTP sent to your email before updating password.');
      return;
    }
    setSavingPassword(true);
    try {
      await api.changePassword({
        currentPassword,
        newPassword,
        ...(otpToken.trim() ? { otpToken: otpToken.trim() } : {})
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
      const res = await api.requestChangePasswordOtp();
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

  const handleDeleted = async () => {
    await signOut();
  };

  return (
    <>
      <PageMeta title="Security & Privacy" noIndex />
      <div className="min-h-screen consumer-bg safe-area-top safe-area-bottom pb-8">
        <div className="max-w-2xl mx-auto px-5 pt-4">
          <MobileBackButton fallbackTo={backPath} label={backLabel} className="mb-4" />

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Security & Privacy</h1>
          <p className="text-sm text-gray-600 mb-5">
            Keep your account secure and control your personal data.
          </p>

          <div className="glass-card p-4 mb-3 border border-emerald-100/80">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Stay signed in</h2>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                  Your web session now stays active on this browser until you sign out.
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card p-4 mb-3">
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
          </div>

          <div className="glass-card p-4 mb-3">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Common protections</h2>
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
          </div>

          <AccountDataExportSection />
          <AccountDeleteSection onDeleted={handleDeleted} />
        </div>
      </div>
    </>
  );
};
