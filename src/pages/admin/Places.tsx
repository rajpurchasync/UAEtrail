import { useState, useMemo, useEffect, useCallback } from 'react';
import { PlaceDTO, type PlaceKind, resolveCatalogSubmitterUserId } from '@uaetrail/shared-types';
import { adminCatalogSegmentForRow, type AdminCatalogSegment } from '../../place/adminCatalogSegment';
import { Link, useSearchParams } from 'react-router-dom';
import {
  createAdminFacility,
  createAdminPlace,
  deleteAdminFacility,
  deleteAdminPlace,
  updateAdminFacility,
  updateAdminPlace,
} from '../../hooks/adminConsoleApi';
import {
  useAdminCatalogSubmitterPreview,
  useAdminDestinationsCatalog,
  useAdminPlacesCatalogAll,
} from '../../hooks/useAdminConsoleQueries';
import { DEFAULT_ADMIN_PAGE_SIZE, paginateRows, type AdminPageSize } from '../../components/admin/AdminTablePager';
import { DashboardLayout } from '../../components/layout';
import { ADMIN_LINKS } from '../../constants';
import { AppSelect, ADMIN_FILTER_SELECT_CLASS, ADMIN_INPUT_CLASS } from '../../components/ui/AppSelect';
import { AdminFilterBar } from '../../components/admin/AdminFilterBar';
import { DEFAULT_COUNTRY, getRegionsForCountry, type CountryCode } from '../../config/regions';
import { ADMIN_DESTINATIONS_PATH, ADMIN_INBOX_SUBMISSIONS_PATH } from '../../config/adminSurfacePaths';
import { AdminCatalogWizard } from '../../components/admin/AdminCatalogWizard';
import { LOCATION_TYPE_LABELS } from '../../config/activityTypes';
import {
  PLACE_DETAIL_STEPS,
  PLACE_STATUS_FILTER_OPTIONS,
  FEATURED_FILTER_OPTIONS,
  activityTypeLabel,
  buildCreateFacilityForm,
  canApprovePlaceDraft,
  emptyPlaceForm,
  parseOptionalNumberInput,
} from '../../place/admin/adminPlacesCatalogConstants';
import { AdminPlacesCatalogConfirmModal, type AdminPlacesConfirmAction } from '../../place/admin/AdminPlacesCatalogConfirmModal';
import { AdminPlacesCatalogEditWizard } from '../../place/admin/AdminPlacesCatalogEditWizard';
import { AdminPlacesCatalogPreviewModal } from '../../place/admin/AdminPlacesCatalogPreviewModal';
import { AdminPlacesCatalogTable } from '../../place/admin/AdminPlacesCatalogTable';
import { AdminPlacesCatalogTypeSelectModal } from '../../place/admin/AdminPlacesCatalogTypeSelectModal';

type PlacesProps = {
  catalogSegment?: AdminCatalogSegment;
};

