import { useEffect, useState, useCallback } from 'react';
import { LocationDTO } from '@uaetrail/shared-types';
import { api } from '../api/services';
import { DashboardLayout } from '../components/layout';
import { ADMIN_LINKS } from '../constants';
import { MapPinPicker } from '../components/ui/MapPinPicker';

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
  status: 'draft',
  distance: undefined,
  duration: undefined,
  elevation: undefined,
  campingType: undefined,
  latitude: null,
  longitude: null,
  highlights: []
};

const SEASONS = ['winter', 'spring', 'summer', 'autumn', 'year-round'];

export const AdminLocations = () => {
  const [locations, setLocations] = useState<LocationDTO[]>([]);
  const [form, setForm] = useState<Partial<LocationDTO>>(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [imageInput, setImageInput] = useState('');
  const [highlightInput, setHighlightInput] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [confirmAction, setConfirmAction] = useState<{ type: 'status' | 'delete' | 'publish'; loc: LocationDTO } | null>(null);

  const loadLocations = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminLocations();
      setLocations(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load locations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadLocations(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setImageInput('');
    setHighlightInput('');
    setModalOpen(true);
  };

  const openEdit = (loc: LocationDTO) => {
    setEditingId(loc.id);
    setForm({ ...loc });
    setImageInput((loc.images ?? []).join(', '));
    setHighlightInput((loc.highlights ?? []).join(', '));
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
        highlights: highlightInput.split(',').map((s) => s.trim()).filter(Boolean),
        season: form.season?.length ? form.season : ['winter'],
        // Clear hiking-specific fields for camping and vice versa
        ...(form.activityType === 'camping' ? { distance: undefined, duration: undefined, elevation: undefined } : {}),
        ...(form.activityType === 'hiking' ? { campingType: undefined } : {})
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

  const executeConfirmAction = async () => {
    if (!confirmAction) return;
    try {
      if (confirmAction.type === 'publish') {
        await api.updateAdminLocation(confirmAction.loc.id, { status: 'active' });
      } else if (confirmAction.type === 'status') {
        const newStatus = confirmAction.loc.status === 'active' ? 'inactive' : 'active';
        await api.updateAdminLocation(confirmAction.loc.id, { status: newStatus });
      } else {
        await api.deleteAdminLocation(confirmAction.loc.id);
      }
      setConfirmAction(null);
      await loadLocations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
      setConfirmAction(null);
    }
  };

  const handleMapChange = useCallback((lat: number | null, lng: number | null) => {
    setForm((prev) => ({ ...prev, latitude: lat, longitude: lng }));
  }, []);

  const filtered = locations
    .filter((l) => filterType === 'all' || l.activityType === filterType)
    .filter((l) => filterStatus === 'all' || l.status === filterStatus)
    .filter((l) => !search || l.name.toLowerCase().includes(search.toLowerCase()) || l.region.toLowerCase().includes(search.toLowerCase()));

  const difficultyBadge = (d?: string) => {
    const colors: Record<string, string> = { easy: 'bg-green-100 text-green-800', moderate: 'bg-yellow-100 text-yellow-800', hard: 'bg-red-100 text-red-800' };
    return d ? <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[d] ?? 'bg-gray-100 text-gray-800'}`}>{d}</span> : <span className="text-xs text-gray-400">—</span>;
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-600',
      draft: 'bg-amber-100 text-amber-800'
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[status] ?? 'bg-gray-100 text-gray-600'}`}>
        {status}
      </span>
    );
  };

  const draftCount = locations.filter((l) => l.status === 'draft').length;
  const activeCount = locations.filter((l) => l.status === 'active').length;

  return (
    <DashboardLayout title="Admin Dashboard" links={ADMIN_LINKS}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900">Locations</h2>
            <span className="text-sm text-gray-500">({filtered.length})</span>
            {draftCount > 0 && (
              <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium">
                {draftCount} draft{draftCount > 1 ? 's' : ''}
              </span>
            )}
            <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-medium">
              {activeCount} active
            </span>
          </div>
          <div className="flex items-center gap-3">
            <input type="text" placeholder="Search name or region..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="border rounded px-3 py-1.5 text-sm w-52" />
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="border rounded px-3 py-1.5 text-sm">
              <option value="all">All Types</option>
              <option value="hiking">Hiking</option>
              <option value="camping">Camping</option>
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="border rounded px-3 py-1.5 text-sm">
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
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
                <th className="text-left px-4 py-3">Details</th>
                <th className="text-left px-4 py-3">Season</th>
                <th className="text-center px-4 py-3">Featured</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                  <div className="inline-block w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mr-2" />Loading...
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-500">No locations found</td></tr>
              ) : filtered.map((loc) => (
                <tr key={loc.id} className={`border-t hover:bg-gray-50 ${loc.status === 'draft' ? 'bg-amber-50/40' : ''}`}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{loc.name}</p>
                    <div className="flex gap-1 mt-0.5">
                      {loc.childFriendly && <span className="text-xs text-emerald-600">👨‍👩‍👧</span>}
                      {loc.latitude != null && <span className="text-xs text-blue-600">📍</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{loc.region}</td>
                  <td className="px-4 py-3 capitalize">{loc.activityType}</td>
                  <td className="px-4 py-3">{difficultyBadge(loc.difficulty)}</td>
                  <td className="px-4 py-3">
                    <div className="text-xs text-gray-500 space-y-0.5">
                      {loc.distance && <p>{loc.distance} km</p>}
                      {loc.duration && <p>{loc.duration} hrs</p>}
                      {loc.elevation && <p>↑ {loc.elevation}m</p>}
                      {loc.campingType && <p className="capitalize">{loc.campingType.replace('-', ' ')}</p>}
                      {!loc.distance && !loc.duration && !loc.elevation && !loc.campingType && <p className="text-gray-400">—</p>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {loc.season.map((s) => (
                        <span key={s} className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-xs capitalize">{s}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">{loc.featured ? '⭐' : '—'}</td>
                  <td className="px-4 py-3">{statusBadge(loc.status)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5 flex-wrap">
                      <button onClick={() => openEdit(loc)} className="px-2 py-1 rounded bg-blue-100 text-blue-800 hover:bg-blue-200 text-xs">Edit</button>
                      {loc.status === 'draft' && (
                        <button onClick={() => setConfirmAction({ type: 'publish', loc })} className="px-2 py-1 rounded bg-emerald-100 text-emerald-800 hover:bg-emerald-200 text-xs">Publish</button>
                      )}
                      {loc.status !== 'draft' && (
                        <button onClick={() => setConfirmAction({ type: 'status', loc })}
                          className={`px-2 py-1 rounded text-xs ${loc.status === 'active' ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-green-100 text-green-800 hover:bg-green-200'}`}>
                          {loc.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                      <button onClick={() => setConfirmAction({ type: 'delete', loc })} className="px-2 py-1 rounded bg-red-100 text-red-800 hover:bg-red-200 text-xs">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setConfirmAction(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {confirmAction.type === 'delete' ? 'Delete Location?'
                : confirmAction.type === 'publish' ? 'Publish Location?'
                  : confirmAction.loc.status === 'active' ? 'Deactivate Location?' : 'Activate Location?'}
            </h3>
            <p className="text-sm text-gray-600 mb-1">
              {confirmAction.type === 'delete'
                ? 'This will permanently remove the location. This cannot be undone if there are no active events.'
                : confirmAction.type === 'publish'
                  ? 'This will publish the draft and make it visible in public listings.'
                  : confirmAction.loc.status === 'active'
                    ? 'This will hide the location from public listings.'
                    : 'This will make the location visible in public listings.'}
            </p>
            <p className="text-sm font-medium text-gray-900 mb-4">{confirmAction.loc.name}</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmAction(null)} className="px-4 py-2 border rounded-md text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={executeConfirmAction}
                className={`px-4 py-2 rounded-md text-sm text-white ${confirmAction.type === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                {confirmAction.type === 'delete' ? 'Delete' : confirmAction.type === 'publish' ? 'Publish' : confirmAction.loc.status === 'active' ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-gray-900">{editingId ? 'Edit Location' : 'Add New Location'}</h2>
                {form.status === 'draft' && (
                  <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium">Draft</span>
                )}
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-6">
              {/* ── Section: Basic Information ── */}
              <fieldset className="space-y-4">
                <legend className="text-sm font-semibold text-gray-800 uppercase tracking-wide border-b pb-1 w-full">Basic Information</legend>
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
              </fieldset>

              {/* ── Section: Trail Details (hiking only) ── */}
              {form.activityType === 'hiking' && (
                <fieldset className="space-y-4">
                  <legend className="text-sm font-semibold text-gray-800 uppercase tracking-wide border-b pb-1 w-full">🥾 Trail Details</legend>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Distance (km)</label>
                      <input type="number" step="0.1" min={0} value={form.distance ?? ''} onChange={(e) => setForm({ ...form, distance: e.target.value ? Number(e.target.value) : undefined })}
                        className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="12.5" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Duration (hours)</label>
                      <input type="number" step="0.5" min={0} value={form.duration ?? ''} onChange={(e) => setForm({ ...form, duration: e.target.value ? Number(e.target.value) : undefined })}
                        className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="6" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Elevation (m)</label>
                      <input type="number" min={0} value={form.elevation ?? ''} onChange={(e) => setForm({ ...form, elevation: e.target.value ? Number(e.target.value) : undefined })}
                        className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="1934" />
                    </div>
                  </div>
                </fieldset>
              )}

              {/* ── Section: Camping Details (camping only) ── */}
              {form.activityType === 'camping' && (
                <fieldset className="space-y-4">
                  <legend className="text-sm font-semibold text-gray-800 uppercase tracking-wide border-b pb-1 w-full">⛺ Camping Details</legend>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Camping Type</label>
                    <select value={form.campingType ?? ''} onChange={(e) => setForm({ ...form, campingType: (e.target.value || undefined) as LocationDTO['campingType'] })}
                      className="w-full border rounded-lg px-3 py-2 text-sm">
                      <option value="">Not specified</option>
                      <option value="self-guided">Self-guided</option>
                      <option value="operator-led">Operator-led</option>
                    </select>
                  </div>
                </fieldset>
              )}

              {/* ── Section: Description & Highlights ── */}
              <fieldset className="space-y-4">
                <legend className="text-sm font-semibold text-gray-800 uppercase tracking-wide border-b pb-1 w-full">Description & Highlights</legend>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Description *</label>
                  <textarea required value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent" rows={3}
                    placeholder="Describe the location, terrain, highlights..." />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Highlights (comma-separated)</label>
                  <input type="text" value={highlightInput} onChange={(e) => setHighlightInput(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g. Summit views, Rock formations, Wildlife spotting" />
                  {highlightInput && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {highlightInput.split(',').map((h) => h.trim()).filter(Boolean).map((h, i) => (
                        <span key={i} className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-xs">{h}</span>
                      ))}
                    </div>
                  )}
                </div>
              </fieldset>

              {/* ── Section: Season & Options ── */}
              <fieldset className="space-y-4">
                <legend className="text-sm font-semibold text-gray-800 uppercase tracking-wide border-b pb-1 w-full">Season & Options</legend>
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
                    <select value={form.status ?? 'draft'} onChange={(e) => setForm({ ...form, status: e.target.value as LocationDTO['status'] })}
                      className="w-full border rounded-lg px-3 py-2 text-sm">
                      <option value="draft">Draft</option>
                      <option value="active">Active (Published)</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
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
              </fieldset>

              {/* ── Section: Media ── */}
              <fieldset className="space-y-4">
                <legend className="text-sm font-semibold text-gray-800 uppercase tracking-wide border-b pb-1 w-full">Media</legend>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Image URLs (comma-separated)</label>
                  <textarea value={imageInput} onChange={(e) => setImageInput(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm" rows={2}
                    placeholder="https://example.com/img1.jpg, https://example.com/img2.jpg" />
                  {imageInput && (
                    <div className="flex gap-2 mt-2 overflow-x-auto">
                      {imageInput.split(',').map((u) => u.trim()).filter(Boolean).map((url, i) => (
                        <img key={i} src={url} alt={`Preview ${i + 1}`}
                          className="w-20 h-14 object-cover rounded border"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      ))}
                    </div>
                  )}
                </div>
              </fieldset>

              {/* ── Section: Map Location ── */}
              <fieldset className="space-y-4">
                <legend className="text-sm font-semibold text-gray-800 uppercase tracking-wide border-b pb-1 w-full">Map Location</legend>
                <MapPinPicker
                  latitude={form.latitude}
                  longitude={form.longitude}
                  onChange={handleMapChange}
                />
              </fieldset>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex justify-between items-center pt-2 border-t">
                <div className="text-xs text-gray-400">
                  {form.status === 'draft' && 'This location will be saved as a draft and won\'t be visible publicly.'}
                  {form.status === 'active' && 'This location will be published and visible in public listings.'}
                  {form.status === 'inactive' && 'This location will be hidden from public listings.'}
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={closeModal} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Cancel</button>
                  {!editingId && form.status !== 'draft' && (
                    <button type="button" onClick={() => {
                      setForm((prev) => ({ ...prev, status: 'draft' as const }));
                      // Auto-submit as draft
                      const syntheticEvent = { preventDefault: () => {} } as React.FormEvent;
                      setTimeout(() => handleSave(syntheticEvent), 50);
                    }} className="px-4 py-2 border border-amber-300 text-amber-700 rounded-lg text-sm hover:bg-amber-50">
                      Save as Draft
                    </button>
                  )}
                  <button type="submit" disabled={saving} className="px-6 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-60">
                    {saving ? 'Saving...' : editingId ? 'Update Location' : form.status === 'draft' ? 'Save Draft' : 'Publish Location'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
