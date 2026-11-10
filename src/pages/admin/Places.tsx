import { useState, useCallback, useMemo, useEffect } from 'react';
import { useSafeAsyncEffect } from '../../hooks/useSafeAsyncEffect';
import {
  type AreaDTO,
  FACILITY_PLACE_KINDS,
  PLACE_KIND_LABELS,
  PlaceDTO,
  facilityPlaceKindPinEmoji,
  placeDetailPath,
  placeKindFromLocationRow,
  tagsForPlaceKind,
  type PlaceKind,
  resolveCatalogSubmitterUserId,
} from '@uaetrail/shared-types';
import { adminCatalogSegmentForRow, type AdminCatalogSegment } from '../../place/adminCatalogSegment';
import { Link, useSearchParams } from 'react-router-dom';
import {
  createAdminFacility,
  createAdminPlace,
  deleteAdminFacility,
  deleteAdminPlace,
  fetchAdminAreas,
  fetchAdminFacilitiesCatalog,
  fetchAdminPlacesCatalog,
  updateAdminFacility,
  updateAdminPlace,
} from '../../hooks/adminConsoleApi';
import { AdminTablePager, DEFAULT_ADMIN_PAGE_SIZE, paginateRows, type AdminPageSize } from '../../components/admin/AdminTablePager';
import { AdminIconButton } from '../../components/admin/AdminIconButton';
import { DashboardLayout } from '../../components/layout';
import { ADMIN_LINKS } from '../../constants';
import { Check, Pencil, Power, Trash2 } from 'lucide-react';
import { MapPinPicker } from '../../components/ui/MapPinPicker';
import { ImageUpload } from '../../components/ui';
import { AssetKeyUpload } from '../../components/ui/AssetKeyUpload';
import { AppSelect, ADMIN_INPUT_CLASS, ADMIN_SELECT_CLASS } from '../../components/ui/AppSelect';
import { SubmissionsQueue } from '../../components/admin/SubmissionsQueue';

/* ─── Constants ──────────────────────────────────────────────────────────── */

const HIKING_SURFACES = ['Stairs', 'Boulders', 'Steep hike', 'Rocks', 'Sandy', 'Gravel'];
const CAMPING_SURFACES = ['Sand', 'Grass', 'Rocky', 'Mixed terrain'];
const HIKING_ACCESSIBLE = ['4X4 required', 'Any cars', 'Bike'];
const CAMPING_ACCESSIBLE = ['4X4 required', 'Any cars'];
const TAG_OPTIONS = ['Child-free', 'Pet-friendly', 'Family-friendly', 'Solo-friendly', 'Wheelchair-accessible', 'Night-hiking', 'Sunrise spot', 'Sunset spot'];
import { SUPPORTED_COUNTRIES, DEFAULT_COUNTRY, getRegionsForCountry, CountryCode } from '../../config/regions';
import { ADMIN_AREAS_PATH } from '../../config/adminSurfacePaths';
import { VENUE_TYPE_LABELS } from '../../config/activityTypes';
const SEASONS = ['winter', 'spring', 'summer', 'autumn', 'year-round'];

const COUNTRY_OPTIONS = SUPPORTED_COUNTRIES.map((country) => ({
  value: country.code,
  label: country.label,
}));

const LOCATION_STATUS_OPTIONS = [
  { value: 'draft' as const, label: 'Draft' },
  { value: 'active' as const, label: 'Active (Published)' },
  { value: 'inactive' as const, label: 'Inactive' },
];

const isTrailLike = (type?: PlaceDTO['activityType']) =>
  type === 'hiking' || type === 'event';

const activityTypeLabel = (type: PlaceDTO['activityType']) => {
  if (type === 'hiking') return `🥾 ${VENUE_TYPE_LABELS.hiking}`;
  if (type === 'event') return `🏃 ${VENUE_TYPE_LABELS.event}`;
  if (type === 'shop') return '🛍️ Shop (community pin)';
  return `⛺ ${VENUE_TYPE_LABELS.camping}`;
};

