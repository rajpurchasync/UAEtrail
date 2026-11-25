import { useCallback, useMemo, useState } from 'react';
import { useSafeAsyncEffect } from '../../hooks/useSafeAsyncEffect';
import type { AreaDTO, AreaStatus } from '@uaetrail/shared-types';
import { Link } from 'react-router-dom';
import {
  createAdminDestination,
  deleteAdminDestination,
  fetchAdminDestinations,
  updateAdminDestination,
} from '../../hooks/adminConsoleApi';
import { DashboardLayout } from '../../components/layout';
import { ADMIN_LINKS } from '../../constants';
import { MapPinPicker } from '../../components/ui/MapPinPicker';
import { ImageUpload } from '../../components/ui';
import { AppSelect, ADMIN_FILTER_SELECT_CLASS, ADMIN_INPUT_CLASS, ADMIN_SELECT_CLASS } from '../../components/ui/AppSelect';
import { SUPPORTED_COUNTRIES, DEFAULT_COUNTRY, getRegionsForCountry, type CountryCode } from '../../config/regions';
import { adminPlacesPath } from '../../config/adminSurfacePaths';
import { AdminIconButton } from '../../components/admin/AdminIconButton';
import { AdminTablePager, DEFAULT_ADMIN_PAGE_SIZE, paginateRows, type AdminPageSize } from '../../components/admin/AdminTablePager';
import { AdminCatalogWizard } from '../../components/admin/AdminCatalogWizard';
import { AdminFilterBar } from '../../components/admin/AdminFilterBar';
import { MapPin, Pencil, Trash2 } from 'lucide-react';

const AREA_STATUS_FILTER_OPTIONS = [
  { value: 'draft' as const, label: 'Draft' },
  { value: 'published' as const, label: 'Published' },
];

const AREA_WIZARD_STEPS = [
  { id: 'identity', label: 'Identity' },
  { id: 'media', label: 'Pin & media' },
  { id: 'publish', label: 'Publish' },
];

const COUNTRY_OPTIONS = SUPPORTED_COUNTRIES.map((country) => ({
  value: country.code,
  label: country.label,
}));

const STATUS_OPTIONS: { value: AreaStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published (on map & hub)' },
];

const slugFromName = (name: string): string =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

type AreaFormState = {
  countryCode: CountryCode;
  region: string;
  name: string;
  slug: string;
  summary: string;
  imageUrl: string | null;
  status: AreaStatus;
  priority: number;
  latitude: number | null;
  longitude: number | null;
};

const emptyForm = (): AreaFormState => ({
  countryCode: DEFAULT_COUNTRY,
  region: '',
  name: '',
  slug: '',
  summary: '',
  imageUrl: null,
  status: 'draft',
  priority: 100,
  latitude: 25.2048,
  longitude: 55.2708,
});

