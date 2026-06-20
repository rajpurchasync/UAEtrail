import { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api, UserProfile } from '../../api/services';
import { NotificationDTO } from '@uaetrail/shared-types';
import { Bell, LogOut, User, ChevronLeft, X } from 'lucide-react';

interface DashboardLayoutProps {
  title: string;
  links: Array<{ to: string; label: string }>;
  children: ReactNode;
}

export const DashboardLayout = ({ title, links, children }: DashboardLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

  // Notifications
  const [notifications, setNotifications] = useState<NotificationDTO[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);

  // Profile
  const [showProfile, setShowProfile] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({});
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordFields, setPasswordFields] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = async () => {
    setNotifLoading(true);
    try {
      const res = await api.getMeNotifications();
      setNotifications(res.data);
      setUnreadCount(res.unreadCount ?? res.data.filter((n) => !n.isRead).length);
    } catch { /* silent */ }
    finally { setNotifLoading(false); }
  };

  const loadProfile = async () => {
    try {
      const res = await api.getMeProfile();
      setProfile(res.data);
    } catch { /* silent */ }
  };

  const markAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch { /* silent */ }
  };

  const markOneRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch { /* silent */ }
  };

  useEffect(() => { loadNotifications(); }, []);

  const openProfile = () => {
    loadProfile();
    setProfileError(null);
    setProfileSuccess(false);
    setPasswordFields({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setShowProfile(true);
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileError(null);
    setProfileSuccess(false);
    try {
      await api.updateMeProfile({
        displayName: profile.displayName,
        phone: profile.phone
      });
      setProfileSuccess(true);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const unreadCountDisplay = unreadCount;

  return (
    <div className="min-h-screen bg-gray-50/80">
      {/* ─── Mobile-friendly header ─── */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate('/')}
              className="md:hidden p-1.5 -ml-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-lg md:text-xl font-bold text-gray-900 truncate">{title}</h1>
              <p className="text-xs text-gray-500 truncate hidden md:block">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 md:gap-3">
            {/* Notification Bell */}
            <div className="relative">
              <button onClick={() => { setShowNotifs(!showNotifs); if (!showNotifs) loadNotifications(); }}
                className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all"
                title="Notifications">
                <Bell className="w-5 h-5" />
                {unreadCountDisplay > 0 && (
                  <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full ring-2 ring-white">
                    {unreadCountDisplay > 9 ? '9+' : unreadCountDisplay}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifs && (
                <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b flex items-center justify-between bg-gray-50/50">
                    <p className="text-sm font-bold text-gray-900">Notifications</p>
                    <div className="flex items-center gap-2">
                      {unreadCountDisplay > 0 && (
                        <button
                          onClick={markAllRead}
                          className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                        >
                          Mark all read
                        </button>
                      )}
                      <button onClick={() => setShowNotifs(false)} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                    {notifLoading ? (
                      <div className="px-4 py-8 text-center">
                        <div className="w-5 h-5 border-2 border-gray-200 border-t-emerald-500 rounded-full animate-spin mx-auto" />
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No notifications</p>
                      </div>
                    ) : notifications.map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => { if (!n.isRead) markOneRead(n.id); }}
                        className={`w-full text-left px-4 py-3 hover:bg-gray-50/50 transition-colors ${!n.isRead ? 'bg-emerald-50/30' : ''}`}
                      >
                        <p className="text-sm font-medium text-gray-900">{n.title}</p>
                        <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{n.body}</p>
                        <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={openProfile}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all"
              title="Profile"
            >
              <User className="w-5 h-5" />
            </button>

            <button
              onClick={() => signOut()}
              className="hidden md:flex items-center gap-1.5 text-sm px-3.5 py-2 rounded-xl bg-gray-900 text-white hover:bg-gray-700 transition-colors font-medium"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
            <button
              onClick={() => signOut()}
              className="md:hidden p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
              title="Sign out"
            >
              <LogOut className="w-5 h-5" />
            </button>
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

      {/* Click-outside for notifications */}
      {showNotifs && <div className="fixed inset-0 z-30" onClick={() => setShowNotifs(false)} />}

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