const activityTypeBadgeClass = (type: PlaceDTO['activityType']) => {
  if (type === 'hiking') return 'bg-emerald-50 text-emerald-700';
  if (type === 'event') return 'bg-violet-50 text-violet-700';
  if (type === 'shop') return 'bg-orange-50 text-orange-800';
  return 'bg-amber-50 text-amber-700';
};

const emptyForm: Partial<PlaceDTO> = {
  name: '', region: '', activityType: 'hiking', description: '', difficulty: 'moderate',
  season: ['winter'], childFriendly: false, maxGroupSize: 20, accessibility: 'car-accessible',
  images: [], featured: false, status: 'draft', distance: undefined, duration: undefined,
  elevation: undefined, campingType: undefined, latitude: null, longitude: null,
  highlights: [], surfaceType: [], tags: [], parkingLink: '', accessibleBy: [], countryCode: DEFAULT_COUNTRY,
  gpxKey: null, guidePdfKey: null, guideMarkdown: '', guidePreview: '', unlockPriceAed: 29
};

/* ─── Component ──────────────────────────────────────────────────────────── */

const isCatalogMapPlace = (loc: Pick<PlaceDTO, 'tags'>): boolean =>
  loc.tags?.includes('catalog-import') ?? false;

type PlacesProps = {
  catalogSegment?: AdminCatalogSegment;
};

