import { useEffect, useState, useCallback } from 'react';
import { LocationDTO } from '@uaetrail/shared-types';
import { api } from '../api/services';
import { DashboardLayout } from '../components/layout';
import { ADMIN_LINKS } from '../constants';
import { MapPinPicker } from '../components/ui/MapPinPicker';
import { ImageUpload } from '../components/ui';
import { AssetKeyUpload } from '../components/ui/AssetKeyUpload';

/* ─── Constants ──────────────────────────────────────────────────────────── */

const HIKING_SURFACES = ['Stairs', 'Boulders', 'Steep hike', 'Rocks', 'Sandy', 'Gravel'];
const CAMPING_SURFACES = ['Sand', 'Grass', 'Rocky', 'Mixed terrain'];
const HIKING_ACCESSIBLE = ['4X4 required', 'Any cars', 'Bike'];
const CAMPING_ACCESSIBLE = ['4X4 required', 'Any cars'];
const TAG_OPTIONS = ['Child-free', 'Pet-friendly', 'Family-friendly', 'Solo-friendly', 'Wheelchair-accessible', 'Night-hiking', 'Sunrise spot', 'Sunset spot'];
import { SUPPORTED_COUNTRIES, DEFAULT_COUNTRY, getRegionsForCountry, CountryCode } from '../config/regions';
const SEASONS = ['winter', 'spring', 'summer', 'autumn', 'year-round'];

const emptyForm: Partial<LocationDTO> = {
  name: '', region: '', activityType: 'hiking', description: '', difficulty: 'moderate',
  season: ['winter'], childFriendly: false, maxGroupSize: 20, accessibility: 'car-accessible',
  images: [], featured: false, status: 'draft', distance: undefined, duration: undefined,
  elevation: undefined, campingType: undefined, latitude: null, longitude: null,
  highlights: [], surfaceType: [], tags: [], parkingLink: '', accessibleBy: [], countryCode: DEFAULT_COUNTRY,
  gpxKey: null, guidePdfKey: null, guideMarkdown: '', guidePreview: '', unlockPriceAed: 29
};

/* ─── Component ──────────────────────────────────────────────────────────── */

