import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, User, Phone, Mail, Camera, ChevronRight } from 'lucide-react';
import { api, UserProfile as UserProfileData } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { registerPushNotifications } from '../utils/push';

export const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfileData>({});
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pushStatus, setPushStatus] = useState<string | null>(null);

  const isOrganizer =
    user?.role === 'tenant_owner' || user?.role === 'tenant_admin' || user?.role === 'tenant_guide';

  useEffect(() => {
    api
      .getMeProfile()
      .then((res) => setProfile(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSaving(true);
    try {
      await api.updateMeProfile(profile);
      setMessage('Profile updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-600 mb-3">Sign in to view your profile</p>
          <Link to="/signin" className="text-emerald-600 hover:text-emerald-700 font-medium">
            Sign In →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Profile header */}
      <div className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt="" className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                <User className="w-7 h-7 text-emerald-600" />
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {profile.displayName || user.displayName || 'Your Profile'}
              </h1>
              <p className="text-sm text-gray-500">{profile.email || user.email}</p>
              <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium capitalize">
                {user.role.replace('tenant_', '').replace('platform_', '')}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Quick links */}
        <div className="bg-white border rounded-lg divide-y">
          <Link to="/trips" className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
            <span className="text-sm font-medium text-gray-700">My Trips</span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </Link>
          {isOrganizer && (
            <Link to="/trips" className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
              <span className="text-sm font-medium text-gray-700">Organized Events</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </Link>
          )}
          <Link to="/dashboard/overview" className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
            <span className="text-sm font-medium text-gray-700">Full Dashboard</span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </Link>
          {isOrganizer && (
            <Link to="/organizer/overview" className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
              <span className="text-sm font-medium text-gray-700">Organizer Dashboard</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </Link>
          )}
          {isOrganizer && (
            <Link to="/organizer/profile" className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
              <span className="text-sm font-medium text-gray-700">My Organizer Profile</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </Link>
          )}
          {!isOrganizer && (
            <Link to="/become-organizer" className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
              <span className="text-sm font-medium text-emerald-700">Become an Organizer</span>
              <ChevronRight className="w-4 h-4 text-emerald-400" />
            </Link>
          )}
        </div>

        {/* Edit profile form */}
        <div className="bg-white border rounded-lg p-4">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Edit Profile</h2>
          {loading ? (
            <div className="py-6 text-center">
              <div className="inline-block w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mr-2" />
              <span className="text-sm text-gray-500">Loading...</span>
            </div>
          ) : (
            <form className="space-y-3" onSubmit={save}>
              {/* Photo */}
              <div>
                <label className="flex items-center gap-2 text-xs font-medium text-gray-600 mb-2">
                  <Camera className="w-3.5 h-3.5" /> Profile Photo
                </label>
                <div className="flex items-center gap-4">
                  {profile.avatarUrl ? (
                    <img src={profile.avatarUrl} alt="" className="w-14 h-14 rounded-full object-cover border-2 border-gray-200" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
                      <User className="w-6 h-6 text-emerald-600" />
                    </div>
                  )}
                  <input
                    className="flex-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Paste photo URL..."
                    value={profile.avatarUrl ?? ''}
                    onChange={(e) => setProfile((p) => ({ ...p, avatarUrl: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-medium text-gray-600 mb-1">
                  <User className="w-3.5 h-3.5" /> Display Name
                </label>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Your display name"
                  value={profile.displayName ?? ''}
                  onChange={(e) => setProfile((p) => ({ ...p, displayName: e.target.value }))}
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-medium text-gray-600 mb-1">
                  <Mail className="w-3.5 h-3.5" /> Email
                </label>
                <input
                  type="email"
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                  value={profile.email ?? ''}
                  disabled
                />
                <p className="text-xs text-gray-400 mt-0.5">Email cannot be changed</p>
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-medium text-gray-600 mb-1">
                  <Phone className="w-3.5 h-3.5" /> Phone
                </label>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Phone number"
                  value={profile.phone ?? ''}
                  onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Push notifications</label>
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await registerPushNotifications();
                    setPushStatus(ok ? 'Notifications enabled.' : 'Could not enable notifications.');
                  }}
                  className="text-sm px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                >
                  Enable trip updates
                </button>
                {pushStatus && <p className="text-xs text-gray-500 mt-1">{pushStatus}</p>}
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-60 transition-colors"
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
              {message && <p className="text-sm text-emerald-700 text-center">{message}</p>}
              {error && <p className="text-sm text-red-600 text-center">{error}</p>}
            </form>
          )}
        </div>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-red-200 rounded-lg text-red-600 text-sm font-medium hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
};