/** Admin console for places (trails, camps, event venues). Canonical route: `/admin/places`. */
export const Places = ({ catalogSegment = 'outdoor' }: PlacesProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const filterAreaId = searchParams.get('destinationId')?.trim() || null;
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<AdminPageSize>(DEFAULT_ADMIN_PAGE_SIZE);
  const [form, setForm] = useState<Partial<PlaceDTO>>(emptyPlaceForm);
  /** String drafts so number inputs keep caret/decimals (avoid Number() remounting to 0). */
  const [distanceInput, setDistanceInput] = useState('');
  const [elevationInput, setElevationInput] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const {
    data: places = [],
    isPending: loading,
    error: loadError,
    refetch: refetchPlaces,
  } = useAdminPlacesCatalogAll(catalogSegment);
  const { data: adminAreas = [] } = useAdminDestinationsCatalog();
  const error =
    actionError ??
    (loadError instanceof Error ? loadError.message : loadError ? 'Failed to load places' : null);
  const [highlightInput, setHighlightInput] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'hiking' | 'camping' | 'event'>('all');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [featuredFilter, setFeaturedFilter] = useState('');
  const [confirmAction, setConfirmAction] = useState<AdminPlacesConfirmAction | null>(null);
  const [previewLoc, setPreviewLoc] = useState<PlaceDTO | null>(null);
  const [formStep, setFormStep] = useState(0); // 0=type select, 1=form
  const [detailStep, setDetailStep] = useState(0);
  const submitterId = previewLoc ? resolveCatalogSubmitterUserId(previewLoc) : null;
  const { data: previewSubmitter = null } = useAdminCatalogSubmitterPreview(submitterId);

  useEffect(() => {
    setPage(1);
  }, [catalogSegment, activeTab, search, filterAreaId]);

  const resetTrailStatInputs = (distance?: number | null, elevation?: number | null) => {
    setDistanceInput(distance != null && Number.isFinite(distance) ? String(distance) : '');
    setElevationInput(elevation != null && Number.isFinite(elevation) ? String(elevation) : '');
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({
      ...emptyPlaceForm,
      destinationId: filterAreaId ?? undefined,
      region: filterArea?.region ?? emptyPlaceForm.region,
      countryCode: (filterArea?.countryCode as CountryCode) ?? emptyPlaceForm.countryCode,
    });
    setHighlightInput('');
    resetTrailStatInputs();
    setFormStep(0);
    setModalOpen(true);
  };

  const openEdit = (loc: PlaceDTO) => {
    setEditingId(loc.id);
    setForm({ ...loc });
    setHighlightInput((loc.highlights ?? []).join(', '));
    resetTrailStatInputs(loc.distance, loc.elevation);
    setFormStep(1);
    setDetailStep(0);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setDetailStep(0);
    setActionError(null);
  };

  const selectType = (type: 'hiking' | 'camping' | 'event') => {
    setForm({ ...emptyPlaceForm, activityType: type });
    resetTrailStatInputs();
    setDetailStep(0);
    setFormStep(1);
  };

  const selectFacilityType = (kind: PlaceKind) => {
    setForm(buildCreateFacilityForm(kind));
    resetTrailStatInputs();
    setDetailStep(0);
    setFormStep(1);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.images || form.images.length === 0) { setActionError('At least 1 photo is required'); return; }
    setSaving(true); setActionError(null);
    try {
      const distance = parseOptionalNumberInput(distanceInput);
      const elevation = parseOptionalNumberInput(elevationInput);
      const payload = {
        ...form,
        images: form.images ?? [],
        highlights: highlightInput.split(',').map((s) => s.trim()).filter(Boolean),
        season: form.season?.length ? form.season : ['winter'],
        distance,
        elevation,
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
      closeModal(); setActionError(null);
      await refetchPlaces();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to save place');
    } finally {
      setSaving(false);
    }
  };

  const executeConfirmAction = async () => {
    if (!confirmAction) return;
    try {
      if (confirmAction.type === 'publish') {
        if (!canApprovePlaceDraft(confirmAction.loc)) {
          setActionError('Complete difficulty (hikes), parking link or map pin before approving.');
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
      setConfirmAction(null); setActionError(null);
      await refetchPlaces();
    } catch (err) { setActionError(err instanceof Error ? err.message : 'Action failed'); setConfirmAction(null); }
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

  const regionFilterOptions = useMemo(() => {
    const regions = new Set(
      places
        .filter((l) => adminCatalogSegmentForRow(l) === catalogSegment)
        .map((l) => l.region)
        .filter(Boolean)
    );
    return [...regions].sort().map((region) => ({ value: region, label: region }));
  }, [places, catalogSegment]);

  const filtered = places
    .filter((l) => adminCatalogSegmentForRow(l) === catalogSegment)
    .filter((l) => {
      if (filterAreaId && l.destinationId !== filterAreaId) return false;
      if (activeTab === 'pending') return l.status === 'draft';
      if (activeTab === 'all') return true;
      if (catalogSegment === 'facility') return true;
      return l.activityType === activeTab;
    })
    .filter((l) => {
      if (statusFilter && l.status !== statusFilter) return false;
      if (regionFilter && l.region !== regionFilter) return false;
      if (featuredFilter === 'yes' && !l.featured) return false;
      if (featuredFilter === 'no' && l.featured) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return l.name.toLowerCase().includes(q) || l.region.toLowerCase().includes(q);
    });
  const pagedPlaces = paginateRows(filtered, page, pageSize);

  const areaNameById = useMemo(
    () => new Map(adminAreas.map((area) => [area.id, area.name])),
    [adminAreas]
  );

  const segmentPlaces = useMemo(
    () => places.filter((l) => adminCatalogSegmentForRow(l) === catalogSegment),
    [places, catalogSegment]
  );

  const parentPlaceHubOptions = useMemo(() => {
    if (catalogSegment !== 'outdoor') return [];
    const destinationId = form.destinationId?.trim() || null;
    return segmentPlaces
      .filter((row) => {
        if (editingId && row.id === editingId) return false;
        if (row.parentPlaceId?.trim()) return false;
        if (destinationId && row.destinationId !== destinationId) return false;
        return true;
      })
      .map((row) => ({
        value: row.id,
        label: `${row.name} · ${activityTypeLabel(row.activityType)}`,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [catalogSegment, editingId, form.destinationId, segmentPlaces]);

  const hikingCount = segmentPlaces.filter((l) => l.activityType === 'hiking').length;
  const campingCount = segmentPlaces.filter((l) => l.activityType === 'camping').length;
  const communityActivityCount = segmentPlaces.filter((l) => l.activityType === 'event').length;
  const pendingCount = segmentPlaces.filter((l) => l.status === 'draft').length;
  const regionOptions = getRegionsForCountry((form.countryCode as CountryCode) ?? DEFAULT_COUNTRY);

  return (
    <DashboardLayout
      title={catalogSegment === 'facility' ? 'Admin · Facilities' : 'Admin Dashboard'}
      links={ADMIN_LINKS}
    >
      <div className="space-y-4">
        <Link
          to={ADMIN_INBOX_SUBMISSIONS_PATH}
          className="block rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-950 hover:bg-amber-50"
        >
          Review member map suggestions in <span className="font-semibold">Inbox → Submissions</span>
        </Link>
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
              <Link to={ADMIN_DESTINATIONS_PATH} className="text-emerald-900 underline font-medium">
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
          <button onClick={openCreate} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium">
            {catalogSegment === 'facility' ? '+ Add facility' : '+ Add Place'}
          </button>
        </div>

        <AdminFilterBar
          onClear={() => {
            setSearch('');
            setStatusFilter('');
            setRegionFilter('');
            setFeaturedFilter('');
            setPage(1);
          }}
        >
          <label className="text-xs text-neutral-500">
            Search
            <input
              type="search"
              placeholder="Name or region…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className={`${ADMIN_INPUT_CLASS} mt-1 block w-52`}
            />
          </label>
          <AppSelect
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}
            options={PLACE_STATUS_FILTER_OPTIONS}
            placeholder="All statuses"
            inputClassName={ADMIN_FILTER_SELECT_CLASS}
            aria-label="Filter by status"
          />
          <AppSelect
            value={regionFilter}
            onChange={(value) => {
              setRegionFilter(value);
              setPage(1);
            }}
            options={regionFilterOptions}
            placeholder="All regions"
            inputClassName={ADMIN_FILTER_SELECT_CLASS}
            aria-label="Filter by region"
          />
          <AppSelect
            value={featuredFilter}
            onChange={(value) => {
              setFeaturedFilter(value);
              setPage(1);
            }}
            options={FEATURED_FILTER_OPTIONS}
            placeholder="Featured: any"
            inputClassName={ADMIN_FILTER_SELECT_CLASS}
            aria-label="Filter by featured"
          />
        </AdminFilterBar>

        {error && !modalOpen && <p className="text-sm text-red-600">{error}</p>}

<AdminPlacesCatalogTable
          catalogSegment={catalogSegment}
          loading={loading}
          filtered={filtered}
          pagedPlaces={pagedPlaces}
          areaNameById={areaNameById}
          adminAreas={adminAreas}
          page={page}
          pageSize={pageSize}
          onPage={setPage}
          onPageSize={setPageSize}
          onPreview={setPreviewLoc}
          onEdit={openEdit}
          onConfirmAction={setConfirmAction}
        />
      </div>

      {previewLoc ? (
        <AdminPlacesCatalogPreviewModal
          previewLoc={previewLoc}
          previewSubmitter={previewSubmitter}
          onClose={() => setPreviewLoc(null)}
          onEdit={openEdit}
        />
      ) : null}

      {confirmAction ? (
        <AdminPlacesCatalogConfirmModal
          confirmAction={confirmAction}
          adminAreas={adminAreas}
          onCancel={() => setConfirmAction(null)}
          onConfirm={() => void executeConfirmAction()}
        />
      ) : null}

      {modalOpen && formStep === 0 && !editingId ? (
        <AdminPlacesCatalogTypeSelectModal
          catalogSegment={catalogSegment}
          onClose={closeModal}
          onSelectOutdoor={selectType}
          onSelectFacility={selectFacilityType}
        />
      ) : null}

      {modalOpen && (formStep === 1 || editingId) ? (
        <AdminCatalogWizard
          title={
            editingId
              ? 'Edit place'
              : form.activityType === 'hiking'
                ? 'Add hiking trail'
                : form.activityType === 'event'
                  ? `Add ${LOCATION_TYPE_LABELS.event}`
                  : 'Add camping place'
          }
          steps={PLACE_DETAIL_STEPS}
          stepIndex={detailStep}
          onStepChange={setDetailStep}
          onClose={closeModal}
          onBack={() => {
            if (detailStep === 0 && !editingId) setFormStep(0);
            else setDetailStep((s) => Math.max(0, s - 1));
          }}
          onNext={() => setDetailStep((s) => Math.min(PLACE_DETAIL_STEPS.length - 1, s + 1))}
          onSave={() => {
            const fakeEvent = { preventDefault() {} } as React.FormEvent;
            void handleSave(fakeEvent);
          }}
          saving={saving}
        >
          <AdminPlacesCatalogEditWizard
            catalogSegment={catalogSegment}
            form={form}
            setForm={setForm}
            editingId={editingId}
            detailStep={detailStep}
            distanceInput={distanceInput}
            setDistanceInput={setDistanceInput}
            elevationInput={elevationInput}
            setElevationInput={setElevationInput}
            highlightInput={highlightInput}
            setHighlightInput={setHighlightInput}
            handleMapChange={handleMapChange}
            toggleArrayItem={toggleArrayItem}
            parentPlaceHubOptions={parentPlaceHubOptions}
            regionOptions={regionOptions}
            adminAreas={adminAreas}
            segmentPlaces={segmentPlaces}
            error={error}
          />
        </AdminCatalogWizard>
      ) : null}
    </DashboardLayout>
  );
};