export const AdminLocations = () => {
  const [locations, setLocations] = useState<LocationDTO[]>([]);
  const [form, setForm] = useState<Partial<LocationDTO>>(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [highlightInput, setHighlightInput] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'hiking' | 'camping'>('all');
  const [search, setSearch] = useState('');
  const [confirmAction, setConfirmAction] = useState<{ type: 'status' | 'delete' | 'publish'; loc: LocationDTO } | null>(null);
  const [previewLoc, setPreviewLoc] = useState<LocationDTO | null>(null);
  const [formStep, setFormStep] = useState(0); // 0=type select, 1=form

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
    setHighlightInput('');
    setFormStep(0);
    setModalOpen(true);
  };

  const openEdit = (loc: LocationDTO) => {
    setEditingId(loc.id);
    setForm({ ...loc });
    setHighlightInput((loc.highlights ?? []).join(', '));
    setFormStep(1);
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setEditingId(null); setError(null); };

  const selectType = (type: 'hiking' | 'camping') => {
    setForm({ ...emptyForm, activityType: type });
    setFormStep(1);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.images || form.images.length === 0) { setError('At least 1 photo is required'); return; }
    setSaving(true); setError(null);
    try {
      const payload = {
        ...form,
        images: form.images ?? [],
        highlights: highlightInput.split(',').map((s) => s.trim()).filter(Boolean),
        season: form.season?.length ? form.season : ['winter'],
        ...(form.activityType === 'camping' ? { distance: undefined, duration: undefined, elevation: undefined } : {}),
        ...(form.activityType === 'hiking' ? { campingType: undefined } : {})
      };
      if (editingId) {
        await api.updateAdminLocation(editingId, payload);
      } else {
        await api.createAdminLocation(payload);
      }
      closeModal(); await loadLocations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save location');
    } finally {
      setSaving(false);
    }
  };

  const canApprove = (loc: Partial<LocationDTO>) => {
    const hikingOk = loc.activityType !== 'hiking' || Boolean(loc.difficulty);
    const parkingOk = Boolean(loc.parkingLink) || (loc.latitude != null && loc.longitude != null);
    return hikingOk && parkingOk;
  };

  const executeConfirmAction = async () => {
    if (!confirmAction) return;
    try {
      if (confirmAction.type === 'publish') {
        if (!canApprove(confirmAction.loc)) {
          setError('Complete difficulty (hikes), parking link or map pin before approving.');
          setConfirmAction(null);
          openEdit(confirmAction.loc);
          return;
        }
        await api.updateAdminLocation(confirmAction.loc.id, { status: 'active' });
      } else if (confirmAction.type === 'status') {
        const newStatus = confirmAction.loc.status === 'active' ? 'inactive' : 'active';
        await api.updateAdminLocation(confirmAction.loc.id, { status: newStatus });
      } else await api.deleteAdminLocation(confirmAction.loc.id);
      setConfirmAction(null); await loadLocations();
    } catch (err) { setError(err instanceof Error ? err.message : 'Action failed'); setConfirmAction(null); }
  };

  const handleMapChange = useCallback((lat: number | null, lng: number | null) => {
    setForm((prev) => ({ ...prev, latitude: lat, longitude: lng }));
  }, []);

  const toggleArrayItem = (field: 'surfaceType' | 'tags' | 'accessibleBy' | 'season', item: string) => {
    setForm((prev) => {
      const arr = (prev[field] as string[] | undefined) ?? [];
      return { ...prev, [field]: arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item] };
    });
  };

  const filtered = locations
    .filter((l) => {
      if (activeTab === 'pending') return l.status === 'draft';
      if (activeTab === 'all') return true;
      return l.activityType === activeTab;
    })
    .filter((l) => !search || l.name.toLowerCase().includes(search.toLowerCase()) || l.region.toLowerCase().includes(search.toLowerCase()));

  const hikingCount = locations.filter((l) => l.activityType === 'hiking').length;
  const campingCount = locations.filter((l) => l.activityType === 'camping').length;
  const pendingCount = locations.filter((l) => l.status === 'draft').length;
  const regionOptions = getRegionsForCountry((form.countryCode as CountryCode) ?? DEFAULT_COUNTRY);

  const statusBadge = (status: string) => {
    const labels: Record<string, string> = { active: 'Active', inactive: 'Inactive', draft: 'Pending review' };
    const colors: Record<string, string> = { active: 'bg-green-100 text-green-800', inactive: 'bg-gray-100 text-gray-600', draft: 'bg-amber-100 text-amber-800' };
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[status] ?? 'bg-gray-100 text-gray-600'}`}>{labels[status] ?? status}</span>;
  };

  /* ─── Chip multi-select ────────────────────────────────────────────────── */
  const ChipSelect = ({ label, options, selected, onChange }: { label: string; options: string[]; selected: string[]; onChange: (item: string) => void }) => (
    <div>
      <label className="text-sm font-medium text-gray-700 mb-2 block">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button key={opt} type="button"
            onClick={() => onChange(opt)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              selected.includes(opt) ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            }`}>{opt}</button>
        ))}
      </div>
    </div>
  );

  return (
    <DashboardLayout title="Admin Dashboard" links={ADMIN_LINKS}>
      <div className="space-y-4">
        {/* Tabs + Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button onClick={() => setActiveTab('all')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
              All ({locations.length})
            </button>
            <button onClick={() => setActiveTab('pending')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'pending' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
              Pending ({pendingCount})
            </button>
            <button onClick={() => setActiveTab('hiking')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'hiking' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
              🥾 Hiking ({hikingCount})
            </button>
            <button onClick={() => setActiveTab('camping')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'camping' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
              ⛺ Camping ({campingCount})
            </button>
          </div>
          <div className="flex items-center gap-3">
            <input type="text" placeholder="Search name or region..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="border rounded-lg px-3 py-1.5 text-sm w-52" />
            <button onClick={openCreate} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium">
              + Add Location
            </button>
          </div>
        </div>

        {error && !modalOpen && <p className="text-sm text-red-600">{error}</p>}

        {/* Table */}
        <div className="bg-white border rounded-lg overflow-x-auto desktop-scrollbar-x">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3">Location Name</th>
                <th className="text-left px-4 py-3">Region</th>
                <th className="text-left px-4 py-3">Type</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  <div className="inline-block w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mr-2" />Loading...
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No locations found</td></tr>
              ) : filtered.map((loc) => (
                <tr key={loc.id} className={`border-t hover:bg-gray-50 cursor-pointer ${loc.status === 'draft' ? 'bg-amber-50/40' : ''}`}
                  onClick={() => setPreviewLoc(loc)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {loc.images?.[0] ? (
                        <img src={loc.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-lg">
                          {loc.activityType === 'hiking' ? '🥾' : '⛺'}
                        </div>
                      )}
                      <span className="font-medium text-gray-900">{loc.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{loc.region}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      loc.activityType === 'hiking' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}>{loc.activityType === 'hiking' ? '🥾 Hiking' : '⛺ Camping'}</span>
                  </td>
                  <td className="px-4 py-3">{statusBadge(loc.status)}</td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-1.5 flex-wrap">
                      <button onClick={() => openEdit(loc)} className="px-2 py-1 rounded bg-blue-100 text-blue-800 hover:bg-blue-200 text-xs">Edit</button>
                      {loc.status === 'draft' && (
                        <button onClick={() => setConfirmAction({ type: 'publish', loc })} className="px-2 py-1 rounded bg-emerald-100 text-emerald-800 hover:bg-emerald-200 text-xs">Approve</button>
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
        <p className="text-xs text-gray-500">Showing {filtered.length} of {locations.length} locations. Click a row to preview.</p>
      </div>

      {/* ─── Preview Modal ─────────────────────────────────────────────────── */}
      {previewLoc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setPreviewLoc(null)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {previewLoc.images?.[0] && (
              <img src={previewLoc.images[0]} alt="" className="w-full h-48 object-cover rounded-t-lg" />
            )}
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">{previewLoc.name}</h2>
                <button onClick={() => setPreviewLoc(null)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
              </div>
              <div className="flex gap-2 flex-wrap">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${previewLoc.activityType === 'hiking' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                  {previewLoc.activityType === 'hiking' ? '🥾 Hiking' : '⛺ Camping'}
                </span>
                {statusBadge(previewLoc.status)}
                {previewLoc.difficulty && <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 capitalize">{previewLoc.difficulty}</span>}
              </div>
              <p className="text-sm text-gray-500">{previewLoc.region}</p>
              <p className="text-sm text-gray-700 whitespace-pre-line">{previewLoc.description}</p>
              {previewLoc.activityType === 'hiking' && (
                <div className="grid grid-cols-3 gap-3 text-sm">
                  {previewLoc.distance != null && <div className="bg-gray-50 rounded-lg p-2 text-center"><p className="text-xs text-gray-500">Distance</p><p className="font-medium">{previewLoc.distance} km</p></div>}
                  {previewLoc.elevation != null && <div className="bg-gray-50 rounded-lg p-2 text-center"><p className="text-xs text-gray-500">Elevation</p><p className="font-medium">{previewLoc.elevation}m</p></div>}
                  {previewLoc.duration != null && <div className="bg-gray-50 rounded-lg p-2 text-center"><p className="text-xs text-gray-500">Duration</p><p className="font-medium">{previewLoc.duration} hrs</p></div>}
                </div>
              )}
              {(previewLoc.surfaceType?.length ?? 0) > 0 && (
                <div><p className="text-xs text-gray-500 mb-1">Surface</p><div className="flex gap-1 flex-wrap">{previewLoc.surfaceType!.map((s) => <span key={s} className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs">{s}</span>)}</div></div>
              )}
              {(previewLoc.tags?.length ?? 0) > 0 && (
                <div><p className="text-xs text-gray-500 mb-1">Tags</p><div className="flex gap-1 flex-wrap">{previewLoc.tags!.map((t) => <span key={t} className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-xs">{t}</span>)}</div></div>
              )}
              {(previewLoc.accessibleBy?.length ?? 0) > 0 && (
                <div><p className="text-xs text-gray-500 mb-1">Accessible by</p><div className="flex gap-1 flex-wrap">{previewLoc.accessibleBy!.map((a) => <span key={a} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs">{a}</span>)}</div></div>
              )}
              {previewLoc.parkingLink && (
                <div><p className="text-xs text-gray-500 mb-1">Parking</p><a href={previewLoc.parkingLink} target="_blank" rel="noreferrer" className="text-sm text-emerald-600 hover:underline">View on Google Maps →</a></div>
              )}
              <div className="flex gap-3 pt-2 border-t">
                <button onClick={() => { setPreviewLoc(null); openEdit(previewLoc); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Edit</button>
                <button onClick={() => setPreviewLoc(null)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Confirmation Modal ──────────────────────────────────────────── */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setConfirmAction(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {confirmAction.type === 'delete' ? 'Delete Location?' : confirmAction.type === 'publish' ? 'Approve location?' : confirmAction.loc.status === 'active' ? 'Deactivate Location?' : 'Activate Location?'}
            </h3>
            <p className="text-sm text-gray-600 mb-1">
              {confirmAction.type === 'delete'
                ? 'This will permanently remove the location.'
                : confirmAction.type === 'publish'
                  ? 'Approving makes it public. Ensure difficulty (hikes), child/pet tags, and parking are complete.'
                  : confirmAction.loc.status === 'active'
                    ? 'This will hide the location.'
                    : 'This will make the location visible.'}
            </p>
            <p className="text-sm font-medium text-gray-900 mb-4">{confirmAction.loc.name}</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmAction(null)} className="px-4 py-2 border rounded-md text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={executeConfirmAction}
                className={`px-4 py-2 rounded-md text-sm text-white ${confirmAction.type === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                {confirmAction.type === 'delete' ? 'Delete' : confirmAction.type === 'publish' ? 'Approve' : confirmAction.loc.status === 'active' ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Create / Edit Modal ─────────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingId ? 'Edit Location' : formStep === 0 ? 'Select Activity Type' : form.activityType === 'hiking' ? '🥾 Add Hiking Trail' : '⛺ Add Camping Location'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>

            {/* ── Step 0: Type Selection ── */}
            {formStep === 0 && !editingId && (
              <div className="p-8">
                <p className="text-sm text-gray-600 mb-6 text-center">Choose what type of location you want to add</p>
                <div className="grid grid-cols-2 gap-6 max-w-lg mx-auto">
                  <button onClick={() => selectType('hiking')}
                    className="border-2 border-gray-200 hover:border-emerald-400 rounded-xl p-8 text-center transition-all hover:shadow-md group">
                    <div className="text-5xl mb-3">🥾</div>
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-emerald-700">Hiking Trail</h3>
                    <p className="text-xs text-gray-500 mt-1">Trails, mountains, walks</p>
                  </button>
                  <button onClick={() => selectType('camping')}
                    className="border-2 border-gray-200 hover:border-amber-400 rounded-xl p-8 text-center transition-all hover:shadow-md group">
                    <div className="text-5xl mb-3">⛺</div>
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-amber-700">Camping Location</h3>
                    <p className="text-xs text-gray-500 mt-1">Campsites, outdoor stays</p>
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 1: Dynamic Form ── */}
            {(formStep === 1 || editingId) && (
              <form onSubmit={handleSave} className="p-6 space-y-6">
                {form.status === 'draft' && form.submittedById && (
                  <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-900">
                    Organizer submission — add child-friendly / pet-friendly tags, parking link or map pin, and difficulty (hikes) before approving.
                  </div>
                )}

                {/* Section 1: Basic Info */}
                <fieldset className="space-y-4">
                  <legend className="text-sm font-semibold text-gray-800 uppercase tracking-wide border-b pb-1 w-full">
                    {form.activityType === 'hiking' ? '1. Trail Information' : '1. Location Information'}
                  </legend>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">
                        {form.activityType === 'hiking' ? 'Trail Title' : 'Location Title'} *
                      </label>
                      <input type="text" required value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder={form.activityType === 'hiking' ? 'e.g. Jebel Jais Summit Trail' : 'e.g. Al Qudra Desert Camp'} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Country</label>
                      <select
                        value={form.countryCode ?? DEFAULT_COUNTRY}
                        onChange={(e) => setForm({ ...form, countryCode: e.target.value as CountryCode, region: '' })}
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                      >
                        {SUPPORTED_COUNTRIES.map((c) => (
                          <option key={c.code} value={c.code}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">State / Region *</label>
                      <select required value={form.region ?? ''} onChange={(e) => setForm({ ...form, region: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
                        <option value="">Select a region</option>
                        {regionOptions.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                  </div>

                  {form.activityType === 'hiking' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Length in KM *</label>
                        <input type="number" step="0.1" min={0} required value={form.distance ?? ''} onChange={(e) => setForm({ ...form, distance: e.target.value ? Number(e.target.value) : undefined })}
                          className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="12.5" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Elevation (m)</label>
                        <input type="number" min={0} value={form.elevation ?? ''} onChange={(e) => setForm({ ...form, elevation: e.target.value ? Number(e.target.value) : undefined })}
                          className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="1934" />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      {form.activityType === 'hiking' ? 'About the Trail' : 'About the Location'} *
                    </label>
                    <textarea required value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      rows={5} maxLength={3000}
                      placeholder={form.activityType === 'hiking' ? 'Describe the trail, terrain, highlights...' : 'Describe the camping location, amenities, surroundings...'} />
                    <p className="text-xs text-gray-400 mt-1">{(form.description?.length ?? 0)}/3000 characters (approx. 500 words)</p>
                  </div>
                </fieldset>

                {/* Section 2: Conditions */}
                <fieldset className="space-y-4">
                  <legend className="text-sm font-semibold text-gray-800 uppercase tracking-wide border-b pb-1 w-full">2. Conditions</legend>

                  <ChipSelect
                    label="Surface Type"
                    options={form.activityType === 'hiking' ? HIKING_SURFACES : CAMPING_SURFACES}
                    selected={form.surfaceType ?? []}
                    onChange={(item) => toggleArrayItem('surfaceType', item)}
                  />

                  {form.activityType === 'hiking' && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Suitable for *</label>
                      <div className="flex gap-3">
                        {[{ value: 'easy', label: 'Beginner friendly' }, { value: 'moderate', label: 'Intermediate' }, { value: 'hard', label: 'Expert only' }].map((opt) => (
                          <button key={opt.value} type="button"
                            onClick={() => setForm({ ...form, difficulty: opt.value as LocationDTO['difficulty'] })}
                            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                              form.difficulty === opt.value ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                            }`}>{opt.label}</button>
                        ))}
                      </div>
                    </div>
                  )}

                  <ChipSelect
                    label="Select Tags"
                    options={TAG_OPTIONS}
                    selected={form.tags ?? []}
                    onChange={(item) => toggleArrayItem('tags', item)}
                  />

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Season</label>
                    <div className="flex flex-wrap gap-2">
                      {SEASONS.map((s) => (
                        <button key={s} type="button"
                          onClick={() => toggleArrayItem('season', s)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors capitalize ${
                            (form.season ?? []).includes(s) ? 'bg-blue-100 text-blue-800 border-blue-300' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                          }`}>{s}</button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Highlights (comma-separated)</label>
                    <input type="text" value={highlightInput} onChange={(e) => setHighlightInput(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g. Summit views, Rock formations" />
                    {highlightInput && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {highlightInput.split(',').map((h) => h.trim()).filter(Boolean).map((h, i) => (
                          <span key={i} className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-xs">{h}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </fieldset>

                {/* Section 3: Media */}
                <fieldset className="space-y-4">
                  <legend className="text-sm font-semibold text-gray-800 uppercase tracking-wide border-b pb-1 w-full">3. Media</legend>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Add Photos (minimum 1 required) *</label>
                    <ImageUpload
                      images={form.images ?? []}
                      onChange={(urls) => setForm((prev) => ({ ...prev, images: urls }))}
                      max={8}
                      keyPrefix="locations"
                      kind="location-image"
                    />
                  </div>
                </fieldset>

                {/* Section 4: Transportation */}
                <fieldset className="space-y-4">
                  <legend className="text-sm font-semibold text-gray-800 uppercase tracking-wide border-b pb-1 w-full">4. Transportation</legend>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Parking Spot (Google Maps link)</label>
                    <input type="url" value={form.parkingLink ?? ''} onChange={(e) => setForm({ ...form, parkingLink: e.target.value || undefined })}
                      className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="https://maps.google.com/..." />
                  </div>
                  <ChipSelect
                    label="Accessible by"
                    options={form.activityType === 'hiking' ? HIKING_ACCESSIBLE : CAMPING_ACCESSIBLE}
                    selected={form.accessibleBy ?? []}
                    onChange={(item) => toggleArrayItem('accessibleBy', item)}
                  />
                </fieldset>

                {/* Section 5: Premium map & guide */}
                <fieldset className="space-y-4">
                  <legend className="text-sm font-semibold text-gray-800 uppercase tracking-wide border-b pb-1 w-full">
                    5. Route map &amp; paid guide
                  </legend>
                  <p className="text-xs text-gray-500">
                    Upload GPX for offline navigation and a detailed guide for Active (pay-as-you-go), Pro, and GOAT members.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <AssetKeyUpload
                      label="Route map (GPX)"
                      value={form.gpxKey}
                      onChange={(key) => setForm({ ...form, gpxKey: key })}
                      accept=".gpx,application/gpx+xml"
                      kind="location-gpx"
                    />
                    <AssetKeyUpload
                      label="Guide PDF (optional)"
                      value={form.guidePdfKey}
                      onChange={(key) => setForm({ ...form, guidePdfKey: key })}
                      accept=".pdf,application/pdf"
                      kind="location-guide-pdf"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Unlock price (AED)</label>
                    <input
                      type="number"
                      min={0}
                      value={form.unlockPriceAed ?? 29}
                      onChange={(e) => setForm({ ...form, unlockPriceAed: Number(e.target.value) })}
                      className="w-full max-w-xs border rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Guide preview (shown when locked)</label>
                    <textarea
                      rows={2}
                      value={form.guidePreview ?? ''}
                      onChange={(e) => setForm({ ...form, guidePreview: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      placeholder="Teaser text — parking tips, best season, what the full guide covers…"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Full guide content (markdown)</label>
                    <textarea
                      rows={8}
                      value={form.guideMarkdown ?? ''}
                      onChange={(e) => setForm({ ...form, guideMarkdown: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 text-sm font-mono text-xs"
                      placeholder="## Getting there&#10;…&#10;## Route notes&#10;…"
                    />
                  </div>
                </fieldset>

                {/* Section 6: Additional Settings */}
                <fieldset className="space-y-4">
                  <legend className="text-sm font-semibold text-gray-800 uppercase tracking-wide border-b pb-1 w-full">6. Additional Settings</legend>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Status</label>
                      <select value={form.status ?? 'draft'} onChange={(e) => setForm({ ...form, status: e.target.value as LocationDTO['status'] })}
                        className="w-full border rounded-lg px-3 py-2 text-sm">
                        <option value="draft">Draft</option>
                        <option value="active">Active (Published)</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Max Group Size</label>
                      <input type="number" min={1} value={form.maxGroupSize ?? ''} onChange={(e) => setForm({ ...form, maxGroupSize: e.target.value ? Number(e.target.value) : undefined })}
                        className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="20" />
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
                  <MapPinPicker latitude={form.latitude} longitude={form.longitude} onChange={handleMapChange} />
                </fieldset>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <div className="flex justify-between items-center pt-2 border-t">
                  <div className="text-xs text-gray-400">
                    {form.status === 'draft' && 'Saved as draft — won\'t be visible publicly.'}
                    {form.status === 'active' && 'Will be published and visible in public listings.'}
                    {form.status === 'inactive' && 'Will be hidden from public listings.'}
                  </div>
                  <div className="flex gap-3">
                    {!editingId && formStep === 1 && (
                      <button type="button" onClick={() => setFormStep(0)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">← Back</button>
                    )}
                    <button type="button" onClick={closeModal} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Cancel</button>
                    <button type="submit" disabled={saving} className="px-6 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-60">
                      {saving ? 'Saving...' : editingId ? 'Update Location' : form.status === 'draft' ? 'Save Draft' : 'Publish Location'}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
