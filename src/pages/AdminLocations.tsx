import { useEffect, useState } from 'react';
import { LocationDTO } from '@uaetrail/shared-types';
import { api } from '../api/services';
import { DashboardLayout } from '../components/layout';

const adminLinks = [
  { to: '/admin/overview', label: 'Overview' },
  { to: '/admin/locations', label: 'Locations' },
  { to: '/admin/organizers', label: 'Organizer Approvals' },
  { to: '/admin/events', label: 'Event Moderation' }
];

const initialForm: Partial<LocationDTO> = {
  name: '',
  region: '',
  activityType: 'hiking',
  description: '',
  season: ['winter'],
  childFriendly: false,
  images: [],
  featured: false,
  status: 'active'
};

export const AdminLocations = () => {
  const [locations, setLocations] = useState<LocationDTO[]>([]);
  const [form, setForm] = useState<Partial<LocationDTO>>(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadLocations = async () => {
    try {
      const response = await api.getAdminLocations();
      setLocations(response.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load locations');
    }
  };

  useEffect(() => {
    loadLocations();
  }, []);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.createAdminLocation({
        ...form,
        images: form.images ?? [],
        season: form.season ?? ['winter']
      });
      setForm(initialForm);
      await loadLocations();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save location');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout title="Admin Dashboard" links={adminLinks}>
      <div className="space-y-6">
        <section className="bg-white border rounded-lg p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Location</h2>
          <form className="grid grid-cols-1 md:grid-cols-2 gap-3" onSubmit={handleCreate}>
            <input
              className="border rounded-md px-3 py-2"
              placeholder="Name"
              value={form.name ?? ''}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              required
            />
            <input
              className="border rounded-md px-3 py-2"
              placeholder="Region (e.g. RAK)"
              value={form.region ?? ''}
              onChange={(event) => setForm((current) => ({ ...current, region: event.target.value }))}
              required
            />
            <select
              className="border rounded-md px-3 py-2"
              value={form.activityType ?? 'hiking'}
              onChange={(event) =>
                setForm((current) => ({ ...current, activityType: event.target.value as LocationDTO['activityType'] }))
              }
            >
              <option value="hiking">Hiking</option>
              <option value="camping">Camping</option>
            </select>
            <input
              className="border rounded-md px-3 py-2"
              placeholder="Season CSV (winter,year-round)"
              value={(form.season ?? []).join(',')}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  season: event.target.value.split(',').map((value) => value.trim()).filter(Boolean)
                }))
              }
            />
            <textarea
              className="border rounded-md px-3 py-2 md:col-span-2"
              placeholder="Description"
              value={form.description ?? ''}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              rows={3}
              required
            />
            <input
              className="border rounded-md px-3 py-2 md:col-span-2"
              placeholder="Image URLs CSV"
              value={(form.images ?? []).join(',')}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  images: event.target.value.split(',').map((value) => value.trim()).filter(Boolean)
                }))
              }
            />
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={Boolean(form.featured)}
                onChange={(event) => setForm((current) => ({ ...current, featured: event.target.checked }))}
              />
              Featured
            </label>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Create Location'}
            </button>
          </form>
          {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
        </section>
        <section className="bg-white border rounded-lg overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Region</th>
                <th className="text-left px-4 py-3">Type</th>
                <th className="text-left px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {locations.map((location) => (
                <tr key={location.id} className="border-t">
                  <td className="px-4 py-3">{location.name}</td>
                  <td className="px-4 py-3">{location.region}</td>
                  <td className="px-4 py-3 capitalize">{location.activityType}</td>
                  <td className="px-4 py-3 capitalize">{location.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </DashboardLayout>
  );
};
