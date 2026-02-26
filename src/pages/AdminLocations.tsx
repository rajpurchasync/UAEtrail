import { useEffect, useState } from 'react';
import { LocationDTO } from '@uaetrail/shared-types';
import { api } from '../api/services';
import { DashboardLayout } from '../components/layout';

const adminLinks = [
  { to: '/admin/overview', label: 'Overview' },
  { to: '/admin/locations', label: 'Locations' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/organizers', label: 'Organizer Approvals' },
  { to: '/admin/events', label: 'Event Moderation' }
];

const emptyForm: Partial<LocationDTO> = {
  name: '',
  region: '',
  activityType: 'hiking',
  description: '',
  difficulty: 'moderate',
  season: ['winter'],
  childFriendly: false,
  maxGroupSize: 20,
  accessibility: 'car-accessible',
  images: [],
  featured: false,
  status: 'active'
};

const SEASONS = ['winter', 'spring', 'summer', 'autumn', 'year-round'];

export const AdminLocations = () => {
  const [locations, setLocations] = useState<LocationDTO[]>([]);
  const [form, setForm] = useState<Partial<LocationDTO>>(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [imageInput, setImageInput] = useState('');
  const [filterType, setFilterType] = useState('all');

  const loadLocations = async () => {
    try {
      const res = await api.getAdminLocations();
      setLocations(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load locations');
    }
  };

  useEffect(() => {
    loadLocations();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setImageInput('');
    setModalOpen(true);
  };

  const openEdit = (loc: LocationDTO) => {
    setEditingId(loc.id);
    setForm({ ...loc });
    setImageInput((loc.images ?? []).join(', '));
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...form,
        images: imageInput.split(',').map((s) => s.trim()).filter(Boolean),
        season: form.season?.length ? form.season : ['winter']
      };
      if (editingId) {
        await api.updateAdminLocation(editingId, payload);
      } else {
        await api.createAdminLocation(payload);
      }
      closeModal();
      await loadLocations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save location');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (loc: LocationDTO) => {
    try {
      await api.updateAdminLocation(loc.id, {
        status: loc.status === 'active' ? 'inactive' : 'active'
      });
      await loadLocations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const filtered = filterType === 'all' ? locations : locations.filter((l) => l.activityType === filterType);

  const difficultyBadge = (d?: string) => {
    const colors: Record<string, string> = { easy: 'bg-green-100 text-green-800', moderate: 'bg-yellow-100 text-yellow-800', hard: 'bg-red-100 text-red-800' };
    return d ? <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[d] ?? 'bg-gray-100 text-gray-800'}`}>{d}</span> : <span className="text-xs text-gray-400">—</span>;
  };

  return (
    <DashboardLayout title="Admin Dashboard" links={adminLinks}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900">Locations</h2>
            <span className="text-sm text-gray-500">({locations.length})</span>
          </div>
          <div className="flex items-center gap-3">
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="border rounded px-3 py-1.5 text-sm">
              <option value="all">All Types</option>
              <option value="hiking">Hiking</option>
              <option value="camping">Camping</option>
            </select>
            <button onClick={openCreate} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium">
              + Add Location
            </button>
          </div>
        </div>

        {error && !modalOpen && <p className="text-sm text-red-600">{error}</p>}

        {/* Table */}
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Region</th>
                <th className="text-left px-4 py-3">Type</th>
                <th className="text-left px-4 py-3">Difficulty</th>
                <th className="text-left px-4 py-3">Season</th>
                <th className="text-center px-4 py-3">Featured</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((loc) => (
                <tr key={loc.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{loc.name}</p>
                    {loc.childFriendly && <span className="text-xs text-emerald-600">👨‍👩‍👧 Child-friendly</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{loc.region}</td>
                  <td className="px-4 py-3 capitalize">{loc.activityType}</td>
                  <td className="px-4 py-3">{difficultyBadge(loc.difficulty)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {loc.season.map((s) => (
                        <span key={s} className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-xs capitalize">{s}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">{loc.featured ? '⭐' : '—'}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleStatus(loc)}
                      className={`px-2 py-0.5 rounded text-xs font-medium ${loc.status === 'active' ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      {loc.status}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => openEdit(loc)} className="px-2 py-1 rounded bg-blue-100 text-blue-800 hover:bg-blue-200 text-xs">
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">No locations found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">{editingId ? 'Edit Location' : 'Add New Location'}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Name *</label>
                  <input type="text" required value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent" placeholder="e.g. Jebel Jais Summit" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Region *</label>
                  <input type="text" required value={form.region ?? ''} onChange={(e) => setForm({ ...form, region: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent" placeholder="e.g. Ras Al Khaimah" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Activity Type *</label>
                  <select value={form.activityType ?? 'hiking'} onChange={(e) => setForm({ ...form, activityType: e.target.value as LocationDTO['activityType'] })}
                    className="w-full border rounded-lg px-3 py-2 text-sm">
                    <option value="hiking">Hiking</option>
                    <option value="camping">Camping</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Difficulty</label>
                  <select value={form.difficulty ?? ''} onChange={(e) => setForm({ ...form, difficulty: (e.target.value || undefined) as LocationDTO['difficulty'] })}
                    className="w-full border rounded-lg px-3 py-2 text-sm">
                    <option value="">Not specified</option>
                    <option value="easy">Easy</option>
                    <option value="moderate">Moderate</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Max Group Size</label>
                  <input type="number" min={1} value={form.maxGroupSize ?? ''} onChange={(e) => setForm({ ...form, maxGroupSize: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="20" />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Description *</label>
                <textarea required value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent" rows={3}
                  placeholder="Describe the location, terrain, highlights..." />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Season</label>
                <div className="flex flex-wrap gap-3">
                  {SEASONS.map((s) => (
                    <label key={s} className="flex items-center gap-1.5 text-sm">
                      <input type="checkbox" checked={(form.season ?? []).includes(s)}
                        onChange={(e) => {
                          const updated = e.target.checked ? [...(form.season ?? []), s] : (form.season ?? []).filter((x) => x !== s);
                          setForm({ ...form, season: updated });
                        }}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                      <span className="capitalize">{s}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Accessibility</label>
                  <select value={form.accessibility ?? ''} onChange={(e) => setForm({ ...form, accessibility: (e.target.value || undefined) as LocationDTO['accessibility'] })}
                    className="w-full border rounded-lg px-3 py-2 text-sm">
                    <option value="">Not specified</option>
                    <option value="car-accessible">Car Accessible</option>
                    <option value="remote">Remote</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Status</label>
                  <select value={form.status ?? 'active'} onChange={(e) => setForm({ ...form, status: e.target.value as 'active' | 'inactive' })}
                    className="w-full border rounded-lg px-3 py-2 text-sm">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Image URLs (comma-separated)</label>
                <textarea value={imageInput} onChange={(e) => setImageInput(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm" rows={2}
                  placeholder="https://example.com/img1.jpg, https://example.com/img2.jpg" />
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={Boolean(form.childFriendly)}
                    onChange={(e) => setForm({ ...form, childFriendly: e.target.checked })}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                  Child Friendly
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={Boolean(form.featured)}
                    onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                  Featured
                </label>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="px-6 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-60">
                  {saving ? 'Saving...' : editingId ? 'Update Location' : 'Create Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
