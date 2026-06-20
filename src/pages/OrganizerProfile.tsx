import { useEffect, useState } from 'react';
import { api, UserProfile, OrganizerApplication } from '../api/services';
import { DashboardLayout } from '../components/layout';
import { COUNTRIES } from '../constants';

const organizerLinks = [
  { to: '/organizer/overview', label: 'Overview' },
  { to: '/organizer/events', label: 'Events' },
  { to: '/organizer/requests', label: 'Join Requests' },
  { to: '/organizer/team', label: 'Team' },
  { to: '/organizer/locations', label: 'Locations' },
  { to: '/organizer/messages', label: 'Messages' },
  { to: '/organizer/history', label: 'History' },
  { to: '/organizer/profile', label: 'Profile' }
];

interface OrganizerFields {
  phone: string;
  nationality: string;
  residence: string;
  experience: string;
  languages: string;
  certificates: string;
  notableHikes: string;
  organizationName: string;
  organizationType: string;
  profilePhoto: string;
}

export const OrganizerProfile = () => {
  const [profile, setProfile] = useState<UserProfile>({});
  const [fields, setFields] = useState<OrganizerFields>({
    phone: '', nationality: '', residence: '', experience: '',
    languages: '', certificates: '', notableHikes: '',
    organizationName: '', organizationType: '', profilePhoto: '',
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getMeProfile(), api.getMyOrganizerApplication()])
      .then(([profileRes, appRes]) => {
        setProfile(profileRes.data);
        if (appRes.data) {
          const meta = appRes.data.metadata ?? {};
          setFields({
            phone: meta.phone ?? profileRes.data.phone ?? '',
            nationality: meta.nationality ?? '',
            residence: meta.residence ?? '',
            experience: meta.experience ?? '',
            languages: meta.languages ?? '',
            certificates: meta.certificates ?? '',
            notableHikes: meta.notableHikes ?? '',
            organizationName: appRes.data.requestedName ?? '',
            organizationType: appRes.data.requestedType ?? '',
            profilePhoto: meta.profilePhoto ?? profileRes.data.avatarUrl ?? '',
          });
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSaving(true);
    try {
      await api.updateMeProfile({
        displayName: profile.displayName,
        phone: fields.phone,
        avatarUrl: fields.profilePhoto,
      });
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

        {loading ? (
          <div className="bg-white border rounded-lg p-8 text-center">
            <div className="inline-block w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500 mt-2">Loading profile...</p>
          </div>
        ) : (
          <div className="bg-white border rounded-lg p-6">
            {/* Avatar Preview */}
            <div className="flex items-center gap-4 mb-6 pb-6 border-b">
              {fields.profilePhoto ? (
                <img src={fields.profilePhoto} alt="Avatar" className="w-20 h-20 rounded-full object-cover border-2 border-gray-200" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-2xl font-bold text-emerald-700">
                  {profile.displayName?.charAt(0)?.toUpperCase() ?? profile.email?.charAt(0)?.toUpperCase() ?? '?'}
                </div>
              )}
              <div>
                <p className="font-semibold text-gray-900 text-lg">{profile.displayName || 'No name set'}</p>
                <p className="text-sm text-gray-500">{profile.email}</p>
                <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium capitalize">
                  {profile.role?.replace('_', ' ')}
                </span>
              </div>
            </div>

            <form onSubmit={save} className="space-y-4">
              {/* Display Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Display Name</label>
                  <input type="text" value={profile.displayName ?? ''} onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent" placeholder="Your name" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Phone</label>
                  <input type="tel" value={fields.phone} onChange={(e) => setFields({ ...fields, phone: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent" placeholder="+971 50 123 4567" />
                </div>
              </div>

              {/* Photo URL */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Profile Photo URL</label>
                <input type="url" value={fields.profilePhoto} onChange={(e) => setFields({ ...fields, profilePhoto: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent" placeholder="https://..." />
              </div>

              {/* Nationality & Residence */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Nationality</label>
                  <select value={fields.nationality} onChange={(e) => setFields({ ...fields, nationality: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
                    <option value="">Select country</option>
                    {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Country of Residence</label>
                  <select value={fields.residence} onChange={(e) => setFields({ ...fields, residence: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
                    <option value="">Select country</option>
                    {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Experience */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Years of Experience</label>
                <select value={fields.experience} onChange={(e) => setFields({ ...fields, experience: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
                  <option value="">Select...</option>
                  <option value="<1 year">Less than 1 year</option>
                  <option value="1-3 years">1-3 years</option>
                  <option value="3-5 years">3-5 years</option>
                  <option value="5+ years">5+ years</option>
                </select>
              </div>

              {/* Languages */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Languages Spoken</label>
                <input type="text" value={fields.languages} onChange={(e) => setFields({ ...fields, languages: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent" placeholder="English, Arabic, Hindi..." />
              </div>

              {/* Certificates */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Certificates & Qualifications</label>
                <textarea value={fields.certificates} onChange={(e) => setFields({ ...fields, certificates: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  rows={2} placeholder="First-aid certified, Wilderness guide training, etc." />
              </div>

              {/* Notable Hikes */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Notable Hikes</label>
                <textarea value={fields.notableHikes} onChange={(e) => setFields({ ...fields, notableHikes: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  rows={2} placeholder="Jebel Jais summit, Wadi Shawka waterfall trail, etc." />
              </div>

              {/* Organization Info (read-only) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Organization Name</label>
                  <input type="text" value={fields.organizationName} disabled
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500 cursor-not-allowed" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Type</label>
                  <input type="text" value={fields.organizationType === 'GUIDE_OWNED' ? 'Independent Guide' : fields.organizationType === 'COMPANY' ? 'Company' : fields.organizationType} disabled
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500 cursor-not-allowed" />
                </div>
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
        )}
      </div>
    </DashboardLayout>
  );
};
