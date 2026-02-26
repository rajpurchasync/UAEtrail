import { useEffect, useState } from 'react';
import { api, UserProfile } from '../api/services';
import { DashboardLayout } from '../components/layout';

const organizerLinks = [
  { to: '/organizer/overview', label: 'Overview' },
  { to: '/organizer/events', label: 'Events' },
  { to: '/organizer/requests', label: 'Join Requests' },
  { to: '/organizer/team', label: 'Team' },
  { to: '/organizer/profile', label: 'Profile' }
];

export const OrganizerProfile = () => {
  const [profile, setProfile] = useState<UserProfile>({});
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getMeProfile()
      .then((response) => setProfile(response.data))
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Failed to load profile'));
  }, []);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    try {
      await api.updateMeProfile(profile);
      setMessage('Profile updated.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to update profile');
    }
  };

  return (
    <DashboardLayout title="Organizer Dashboard" links={organizerLinks}>
      <div className="bg-white border rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">Organizer Profile</h2>
        <form className="grid grid-cols-1 md:grid-cols-2 gap-3" onSubmit={save}>
          <input
            className="border rounded-md px-3 py-2"
            placeholder="Display Name"
            value={profile.displayName ?? ''}
            onChange={(event) => setProfile((current) => ({ ...current, displayName: event.target.value }))}
          />
          <input
            className="border rounded-md px-3 py-2"
            placeholder="Phone"
            value={profile.phone ?? ''}
            onChange={(event) => setProfile((current) => ({ ...current, phone: event.target.value }))}
          />
          <textarea
            className="border rounded-md px-3 py-2 md:col-span-2"
            rows={3}
            placeholder="Bio"
            value={profile.bio ?? ''}
            onChange={(event) => setProfile((current) => ({ ...current, bio: event.target.value }))}
          />
          <input
            className="border rounded-md px-3 py-2 md:col-span-2"
            placeholder="Avatar URL"
            value={profile.avatarUrl ?? ''}
            onChange={(event) => setProfile((current) => ({ ...current, avatarUrl: event.target.value }))}
          />
          <button className="px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 w-fit">Save Profile</button>
        </form>
        {message && <p className="text-sm text-emerald-700 mt-3">{message}</p>}
        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
      </div>
    </DashboardLayout>
  );
};