/** Admin console for places (trails, camps, event venues). Canonical route: `/admin/places`. */
export const Places = ({ catalogSegment = 'outdoor' }: PlacesProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const filterAreaId = searchParams.get('areaId')?.trim() || null;
  const [places, setPlaces] = useState<PlaceDTO[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<AdminPageSize>(DEFAULT_ADMIN_PAGE_SIZE);
  const [form, setForm] = useState<Partial<PlaceDTO>>(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [highlightInput, setHighlightInput] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'hiking' | 'camping' | 'event'>('all');
  const [search, setSearch] = useState('');
  const [confirmAction, setConfirmAction] = useState<{ type: 'status' | 'delete' | 'publish'; loc: PlaceDTO } | null>(null);
  const [previewLoc, setPreviewLoc] = useState<PlaceDTO | null>(null);
  const [formStep, setFormStep] = useState(0); // 0=type select, 1=form
  const [adminAreas, setAdminAreas] = useState<AreaDTO[]>([]);

  const loadPlaces = async (isActive: () => boolean = () => true) => {
    setLoading(true);
    try {
      const all: PlaceDTO[] = [];
      let nextPage = 1;
      let catalogTotal = Number.POSITIVE_INFINITY;
      while (all.length < catalogTotal && nextPage <= 50) {
        const catalog =
          catalogSegment === 'facility'
            ? await fetchAdminFacilitiesCatalog(nextPage, 100)
            : await fetchAdminPlacesCatalog(nextPage, 100);
        if (!isActive()) return;
        all.push(...catalog.items);
        catalogTotal = catalog.total;
        if (catalog.items.length === 0) break;
        nextPage += 1;
      }
      setError(null);
      setPlaces(all);
    } catch (err) {
      if (!isActive()) return;
      setError(err instanceof Error ? err.message : 'Failed to load places');
    } finally {
      if (isActive()) setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [catalogSegment, activeTab, search, filterAreaId]);

  useSafeAsyncEffect((isActive) => loadPlaces(isActive), [catalogSegment]);

  useSafeAsyncEffect(async (isActive) => {
    try {
      const areas = await fetchAdminAreas();
      if (isActive()) setAdminAreas(areas);
    } catch {
      if (isActive()) setAdminAreas([]);
    }
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      areaId: filterAreaId ?? undefined,
      region: filterArea?.region ?? emptyForm.region,
      countryCode: (filterArea?.countryCode as CountryCode) ?? emptyForm.countryCode,
    });
    setHighlightInput('');
    setFormStep(0);
    setModalOpen(true);
  };

  const openEdit = (loc: PlaceDTO) => {
    setEditingId(loc.id);
    setForm({ ...loc });
    setHighlightInput((loc.highlights ?? []).join(', '));
    setFormStep(1);
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setEditingId(null); setError(null); };

  const selectType = (type: 'hiking' | 'camping' | 'event') => {
    setForm({ ...emptyForm, activityType: type });
    setFormStep(1);
  };

  const selectFacilityType = (kind: PlaceKind) => {
    setForm({
      ...emptyForm,
      activityType: 'event',
      tags: tagsForPlaceKind(kind),
    });
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
        ...(form.activityType === 'hiking' || form.activityType === 'event' ? { campingType: undefined } : {})
      };
      if (catalogSegment === 'facility') {
        if (editingId) {
          await updateAdminFacility(editingId, payload);
        } else {
          await createAdminFacility(payload);
        }
      } else if (editingId) {
        await updateAdminPlace(editingId, payload);
      } else {
        await createAdminPlace(payload);
      }
      closeModal(); await loadPlaces();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save place');
    } finally {
      setSaving(false);
    }
  };

  const canApprove = (loc: Partial<PlaceDTO>) => {
    const hikingOk =
      (loc.activityType !== 'hiking' && loc.activityType !== 'event') || Boolean(loc.difficulty);
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
        if (catalogSegment === 'facility') {
          await updateAdminFacility(confirmAction.loc.id, { status: 'active' });
        } else {
          await updateAdminPlace(confirmAction.loc.id, { status: 'active' });
        }
      } else if (confirmAction.type === 'status') {
        const newStatus = confirmAction.loc.status === 'active' ? 'inactive' : 'active';
        if (catalogSegment === 'facility') {
          await updateAdminFacility(confirmAction.loc.id, { status: newStatus });
        } else {
          await updateAdminPlace(confirmAction.loc.id, { status: newStatus });
        }
      } else if (catalogSegment === 'facility') {
        await deleteAdminFacility(confirmAction.loc.id);
      } else {
        await deleteAdminPlace(confirmAction.loc.id);
      }
      setConfirmAction(null); await loadPlaces();
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

  const filterArea = filterAreaId
    ? adminAreas.find((area) => area.id === filterAreaId) ?? null
    : null;

  const filtered = places
    .filter((l) => adminCatalogSegmentForRow(l) === catalogSegment)
    .filter((l) => {
      if (filterAreaId && l.areaId !== filterAreaId) return false;
      if (activeTab === 'pending') return l.status === 'draft';
      if (activeTab === 'all') return true;
      if (catalogSegment === 'facility') return true;
      return l.activityType === activeTab;
    })
    .filter((l) => !search || l.name.toLowerCase().includes(search.toLowerCase()) || l.region.toLowerCase().includes(search.toLowerCase()));
  const pagedPlaces = paginateRows(filtered, page, pageSize);

  const areaNameById = useMemo(
    () => new Map(adminAreas.map((area) => [area.id, area.name])),
    [adminAreas]
  );

  const segmentPlaces = useMemo(
    () => places.filter((l) => adminCatalogSegmentForRow(l) === catalogSegment),
    [places, catalogSegment]
  );

  const hikingCount = segmentPlaces.filter((l) => l.activityType === 'hiking').length;
  const campingCount = segmentPlaces.filter((l) => l.activityType === 'camping').length;
  const communityActivityCount = segmentPlaces.filter((l) => l.activityType === 'event').length;
  const pendingCount = segmentPlaces.filter((l) => l.status === 'draft').length;
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
    <DashboardLayout
      title={catalogSegment === 'facility' ? 'Admin · Facilities' : 'Admin Dashboard'}
      links={ADMIN_LINKS}
    >
      <div className="space-y-4">
        <SubmissionsQueue />
        <p className="text-sm text-gray-600 max-w-3xl">
          Curated explore pins can be corrected here — open <strong>Edit</strong>, move the map pin, and update name,
          region, and description. Saves refresh the map and are kept when the JSON catalog is re-imported.
        </p>
        {filterArea ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
            <span>
              Showing places in <strong>{filterArea.name}</strong> — link more via Edit → Curated area, or add a new place below.
            </span>
            <div className="flex gap-2">
              <Link to={ADMIN_AREAS_PATH} className="text-emerald-900 underline font-medium">
                All areas
              </Link>
              <button
                type="button"
                onClick={() => setSearchParams({})}
                className="text-emerald-900 underline font-medium"
              >
                Clear filter
              </button>
            </div>
          </div>
        ) : null}
        {/* Tabs + Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button onClick={() => setActiveTab('all')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
              All ({segmentPlaces.length})
            </button>
            <button onClick={() => setActiveTab('pending')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'pending' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
              Pending ({pendingCount})
            </button>
            {catalogSegment === 'outdoor' ? (
              <>
                <button onClick={() => setActiveTab('hiking')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'hiking' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
                  🥾 Hiking ({hikingCount})
                </button>
                <button onClick={() => setActiveTab('camping')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'camping' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
                  ⛺ Camping ({campingCount})
                </button>
                <button onClick={() => setActiveTab('event')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'event' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
                  🏃 Events ({communityActivityCount})
                </button>
              </>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search name or region..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`${ADMIN_INPUT_CLASS} w-52`}
            />
            <button onClick={openCreate} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium">
              {catalogSegment === 'facility' ? '+ Add facility' : '+ Add Place'}
            </button>
          </div>
        </div>

        {error && !modalOpen && <p className="text-sm text-red-600">{error}</p>}

        {/* Table */}
        <div className="bg-white border rounded-lg overflow-x-auto desktop-scrollbar-x">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3">Place name</th>
                <th className="text-left px-4 py-3">Region</th>
                <th className="text-left px-4 py-3">Area</th>
                <th className="text-left px-4 py-3">Type</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  <div className="inline-block w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mr-2" />Loading...
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No places found</td></tr>
              ) : pagedPlaces.map((loc) => (
                <tr key={loc.id} className="border-t hover:bg-gray-50 cursor-pointer"
                  onClick={() => setPreviewLoc(loc)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {loc.images?.[0] ? (
                        <img src={loc.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-lg">
                          {loc.activityType === 'hiking' ? '🥾' : loc.activityType === 'event' ? '🏃' : '⛺'}
                        </div>
                      )}
                      <span className="font-medium text-gray-900">{loc.name}</span>
                      {isCatalogMapPlace(loc) && (
                        <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-900">
                          Map catalog
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{loc.region}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {loc.areaId ? (
                      <>
                        {areaNameById.get(loc.areaId) ?? loc.areaName ?? '—'}
                        {loc.areaStatus === 'draft' ||
                        adminAreas.find((area) => area.id === loc.areaId)?.status === 'draft' ? (
                          <span className="ml-1 font-semibold text-amber-800">(new)</span>
                        ) : null}
                      </>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {catalogSegment === 'facility' ? (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-sky-50 text-sky-900">
                        {facilityPlaceKindPinEmoji(placeKindFromLocationRow(loc))}{' '}
                        {PLACE_KIND_LABELS[placeKindFromLocationRow(loc)]}
                      </span>
                    ) : (
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${activityTypeBadgeClass(loc.activityType)}`}>
                        {activityTypeLabel(loc.activityType)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">{statusBadge(loc.status)}</td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-1.5 flex-wrap">
                      <AdminIconButton label="Edit" icon={Pencil} onClick={() => openEdit(loc)} />
                      {loc.status === 'draft' && (
                        <AdminIconButton
                          label="Approve"
                          icon={Check}
                          tone="emerald"
                          onClick={() => setConfirmAction({ type: 'publish', loc })}
                        />
                      )}
                      {loc.status !== 'draft' && (
                        <AdminIconButton
                          label={loc.status === 'active' ? 'Deactivate' : 'Activate'}
                          icon={Power}
                          tone={loc.status === 'active' ? 'gray' : 'green'}
                          onClick={() => setConfirmAction({ type: 'status', loc })}
                        />
                      )}
                      <AdminIconButton
                        label="Delete"
                        icon={Trash2}
                        tone="red"
                        onClick={() => setConfirmAction({ type: 'delete', loc })}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <AdminTablePager
          page={page}
          pageSize={pageSize}
          total={filtered.length}
          onPage={setPage}
          onPageSize={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
        <p className="text-xs text-gray-500">
          Click a row to preview{catalogSegment === 'facility' ? ' a facility' : ' a place'}.
        </p>
      </div>

      {/* ─── Preview Modal ─────────────────────────────────────────────────── */}
      {previewLoc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setPreviewLoc(null)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {previewLoc.images?.[0] && (
              <img src={previewLoc.images[0]} alt="" className="w-full h-48 object-cover rounded-t-lg" />
            )}
            {(previewLoc.images?.length ?? 0) > 1 && (
              <div className="flex gap-2 overflow-x-auto px-4 py-2 border-b bg-gray-50">
                {previewLoc.images!.map((src, index) => (
                  <img
                    key={`${src}-${index}`}
                    src={src}
                    alt=""
                    className="h-16 w-24 shrink-0 rounded object-cover border border-gray-200"
                  />
                ))}
              </div>
            )}
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">{previewLoc.name}</h2>
                <button onClick={() => setPreviewLoc(null)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
              </div>
              <div className="flex gap-2 flex-wrap">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${activityTypeBadgeClass(previewLoc.activityType)}`}>
                  {activityTypeLabel(previewLoc.activityType)}
                </span>
                {statusBadge(previewLoc.status)}
                {previewLoc.difficulty && <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 capitalize">{previewLoc.difficulty}</span>}
              </div>
              <p className="text-sm text-gray-500">{previewLoc.region}</p>
              {previewLoc.latitude != null && previewLoc.longitude != null && (
                <p className="text-xs text-gray-500">
                  Map pin: {previewLoc.latitude.toFixed(5)}, {previewLoc.longitude.toFixed(5)}
                </p>
              )}
              {resolveCatalogSubmitterUserId(previewLoc) && (
                <p className="text-xs text-gray-500">
                  Submitted by member: {resolveCatalogSubmitterUserId(previewLoc)}
                </p>
              )}
              <p className="text-sm text-gray-700 whitespace-pre-line">{previewLoc.description}</p>
              {isTrailLike(previewLoc.activityType) && (
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
              <div className="flex flex-wrap gap-3 pt-2 border-t">
                <Link
                  to={placeDetailPath(previewLoc.activityType, previewLoc.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 text-emerald-800 font-medium"
                >
                  Open as submitter preview ↗
                </Link>
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
              {confirmAction.type === 'delete' ? 'Delete place?' : confirmAction.type === 'publish' ? 'Approve place?' : confirmAction.loc.status === 'active' ? 'Deactivate place?' : 'Activate place?'}
            </h3>
            <p className="text-sm text-gray-600 mb-1">
              {confirmAction.type === 'delete'
                ? 'This will permanently remove the place.'
                : confirmAction.type === 'publish'
                  ? 'Approving makes it public. Ensure difficulty (hikes), child/pet tags, and parking are complete.'
                  : confirmAction.loc.status === 'active'
                    ? 'This will hide the place.'
                    : 'This will make the place visible.'}
            </p>
            {(confirmAction.type === 'publish' ||
              (confirmAction.type === 'status' && confirmAction.loc.status !== 'active')) &&
            (confirmAction.loc.areaStatus === 'draft' ||
              adminAreas.find((area) => area.id === confirmAction.loc.areaId)?.status === 'draft') ? (
              <p className="mb-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950">
                This place is linked to a <span className="font-semibold">new area</span>
                {confirmAction.loc.areaName ? ` (${confirmAction.loc.areaName})` : ''}. Approving
                will also publish that area on Explore.
              </p>
            ) : null}
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
                {editingId
                  ? 'Edit place'
                  : formStep === 0
                    ? 'Select Activity Type'
                    : form.activityType === 'hiking'
                      ? '🥾 Add Hiking Trail'
                      : form.activityType === 'event'
                        ? `🏃 Add ${VENUE_TYPE_LABELS.event}`
                        : '⛺ Add camping place'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>

            {/* ── Step 0: Type Selection ── */}
            {formStep === 0 && !editingId && catalogSegment === 'facility' && (
              <div className="p-6">
                <p className="text-sm text-gray-600 mb-4 text-center">Choose facility type</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-3xl mx-auto">
                  {FACILITY_PLACE_KINDS.map((kind) => (
                    <button
                      key={kind}
                      type="button"
                      onClick={() => selectFacilityType(kind)}
                      className="border-2 border-gray-200 hover:border-emerald-400 rounded-xl p-4 text-center transition-all hover:shadow-md"
                    >
                      <div className="text-3xl mb-1">{facilityPlaceKindPinEmoji(kind)}</div>
                      <p className="text-sm font-semibold text-gray-900">{PLACE_KIND_LABELS[kind]}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {formStep === 0 && !editingId && catalogSegment === 'outdoor' && (
              <div className="p-8">
                <p className="text-sm text-gray-600 mb-6 text-center">Choose what type of place you want to add</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
                  <button onClick={() => selectType('hiking')}
                    className="border-2 border-gray-200 hover:border-emerald-400 rounded-xl p-8 text-center transition-all hover:shadow-md group">
                    <div className="text-5xl mb-3">🥾</div>
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-emerald-700">Hiking Trail</h3>
                    <p className="text-xs text-gray-500 mt-1">Trails, mountains, walks</p>
                  </button>
                  <button onClick={() => selectType('camping')}
                    className="border-2 border-gray-200 hover:border-amber-400 rounded-xl p-8 text-center transition-all hover:shadow-md group">
                    <div className="text-5xl mb-3">⛺</div>
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-amber-700">Camping place</h3>
                    <p className="text-xs text-gray-500 mt-1">Campsites, outdoor stays</p>
                  </button>
                  <button onClick={() => selectType('event')}
                    className="border-2 border-gray-200 hover:border-violet-400 rounded-xl p-8 text-center transition-all hover:shadow-md group">
                    <div className="text-5xl mb-3">🏃</div>
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-violet-700">{VENUE_TYPE_LABELS.event}</h3>
                    <p className="text-xs text-gray-500 mt-1">Trail runs, triathlons, races</p>
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 1: Dynamic Form ── */}
            {(formStep === 1 || editingId) && (
              <form onSubmit={handleSave} className="p-6 space-y-6">
                {form.status === 'draft' && resolveCatalogSubmitterUserId(form) && (
                  <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-900">
                    Host submission — add child-friendly / pet-friendly tags, parking link or map pin, and difficulty (hikes) before approving.
                  </div>
                )}

                {/* Section 1: Basic Info */}
                <fieldset className="space-y-4">
                  <legend className="text-sm font-semibold text-gray-800 uppercase tracking-wide border-b pb-1 w-full">
                    {isTrailLike(form.activityType) ? '1. Trail Information' : '1. Place information'}
                  </legend>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">
                        {isTrailLike(form.activityType) ? 'Trail Title' : 'Place title'} *
                      </label>
                      <input type="text" required value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder={
                          form.activityType === 'event'
                            ? 'e.g. RAK Trail Run Course'
                            : isTrailLike(form.activityType)
                              ? 'e.g. Jebel Jais Summit Trail'
                              : 'e.g. Al Qudra Desert Camp'
                        } />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Country</label>
                      <AppSelect
                        value={form.countryCode ?? DEFAULT_COUNTRY}
                        onChange={(countryCode) =>
                          setForm({ ...form, countryCode: countryCode as CountryCode, region: '' })
                        }
                        options={COUNTRY_OPTIONS}
                        inputClassName={ADMIN_SELECT_CLASS}
                        aria-label="Country"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">State / Region *</label>
                      <AppSelect
                        value={form.region ?? ''}
                        onChange={(region) => setForm({ ...form, region })}
                        options={regionOptions.map((region) => ({ value: region, label: region }))}
                        placeholder="Select a region"
                        inputClassName={ADMIN_SELECT_CLASS}
                        aria-label="State or region"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Curated area</label>
                      <AppSelect
                        value={form.areaId ?? ''}
                        onChange={(areaId) => setForm({ ...form, areaId: areaId || null })}
                        options={adminAreas.map((area) => ({
                          value: area.id,
                          label: `${area.name} · ${area.region}${
                            area.status === 'draft' ? ' (new — not published yet)' : ''
                          }`,
                        }))}
                        placeholder="Link to Hatta, Jebel Jais, …"
                        inputClassName={ADMIN_SELECT_CLASS}
                        aria-label="Curated area"
                      />
                      {adminAreas.find((area) => area.id === form.areaId)?.status === 'draft' ? (
                        <p className="mt-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950">
                          This place is linked to a new area. Approving the place will also publish
                          that area on Explore.
                        </p>
                      ) : (
                        <p className="mt-1 text-xs text-gray-500">
                          Hosting picks inherit this area when hosts choose this place from the registry.
                        </p>
                      )}
                    </div>
                  </div>

                  {isTrailLike(form.activityType) && (
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
                      {isTrailLike(form.activityType) ? 'About the Trail' : 'About the place'} *
                    </label>
                    <textarea required value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      rows={5} maxLength={3000}
                      placeholder={
                        form.activityType === 'event'
                          ? 'Describe the event course, terrain, race format...'
                          : isTrailLike(form.activityType)
                            ? 'Describe the trail, terrain, highlights...'
                            : 'Describe the camping place, amenities, surroundings...'
                      } />
                    <p className="text-xs text-gray-400 mt-1">{(form.description?.length ?? 0)}/3000 characters (approx. 500 words)</p>
                  </div>
                </fieldset>

                {/* Section 2: Conditions */}
                <fieldset className="space-y-4">
                  <legend className="text-sm font-semibold text-gray-800 uppercase tracking-wide border-b pb-1 w-full">2. Conditions</legend>

                  <ChipSelect
                    label="Surface Type"
                    options={isTrailLike(form.activityType) ? HIKING_SURFACES : CAMPING_SURFACES}
                    selected={form.surfaceType ?? []}
                    onChange={(item) => toggleArrayItem('surfaceType', item)}
                  />

                  {isTrailLike(form.activityType) && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Suitable for *</label>
                      <div className="flex gap-3">
                        {[{ value: 'easy', label: 'Beginner friendly' }, { value: 'moderate', label: 'Intermediate' }, { value: 'hard', label: 'Expert only' }].map((opt) => (
                          <button key={opt.value} type="button"
                            onClick={() => setForm({ ...form, difficulty: opt.value as PlaceDTO['difficulty'] })}
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
                      preset="location"
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
                    options={isTrailLike(form.activityType) ? HIKING_ACCESSIBLE : CAMPING_ACCESSIBLE}
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
                      <AppSelect
                        value={form.status ?? 'draft'}
                        onChange={(status) => setForm({ ...form, status: status as PlaceDTO['status'] })}
                        options={LOCATION_STATUS_OPTIONS}
                        inputClassName={ADMIN_SELECT_CLASS}
                        aria-label="Place status"
                      />
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
                      Featured on discover (Near you)
                    </label>
                  </div>
                  {editingId && isCatalogMapPlace(form) && (
                    <p className="text-sm text-sky-900 bg-sky-50 border border-sky-100 rounded-lg px-3 py-2">
                      This pin is on the explore map catalog. Drag the marker to the real trailhead or camp spot, then
                      save — your coordinates won&apos;t be overwritten by a catalog import.
                    </p>
                  )}
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
                      {saving ? 'Saving...' : editingId ? 'Update place' : form.status === 'draft' ? 'Save Draft' : 'Publish place'}
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
