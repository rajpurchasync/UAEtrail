import { useEffect, useState } from 'react';
import { api, UserProfile } from '../api/services';
import { DashboardLayout } from '../components/layout';

const organizerLinks = [
  { to: '/organizer/overview', label: 'Overview' },
  { to: '/organizer/events', label: 'Events' },
  { to: '/organizer/requests', label: 'Join Requests' },
  { to: '/organizer/team', label: 'Team' },
  { to: '/organizer/locations', label: 'Locations' },
  { to: '/organizer/history', label: 'History' },
  { to: '/organizer/profile', label: 'Profile' }
];

export const OrganizerProfile = () => {
  const [profile, setProfile] = useState<UserProfile>({});
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getMeProfile()
      .then((res) => setProfile(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load profile'));
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSaving(true);
    try {
      await api.updateMeProfile(profile);
      setMessage('Profile updated successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout title="Organizer Dashboard" links={organizerLinks}>
      <div className="max-w-2xl space-y-6">
        <h2 className="text-lg font-semibold text-gray-900">Organizer Profile</h2>

        {/* Avatar Preview */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center gap-4 mb-6">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt="Avatar" className="w-20 h-20 rounded-full object-cover border-2 border-gray-200" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-2xl font-bold text-emerald-700">
                {profile.displayName?.charAt(0)?.toUpperCase() ?? profile.email?.charAt(0)?.toUpperCase() ?? '?'}
              </div>
            )}
            <div>
              <p className="font-semibold text-gray-900 text-lg">{profile.displayName || 'No name set'}</p>
              <p className="text-sm text-gray-500">{profile.email}</p>
              <p className="text-xs text-gray-400 capitalize mt-0.5">{profile.role?.replace('_', ' ')}</p>
            </div>
          </div>

          <form onSubmit={save} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Display Name</label>
                <input type="text" value={profile.displayName ?? ''} onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Your name" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Phone</label>
                <input type="tel" value={profile.phone ?? ''} onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="+971 50 123 4567" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Bio</label>
              <textarea value={profile.bio ?? ''} onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                rows={4} placeholder="Tell people about yourself and your experience as a guide/organizer..." />
              <p className="text-xs text-gray-400 mt-1">{(profile.bio ?? '').length} / 500 characters</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Avatar URL</label>
              <input type="url" value={profile.avatarUrl ?? ''} onChange={(e) => setProfile({ ...profile, avatarUrl: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="https://example.com/your-photo.jpg" />
              <p className="text-xs text-gray-400 mt-1">Paste a URL to your profile picture</p>
            </div>

            {message && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                <p className="text-sm text-emerald-700">{message}</p>
              </div>
            )}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="flex justify-end">
              <button type="submit" disabled={saving}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-60 font-medium">
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};
