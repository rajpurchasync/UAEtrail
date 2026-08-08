import { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api, UserProfile } from '../../api/services';
import { X } from 'lucide-react';
import { MobileBackButton } from '../mobile/MobileBackButton';
import { NotificationBellPopover } from './NotificationBellPopover';
import { MobileMenuButton } from './MobileMenu';

interface DashboardLayoutProps {
  title: string;
  links: Array<{ to: string; label: string }>;
  children: ReactNode;
}

export const DashboardLayout = ({ title, links, children }: DashboardLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Profile
  const [showProfile, setShowProfile] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({});
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordOtpNotice, setPasswordOtpNotice] = useState<string | null>(null);
  const [passwordFields, setPasswordFields] = useState({ currentPassword: '', newPassword: '', confirmPassword: '', otpToken: '' });
  const [sendingPasswordOtp, setSendingPasswordOtp] = useState(false);
  const requiresPasswordOtp = import.meta.env.PROD;

  const loadProfile = async () => {
    try {
      const res = await api.getMeProfile();
      setProfile(res.data);
    } catch { /* silent */ }
  };

  const markAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
    } catch { /* silent */ }
  };

  const openProfile = () => {
    loadProfile();
    setProfileError(null);
    setProfileSuccess(false);
    setPasswordOtpNotice(null);
    setPasswordFields({ currentPassword: '', newPassword: '', confirmPassword: '', otpToken: '' });
    setShowProfile(true);
  };

  const handlePasswordOtpSend = async () => {
    setProfileError(null);
    setPasswordOtpNotice(null);
    setSendingPasswordOtp(true);
    try {
      const res = await api.requestChangePasswordOtp();
      if (res.otpToken) {
        setPasswordFields((prev) => ({ ...prev, otpToken: res.otpToken }));
      }
      setPasswordOtpNotice('OTP sent to your email address.');
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setSendingPasswordOtp(false);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileError(null);
    setProfileSuccess(false);
    setPasswordOtpNotice(null);
    try {
      await api.updateMeProfile({
        displayName: profile.displayName,
        phone: profile.phone
      });

      const { currentPassword, newPassword, confirmPassword, otpToken } = passwordFields;
      if (currentPassword || newPassword || confirmPassword) {
        if (newPassword !== confirmPassword) {
          throw new Error('New passwords do not match.');
        }
        if (!currentPassword || !newPassword) {
          throw new Error('Enter current and new password to change it.');
        }
        if (requiresPasswordOtp && !otpToken.trim()) {
          throw new Error('Enter the OTP sent to your email before changing password.');
        }
        await api.changePassword({
          currentPassword,
          newPassword,
          ...(otpToken.trim() ? { otpToken: otpToken.trim() } : {})
        });
        setPasswordFields({ currentPassword: '', newPassword: '', confirmPassword: '', otpToken: '' });
      }

      setProfileSuccess(true);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const breadcrumbFallbackTo =
    location.pathname.startsWith('/admin')
      ? '/admin/overview'
      : location.pathname.startsWith('/merchant')
        ? '/merchant/dashboard'
        : location.pathname.startsWith('/organizer')
          ? '/organizer/overview'
          : '/';

  const breadcrumbLabel =
    location.pathname.startsWith('/admin')
      ? 'Admin'
      : location.pathname.startsWith('/merchant')
        ? 'Merchant'
        : location.pathname.startsWith('/organizer')
          ? 'Organizer'
          : 'Home';

  const activeSection =
    links.find((link) => location.pathname === link.to || location.pathname.startsWith(`${link.to}/`))?.label ??
    title;

  return (
    <div className="min-h-screen bg-gray-50/80">
      {/* ─── Mobile-friendly header ─── */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="min-w-0">
              <h1 className="text-lg md:text-xl font-bold text-gray-900 truncate">{title}</h1>
              <p className="text-xs text-gray-500 truncate hidden md:block">{user?.email}</p>
              <MobileBackButton
                fallbackTo={breadcrumbFallbackTo}
                label={breadcrumbLabel}
                className="mt-0.5"
              />
            </div>
          </div>
          <div className="flex items-center gap-1.5 md:gap-2">
            <NotificationBellPopover />
            <MobileMenuButton showOnDesktop />
          </div>
        </div>

        {/* ─── Horizontal scroll nav (mobile) / hidden on desktop ─── */}
        <div className="md:hidden border-t border-gray-100 overflow-x-auto scrollbar-none">
          <div className="flex px-2 py-1.5 gap-0.5 min-w-max">
            {links.map((link) => {
              const active = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    active
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 md:pt-5">
        <div className="relative overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 px-4 py-4 sm:px-6 sm:py-5 text-white">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/15 blur-2xl" aria-hidden />
          <div className="absolute -left-12 -bottom-12 h-36 w-36 rounded-full bg-black/10 blur-2xl" aria-hidden />
          <div className="relative">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80">Control center</p>
            <h2 className="text-xl sm:text-2xl font-bold mt-1">{title}</h2>
            <p className="text-sm text-white/90 mt-1">Current section: {activeSection}</p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 md:py-6 grid grid-cols-1 md:grid-cols-[200px_1fr] lg:grid-cols-[220px_1fr] gap-6">
        {/* Desktop sidebar */}
        <aside className="hidden md:block">
          <div className="bg-white rounded-2xl border border-gray-100 p-2 sticky top-20">
            <nav className="space-y-0.5">
              {links.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`block px-3 py-2 rounded-xl text-sm transition-all ${
                    location.pathname === link.to
                      ? 'bg-emerald-50 text-emerald-800 font-semibold'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </aside>
        <main>{children}</main>
      </div>

      {/* Profile Modal */}
      {showProfile && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end md:items-center justify-center z-50" onClick={() => setShowProfile(false)}>
          <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full md:max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b px-5 py-4 flex items-center justify-between z-10 rounded-t-2xl">
              <h2 className="text-base font-bold text-gray-900">Profile Settings</h2>
              <button onClick={() => setShowProfile(false)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleProfileSave} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block uppercase tracking-wider">Display Name</label>
                <input type="text" value={profile.displayName ?? ''} onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all" placeholder="Your name" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block uppercase tracking-wider">Email</label>
                <input type="email" value={profile.email ?? ''} disabled
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed" />
                <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block uppercase tracking-wider">Phone</label>
                <input type="tel" value={profile.phone ?? ''} onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all" placeholder="+971..." />
              </div>

              {/* Change Password Section */}
              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wider">Change Password</p>
                <div className="space-y-3">
                  {requiresPasswordOtp && (
                    <>
                      <button type="button" onClick={() => void handlePasswordOtpSend()} disabled={sendingPasswordOtp}
                        className="w-full border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-xl px-3.5 py-2.5 text-sm font-medium hover:bg-emerald-100 disabled:opacity-60 transition-all">
                        {sendingPasswordOtp ? 'Sending OTP...' : 'Send OTP to Email'}
                      </button>
                      <input type="text" placeholder="OTP token" value={passwordFields.otpToken}
                        onChange={(e) => setPasswordFields({ ...passwordFields, otpToken: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all" />
                    </>
                  )}
                  <input type="password" placeholder="Current password" value={passwordFields.currentPassword}
                    onChange={(e) => setPasswordFields({ ...passwordFields, currentPassword: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all" />
                  <input type="password" placeholder="New password" value={passwordFields.newPassword}
                    onChange={(e) => setPasswordFields({ ...passwordFields, newPassword: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all" />
                  <input type="password" placeholder="Confirm new password" value={passwordFields.confirmPassword}
                    onChange={(e) => setPasswordFields({ ...passwordFields, confirmPassword: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all" />
                </div>
              </div>

              {profileError && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{profileError}</p>}
              {passwordOtpNotice && <p className="text-sm text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg">{passwordOtpNotice}</p>}
              {profileSuccess && <p className="text-sm text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg">Profile updated successfully!</p>}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowProfile(false)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" disabled={profileSaving}
                  className="flex-1 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-60 transition-colors">
                  {profileSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
