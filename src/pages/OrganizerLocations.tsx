import { useEffect, useState } from 'react';
import { LocationDTO } from '@uaetrail/shared-types';
import { api } from '../api/services';
import { DashboardLayout } from '../components/layout';

const organizerLinks = [
  { to: '/organizer/overview', label: 'Overview' },
  { to: '/organizer/events', label: 'Events' },
  { to: '/organizer/requests', label: 'Requests' },
  { to: '/organizer/team', label: 'Team' },
  { to: '/organizer/locations', label: 'Locations' },
  { to: '/organizer/history', label: 'History' },
  { to: '/organizer/profile', label: 'Profile' }
];

const initialForm = {
  name: '',
  region: '',
  activityType: 'hiking' as 'hiking' | 'camping',
  description: '',
  difficulty: '' as string,
  season: ['winter'] as string[],
  childFriendly: false,
  maxGroupSize: undefined as number | undefined,
  accessibility: '' as string,
  images: [] as string[],
  featured: false
};

export const OrganizerLocations = () => {
  const [form, setForm] = useState(initialForm);
  const [submitted, setSubmitted] = useState<LocationDTO[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const tenantId = localStorage.getItem('uaetrail_tenant') ?? '';

  const loadSubmitted = async () => {
    // We don't have a dedicated endpoint for own submitted locations,
    // so we'll track locally what we've submitted in this session
    // In a full implementation, a backend endpoint would be needed
  };

  useEffect(() => {
    loadSubmitted();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payload: Partial<LocationDTO> = {
        name: form.name,
        region: form.region,
        activityType: form.activityType,
        description: form.description,
        season: form.season,
        childFriendly: form.childFriendly,
        images: form.images,
        featured: form.featured
      };
      if (form.difficulty) (payload as Record<string, unknown>).difficulty = form.difficulty;
      if (form.maxGroupSize) (payload as Record<string, unknown>).maxGroupSize = form.maxGroupSize;
      if (form.accessibility) (payload as Record<string, unknown>).accessibility = form.accessibility;

      const res = await api.submitLocation(tenantId, payload);
      setSubmitted((prev) => [res.data, ...prev]);
      setForm(initialForm);
      setSuccess('Location submitted for admin review!');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to submit location');
    } finally {
      setSaving(false);
    }
  };

  const seasons = ['winter', 'spring', 'summer', 'autumn'];

  return (
    <DashboardLayout title="Organizer Dashboard" links={organizerLinks}>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Submit New Location</h2>
      <p className="text-sm text-gray-600 mb-4">Submit locations for the directory. They will be reviewed by admin before becoming active.</p>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
      {success && <p className="text-emerald-600 text-sm mb-3">{success}</p>}

      <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-6 max-w-2xl space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-700 block mb-1">Name *</label>
            <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border rounded w-full px-3 py-2 text-sm" placeholder="e.g. Jebel Jais Summit" />
          </div>
          <div>
            <label className="text-sm text-gray-700 block mb-1">Region *</label>
            <input type="text" required value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} className="border rounded w-full px-3 py-2 text-sm" placeholder="e.g. Ras Al Khaimah" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-700 block mb-1">Activity Type *</label>
            <select value={form.activityType} onChange={(e) => setForm({ ...form, activityType: e.target.value as 'hiking' | 'camping' })} className="border rounded w-full px-3 py-2 text-sm">
              <option value="hiking">Hiking</option>
              <option value="camping">Camping</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-700 block mb-1">Difficulty</label>
            <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })} className="border rounded w-full px-3 py-2 text-sm">
              <option value="">Not specified</option>
              <option value="easy">Easy</option>
              <option value="moderate">Moderate</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-700 block mb-1">Description * (min 20 chars)</label>
          <textarea required minLength={20} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="border rounded w-full px-3 py-2 text-sm" rows={3} placeholder="Describe the location, terrain, highlights..." />
        </div>

        <div>
          <label className="text-sm text-gray-700 block mb-1">Season *</label>
          <div className="flex gap-4">
            {seasons.map((s) => (
              <label key={s} className="flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  checked={form.season.includes(s)}
                  onChange={(e) => {
                    const newSeasons = e.target.checked ? [...form.season, s] : form.season.filter((x) => x !== s);
                    setForm({ ...form, season: newSeasons });
                  }}
                  className="rounded border-gray-300"
                />
                <span className="capitalize">{s}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-gray-700 block mb-1">Max Group Size</label>
            <input type="number" min={1} value={form.maxGroupSize ?? ''} onChange={(e) => setForm({ ...form, maxGroupSize: e.target.value ? parseInt(e.target.value) : undefined })} className="border rounded w-full px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm text-gray-700 block mb-1">Accessibility</label>
            <select value={form.accessibility} onChange={(e) => setForm({ ...form, accessibility: e.target.value })} className="border rounded w-full px-3 py-2 text-sm">
              <option value="">Not specified</option>
              <option value="car-accessible">Car Accessible</option>
              <option value="remote">Remote</option>
            </select>
          </div>
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.childFriendly} onChange={(e) => setForm({ ...form, childFriendly: e.target.checked })} className="rounded border-gray-300" />
              Child Friendly
            </label>
          </div>
        </div>

        <button type="submit" disabled={saving} className="bg-emerald-600 text-white px-4 py-2 rounded text-sm hover:bg-emerald-700 disabled:opacity-50">
          {saving ? 'Submitting...' : 'Submit for Review'}
        </button>
      </form>

      {/* Submitted locations */}
      {submitted.length > 0 && (
        <div className="mt-8">
          <h3 className="font-semibold text-gray-900 mb-3">Recently Submitted</h3>
          <div className="space-y-2">
            {submitted.map((loc) => (
              <div key={loc.id} className="bg-white border rounded-lg p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900">{loc.name}</p>
                  <p className="text-xs text-gray-500">{loc.region} &middot; {loc.activityType}</p>
                </div>
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">Pending Review</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