/** Platform admin — curated geographic areas (country → region → hub). */
export const AdminDestinations = () => {
  const [areas, setAreas] = useState<AreaDTO[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<AdminPageSize>(DEFAULT_ADMIN_PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<AreaFormState>(emptyForm);
  const [slugTouched, setSlugTouched] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<AreaDTO | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');

  const regionOptions = useMemo(
    () => getRegionsForCountry(form.countryCode),
    [form.countryCode]
  );

  const filterRegionOptions = useMemo(
    () => (countryFilter ? getRegionsForCountry(countryFilter as CountryCode) : []),
    [countryFilter]
  );

  const filteredAreas = useMemo(() => {
    const q = search.trim().toLowerCase();
    return areas.filter((area) => {
      if (statusFilter && area.status !== statusFilter) return false;
      if (countryFilter && area.countryCode !== countryFilter) return false;
      if (regionFilter && area.region !== regionFilter) return false;
      if (!q) return true;
      const hay = `${area.name} ${area.slug} ${area.region} ${area.summary ?? ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [areas, search, statusFilter, countryFilter, regionFilter]);

  const load = useCallback(async (isActive: () => boolean = () => true) => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchAdminDestinations();
      if (!isActive()) return;
      setAreas(list);
    } catch {
      if (!isActive()) return;
      setError('Could not load areas.');
    } finally {
      if (isActive()) setLoading(false);
    }
  }, []);

  useSafeAsyncEffect((isActive) => load(isActive), [load]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setSlugTouched(false);
    setWizardStep(0);
    setModalOpen(true);
  };

  const openEdit = (area: AreaDTO) => {
    setEditingId(area.id);
    setSlugTouched(true);
    setForm({
      countryCode: (area.countryCode as CountryCode) ?? DEFAULT_COUNTRY,
      region: area.region,
      name: area.name,
      slug: area.slug,
      summary: area.summary ?? '',
      imageUrl: area.imageUrl ?? null,
      status: area.status,
      priority: area.priority,
      latitude: area.center.latitude,
      longitude: area.center.longitude,
    });
    setWizardStep(0);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setWizardStep(0);
    setError(null);
  };

  const handleNameBlur = () => {
    if (!slugTouched && form.name.trim()) {
      setForm((prev) => ({ ...prev, slug: slugFromName(prev.name) }));
    }
  };

  const handleSave = async () => {
    if (!form.region.trim() || !form.name.trim() || !form.slug.trim()) {
      setError('Country, region, name, and slug are required.');
      setWizardStep(0);
      return;
    }
    if (form.latitude == null || form.longitude == null) {
      setError('Drop a map pin for the area center.');
      setWizardStep(1);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        slug: form.slug.trim().toLowerCase(),
        name: form.name.trim(),
        region: form.region.trim(),
        status: form.status,
        priority: form.priority,
        summary: form.summary.trim() || null,
        countryCode: form.countryCode,
        imageUrl: form.imageUrl?.trim() || null,
        center: { latitude: form.latitude, longitude: form.longitude },
      };
      if (editingId) {
        await updateAdminDestination(editingId, payload);
      } else {
        await createAdminDestination(payload);
      }
      closeModal();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save area.');
    } finally {
      setSaving(false);
    }
  };

  const executeDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteAdminDestination(confirmDelete.id);
      setConfirmDelete(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete area.');
      setConfirmDelete(null);
    }
  };

  const heroImages = form.imageUrl ? [form.imageUrl] : [];

  return (
    <DashboardLayout title="Admin Dashboard" links={ADMIN_LINKS}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-2xl space-y-1">
            <h1 className="text-xl font-bold text-gray-900">Curated areas</h1>
            <p className="text-sm text-gray-600">
              Hubs like Hatta or Jebel Jais power the Locations lens,{' '}
              <code className="text-xs">/destination/:slug</code>{' '}
              pages, and place linking. Add country and region first, then summary and hero image. Link places from{' '}
              <strong>Manage places</strong> or on <Link to="/admin/places" className="text-emerald-800 underline">Places</Link>.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium shrink-0"
          >
            + Add area
          </button>
        </div>

        {error && !modalOpen ? <p className="text-sm text-red-600">{error}</p> : null}

        <AdminFilterBar
          onClear={() => {
            setSearch('');
            setStatusFilter('');
            setCountryFilter('');
            setRegionFilter('');
            setPage(1);
          }}
        >
          <label className="text-xs text-neutral-500">
            Search
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Name, slug, region…"
              className={`${ADMIN_INPUT_CLASS} mt-1 block w-56`}
            />
          </label>
          <AppSelect
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}
            options={AREA_STATUS_FILTER_OPTIONS}
            placeholder="All statuses"
            inputClassName={ADMIN_FILTER_SELECT_CLASS}
            aria-label="Filter by status"
          />
          <AppSelect
            value={countryFilter}
            onChange={(value) => {
              setCountryFilter(value);
              setRegionFilter('');
              setPage(1);
            }}
            options={COUNTRY_OPTIONS}
            placeholder="All countries"
            inputClassName={ADMIN_FILTER_SELECT_CLASS}
            aria-label="Filter by country"
          />
          <AppSelect
            value={regionFilter}
            onChange={(value) => {
              setRegionFilter(value);
              setPage(1);
            }}
            options={filterRegionOptions.map((region) => ({ value: region, label: region }))}
            placeholder={countryFilter ? 'All regions' : 'Pick country first'}
            inputClassName={ADMIN_FILTER_SELECT_CLASS}
            aria-label="Filter by region"
            disabled={!countryFilter}
          />
        </AdminFilterBar>

        {loading ? (
          <p className="text-slate-500">Loading…</p>
        ) : (
          <div className="bg-white border rounded-lg overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3">Area</th>
                  <th className="text-left px-4 py-3">Region</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAreas.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                      {areas.length === 0 ? 'No areas yet — add your first hub.' : 'No areas match these filters.'}
                    </td>
                  </tr>
                ) : (
                  paginateRows(filteredAreas, page, pageSize).map((area) => (
                    <tr key={area.id} className="border-t hover:bg-gray-50">
                      <td className="admin-table-hit">
                        <button type="button" onClick={() => openEdit(area)}>
                          <span className="flex items-center gap-3">
                            {area.imageUrl ? (
                              <img src={area.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center text-lg">
                                📍
                              </div>
                            )}
                            <span>
                              <span className="block font-medium text-gray-900">{area.name}</span>
                              <span className="block text-xs text-gray-500">
                                /area/{area.slug} · p{area.priority}
                              </span>
                            </span>
                          </span>
                        </button>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{area.region}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            area.status === 'published'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {area.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          <AdminIconButton label="Edit" icon={Pencil} onClick={() => openEdit(area)} />
                          <AdminIconButton
                            label="Manage places"
                            icon={MapPin}
                            tone="emerald"
                            to={adminPlacesPath(area.id)}
                          />
                          <AdminIconButton
                            label="Delete"
                            icon={Trash2}
                            tone="red"
                            onClick={() => setConfirmDelete(area)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        <AdminTablePager
          page={page}
          pageSize={pageSize}
          total={filteredAreas.length}
          onPage={setPage}
          onPageSize={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      </div>

      {modalOpen ? (
        <AdminCatalogWizard
          title={editingId ? 'Edit area' : 'Add curated area'}
          steps={AREA_WIZARD_STEPS}
          stepIndex={wizardStep}
          onStepChange={setWizardStep}
          onClose={closeModal}
          onBack={() => setWizardStep((s) => Math.max(0, s - 1))}
          onNext={() => setWizardStep((s) => Math.min(AREA_WIZARD_STEPS.length - 1, s + 1))}
          onSave={() => void handleSave()}
          saving={saving}
          canNext={
            wizardStep === 0
              ? Boolean(form.countryCode && form.region.trim() && form.name.trim() && form.slug.trim())
              : wizardStep === 1
                ? form.latitude != null && form.longitude != null
                : true
          }
        >
          {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}
          {wizardStep === 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-neutral-700">Country *</label>
                  <AppSelect
                    value={form.countryCode}
                    onChange={(countryCode) =>
                      setForm((prev) => ({
                        ...prev,
                        countryCode: countryCode as CountryCode,
                        region: '',
                      }))
                    }
                    options={COUNTRY_OPTIONS}
                    inputClassName={ADMIN_SELECT_CLASS}
                    aria-label="Country"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-neutral-700">State / region *</label>
                  <AppSelect
                    value={form.region}
                    onChange={(region) => setForm((prev) => ({ ...prev, region }))}
                    options={regionOptions.map((region) => ({ value: region, label: region }))}
                    placeholder="Select region"
                    inputClassName={ADMIN_SELECT_CLASS}
                    aria-label="Region"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-neutral-700">Area name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    onBlur={handleNameBlur}
                    className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                    placeholder="e.g. Hatta"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-neutral-700">URL slug *</label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      setForm((prev) => ({ ...prev, slug: e.target.value }));
                    }}
                    className="w-full rounded-xl border border-neutral-200 px-3 py-2 font-mono text-sm"
                    placeholder="hatta"
                  />
                </div>
              </div>
            </div>
          ) : null}
          {wizardStep === 1 ? (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">Map center *</label>
                <MapPinPicker
                  latitude={form.latitude}
                  longitude={form.longitude}
                  onChange={(lat, lng) => setForm((prev) => ({ ...prev, latitude: lat, longitude: lng }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">Short description</label>
                <textarea
                  value={form.summary}
                  onChange={(e) => setForm((prev) => ({ ...prev, summary: e.target.value }))}
                  rows={3}
                  className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                  placeholder="What makes this zone special for outings?"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">Hero image</label>
                <ImageUpload
                  images={heroImages}
                  onChange={(urls) => setForm((prev) => ({ ...prev, imageUrl: urls[0] ?? null }))}
                  max={1}
                  keyPrefix="areas"
                  kind="location-image"
                  preset="location"
                />
              </div>
            </div>
          ) : null}
          {wizardStep === 2 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">Status</label>
                <AppSelect
                  value={form.status}
                  onChange={(status) => setForm((prev) => ({ ...prev, status: status as AreaStatus }))}
                  options={STATUS_OPTIONS}
                  inputClassName={ADMIN_SELECT_CLASS}
                  aria-label="Status"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">Sort priority</label>
                <input
                  type="number"
                  min={0}
                  max={9999}
                  value={form.priority}
                  onChange={(e) => setForm((prev) => ({ ...prev, priority: Number(e.target.value) || 0 }))}
                  className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                />
              </div>
            </div>
          ) : null}
        </AdminCatalogWizard>
      ) : null}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900">Delete {confirmDelete.name}?</h3>
            <p className="mt-2 text-sm text-gray-600">
              Places keep their IDs but lose this link until you assign another area. This cannot be undone.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmDelete(null)} className="px-4 py-2 text-sm rounded-lg hover:bg-gray-100">
                Cancel
              </button>
              <button type="button" onClick={() => void executeDelete()} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminDestinations;
