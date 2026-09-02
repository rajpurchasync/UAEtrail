import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ActivityDTO, ActivityDetailDTO, LocationDTO, TenantListDTO } from '@uaetrail/shared-types';
import { ACTIVITY_TYPE_GROUP_LABELS } from '../../config/activityTypes';
import { api } from '../../api/services';
import { getActiveTenantId, setActiveTenantId } from '../../api/tenant';
import { useAuth } from '../../context/AuthContext';
import {
  ActivityLocationPinField,
  FormTabBar,
  HostSelect,
  ImageUpload,
  LocationSelect,
  TimePicker,
} from '../ui';
import { countWords } from '../../utils/activityFormHelpers';
import { ActivityFormShell } from './ActivityFormShell';
import { ActivityTripPreviewOverlay } from './ActivityTripPreviewOverlay';
import {
  buildHostActivityPayload,
  emptyActivityForm,
  activityToForm,
  FORM_INPUT,
  FORM_LABEL,
  FORM_TEXTAREA,
  type ActivityFormState,
  type CarPoolPricing,
  type PricingMode,
} from './activityFormState';
import type { ActivityFormSessionSnapshot } from '../../utils/activityFormSessionStorage';
import { saveHikingDraft } from '../../utils/activityFormSessionStorage';
import { buildActivityDetailPreview } from '../../utils/buildActivityDetailPreview';
import { isBusinessHostOrg, isPlatformAdmin } from '../../utils/hostPermissions';

const STEPS = ['Summary', 'Participation', 'Location', 'Instructions', 'Additional'] as const;
const TOTAL_STEPS = STEPS.length;
const FITNESS_OPTIONS = ['Easy', 'Moderate', 'Hard', 'Expert'] as const;
const MIN_ABOUT_WORDS = 10;
const LOCATION_TABS = [
  { id: 'start', label: 'Hike start point' },
  { id: 'parking', label: 'Parking' },
  { id: 'meeting', label: 'Meeting point' },
] as const;
const INSTRUCTION_TABS = [
  { id: 'mandatory', label: 'Mandatory' },
  { id: 'recommendation', label: 'Recommendation' },
] as const;

export interface HikingActivityFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
  tenantId?: string;
  editingActivity?: ActivityDTO | null;
  hostOrganizations?: TenantListDTO[];
  venueLocations?: LocationDTO[];
  sessionSnapshot?: ActivityFormSessionSnapshot | null;
  onSessionChange?: (snapshot: ActivityFormSessionSnapshot) => void;
}

export const HikingActivityFormModal = ({
  open,
  onClose,
  onSaved,
  tenantId = '',
  editingActivity = null,
  hostOrganizations,
  venueLocations,
  sessionSnapshot,
  onSessionChange,
}: HikingActivityFormModalProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState<ActivityFormState>(() =>
    editingActivity ? activityToForm(editingActivity) : emptyActivityForm('hiking')
  );
  const [step, setStep] = useState(1);
  const [locationTab, setLocationTab] = useState<(typeof LOCATION_TABS)[number]['id']>('start');
  const [instructionTab, setInstructionTab] = useState<(typeof INSTRUCTION_TABS)[number]['id']>('mandatory');
  const [previewTrip, setPreviewTrip] = useState<ActivityDetailDTO | null>(null);
  const [draftActivityId, setDraftActivityId] = useState<string | null>(editingActivity?.id ?? null);
  const [saving, setSaving] = useState(false);
  const [previewReady, setPreviewReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tenantType, setTenantType] = useState<string>('guide_owned');
  const [venues, setVenues] = useState<LocationDTO[]>(venueLocations ?? []);
  const [pickerHostOrganizations, setPickerHostOrganizations] = useState<TenantListDTO[]>(
    hostOrganizations ?? []
  );
  const [resolvedTenantId, setResolvedTenantId] = useState(
    () => tenantId || getActiveTenantId() || sessionSnapshot?.tenantId || ''
  );
  const openInitialized = useRef(false);

  const isEdit = Boolean(editingActivity);
  const canPickHostOrganization = isPlatformAdmin(user?.role);
  const hostTenantId = canPickHostOrganization ? form.tenantId : resolvedTenantId;
  const isBusinessOrg = isBusinessHostOrg(tenantType);
  const venueAddHref = '/host/locations';

  const persistDraft = () => {
    if (!onSessionChange) return;
    saveHikingDraft(
      {
        form,
        step,
        locationTab,
        instructionTab,
        editingActivityId: editingActivity?.id ?? draftActivityId,
      },
      {
        open: true,
        tenantId: hostTenantId,
        activityType: 'hiking',
        editingActivityId: editingActivity?.id ?? draftActivityId,
      }
    );
    onSessionChange({
      open: true,
      activityType: 'hiking',
      tenantId: hostTenantId,
      editingActivityId: editingActivity?.id ?? draftActivityId,
      initialActivityType: null,
      hikingDraft: {
        form,
        step,
        locationTab,
        instructionTab,
        editingActivityId: editingActivity?.id ?? draftActivityId,
      },
    });
  };

  const handleAddVenue = () => {
    persistDraft();
    navigate(venueAddHref);
  };

  const set = (patch: Partial<ActivityFormState>) => setForm((prev) => ({ ...prev, ...patch }));
  const setPin = (key: 'start' | 'parking' | 'meeting', patch: Partial<ActivityFormState['start']>) =>
    setForm((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));

  useEffect(() => {
    if (!open || canPickHostOrganization) return;
    let disposed = false;

    const syncTenant = async () => {
      const known = tenantId || getActiveTenantId() || sessionSnapshot?.tenantId || '';
      if (known) {
        if (!disposed) setResolvedTenantId(known);
        return;
      }
      try {
        const res = await api.getMyTenants();
        if (disposed) return;
        const first = res.data[0]?.tenantId;
        if (first) {
          setActiveTenantId(first);
          setResolvedTenantId(first);
        }
      } catch {
        // ignore — save will retry resolution
      }
    };

    void syncTenant();
    return () => {
      disposed = true;
    };
  }, [open, canPickHostOrganization, tenantId, sessionSnapshot?.tenantId]);

  useEffect(() => {
    if (!open || !canPickHostOrganization) return;
    if (hostOrganizations?.length) {
      setPickerHostOrganizations(hostOrganizations);
      return;
    }
    let disposed = false;
    void api
      .getAdminTenants()
      .then((res) => {
        if (!disposed) setPickerHostOrganizations(res.data);
      })
      .catch(() => {
        if (!disposed) setPickerHostOrganizations([]);
      });
    return () => {
      disposed = true;
    };
  }, [open, canPickHostOrganization, hostOrganizations]);

  useEffect(() => {
    if (!open) {
      openInitialized.current = false;
      return;
    }
    if (openInitialized.current) return;
    openInitialized.current = true;

    const draft = sessionSnapshot?.hikingDraft;
    if (draft && !editingActivity) {
      setForm(draft.form);
      setStep(draft.step);
      setLocationTab(draft.locationTab as (typeof LOCATION_TABS)[number]['id']);
      setInstructionTab(draft.instructionTab as (typeof INSTRUCTION_TABS)[number]['id']);
      setDraftActivityId(draft.editingActivityId);
    } else {
      setForm(editingActivity ? activityToForm(editingActivity) : emptyActivityForm('hiking'));
      setStep(1);
      setLocationTab('start');
      setInstructionTab('mandatory');
      setDraftActivityId(editingActivity?.id ?? null);
    }
    setPreviewTrip(null);
    setPreviewReady(false);
    setError(null);
  }, [open, editingActivity, sessionSnapshot?.hikingDraft]);

  useEffect(() => {
    if (!open || !openInitialized.current) return;
    persistDraft();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- persist hiking draft on field changes
  }, [form, step, locationTab, instructionTab, open]);

  useEffect(() => {
    if (!open || !user?.id) return;
    setForm((prev) => (prev.hostUserId ? prev : { ...prev, hostUserId: user.id }));
  }, [open, user?.id]);

  useEffect(() => {
    if (!open || !hostTenantId) return;
    if (canPickHostOrganization) {
      const match = pickerHostOrganizations.find((t) => t.id === hostTenantId);
      if (match) setTenantType(match.type);
      return;
    }
    void api
      .getMyTenants()
      .then((res) => {
        const match = res.data.find((t) => t.tenantId === hostTenantId);
        if (match) setTenantType(match.tenantType);
      })
      .catch(() => undefined);
  }, [open, hostTenantId, canPickHostOrganization, pickerHostOrganizations]);

  useEffect(() => {
    if (!open) return;
    if (venueLocations) {
      setVenues(venueLocations);
      return;
    }
    if (canPickHostOrganization) {
      let disposed = false;
      void api
        .getAdminLocations()
        .then((res) => {
          if (!disposed) setVenues(res.data);
        })
        .catch(() => {
          if (!disposed) setVenues([]);
        });
      return () => {
        disposed = true;
      };
    }
    let disposed = false;
    void Promise.all([
      api.getPublicLocations(),
      hostTenantId
        ? api.getOrganizerSubmittedLocations(hostTenantId)
        : Promise.resolve({ data: [] as LocationDTO[] }),
    ])
      .then(([publicRes, pendingRes]) => {
        if (disposed) return;
        setVenues([...publicRes.data, ...pendingRes.data.filter((l) => l.status === 'draft')]);
      })
      .catch(() => {
        if (!disposed) setVenues([]);
      });
    return () => {
      disposed = true;
    };
  }, [open, hostTenantId, venueLocations, canPickHostOrganization]);

  const venueCenter = useMemo(() => {
    const venue = venues.find((v) => v.id === form.locationId);
    return venue?.latitude != null && venue?.longitude != null
      ? { lat: venue.latitude, lng: venue.longitude }
      : { lat: null, lng: null };
  }, [form.locationId, venues]);

  const titleWords = countWords(form.title);
  const aboutWords = countWords(form.description);

  const validateStep = (targetStep: number, mode: 'draft' | 'publish'): string | null => {
    if (targetStep >= 1) {
      if (!form.title.trim()) return 'Title is required.';
      if (titleWords > 5) return 'Title must be 5 words or fewer.';
      if (!form.locationId) return 'Select a venue.';
      if (mode === 'publish') {
        if (!form.date || !form.time) return 'Trip date and start time are required.';
        if (!form.description.trim()) return 'About trip is required.';
        if (aboutWords < MIN_ABOUT_WORDS) return `About trip must be at least ${MIN_ABOUT_WORDS} words.`;
        if (aboutWords > 100) return 'About trip must be 100 words or fewer.';
        if (form.images.length === 0) return 'Add a cover image.';
      }
      if (canPickHostOrganization && !form.tenantId) return 'Select a host organization.';
    }

    if (targetStep >= 2 && mode === 'publish') {
      if (form.capacity < 1) return 'Available spots must be at least 1.';
      if (form.pricingMode === 'shared') {
        if (form.sharedAmount <= 0) return 'Enter the shared cost amount.';
        if (!form.sharedCostInfo.trim()) return 'Let participants know why this cost is shared among participants.';
      }
      if (form.pricingMode === 'paid') {
        if (form.price <= 0) return 'Enter the trip price.';
        if (!form.paymentTerms.trim()) return 'Payment terms are required for paid trips.';
      }
    }

    if (targetStep >= 3 && mode === 'publish') {
      const hasStart =
        form.start.label.trim() || form.start.mapsUrl.trim() || (form.start.lat && form.start.lng);
      if (!hasStart) return 'Set a hike start point (map pin or Google Maps link).';
    }

    if (targetStep >= 5 && mode === 'publish' && form.carPoolEnabled) {
      if (form.carPoolSeats < 1) return 'Enter how many car pool seats are available.';
      if (form.carPoolPricing === 'shared' && form.carPoolSharedAmount <= 0) {
        return 'Enter the shared car pool amount.';
      }
    }

    return null;
  };

  const validateAll = (mode: 'draft' | 'publish') => {
    for (let s = 1; s <= TOTAL_STEPS; s++) {
      const err = validateStep(s, mode);
      if (err) return err;
    }
    return null;
  };

  const payloadForSave = () =>
    buildHostActivityPayload({
      ...form,
      hostUserId: form.hostUserId || user?.id || '',
    });

  const resolveActiveTenantId = async (): Promise<string> => {
    if (canPickHostOrganization) return form.tenantId;

    const known = [
      hostTenantId,
      tenantId,
      editingActivity?.tenantId,
      getActiveTenantId(),
      sessionSnapshot?.tenantId,
      form.tenantId,
    ].find((id) => Boolean(id?.trim()));

    if (known) {
      setActiveTenantId(known);
      setResolvedTenantId(known);
      return known;
    }

    const res = await api.getMyTenants();
    const first = res.data[0]?.tenantId ?? '';
    if (first) {
      setActiveTenantId(first);
      setResolvedTenantId(first);
      setForm((prev) => (prev.tenantId ? prev : { ...prev, tenantId: first }));
    }
    return first;
  };

  const saveDraftEvent = async (): Promise<ActivityDTO> => {
    const existingId = editingActivity?.id ?? draftActivityId;
    const activeTenant = await resolveActiveTenantId();

    if (!activeTenant) {
      throw new Error(
        canPickHostOrganization
          ? 'Select a host organization.'
          : 'No host organization found. Complete host setup first.'
      );
    }

    const payload = {
      ...payloadForSave(),
      activityType: 'hiking',
      hostId: form.hostUserId || user?.id || undefined,
    };

    if (existingId) {
      const res = await api.updateHostActivity(activeTenant, existingId, payload);
      setDraftActivityId(res.data.id);
      return res.data;
    }

    const res = await api.createHostActivity(activeTenant, payload);
    setDraftActivityId(res.data.id);
    return res.data;
  };

  const handleSave = async (mode: 'draft' | 'publish') => {
    const validationError = mode === 'publish' ? validateAll('publish') : validateStep(1, 'draft');
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const saved = await saveDraftEvent();
      const activityId = saved.id;

      if (mode === 'publish' && activityId && saved.status === 'draft') {
        const publishTenant = await resolveActiveTenantId();
        await api.publishHostActivity(publishTenant, activityId);
      }

      onSaved?.();
      if (mode === 'publish') {
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save activity');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndPreview = async () => {
    const validationError = validateAll('publish');
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const saved = await saveDraftEvent();
      let venue = venues.find((v) => v.id === form.locationId);
      if (!venue && form.locationId) {
        try {
          const locRes = await api.getPublicLocationDetail(form.locationId);
          venue = locRes.data;
        } catch {
          // use fallback location in preview builder
        }
      }
      const tenantName = canPickHostOrganization
        ? pickerHostOrganizations.find((t) => t.id === hostTenantId)?.name
        : (await api.getMyTenants().catch(() => ({ data: [] }))).data.find(
            (t) => t.tenantId === hostTenantId
          )?.tenantName;
      setPreviewTrip(buildActivityDetailPreview(form, saved, venue, user, tenantName));
      setPreviewReady(true);
      onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save preview');
    } finally {
      setSaving(false);
    }
  };

  const goNext = () => {
    if (step === 1) {
      const err = validateStep(1, 'draft');
      if (err) {
        setError(err);
        return;
      }
      if (!form.description.trim()) {
        setError('About trip is required.');
        return;
      }
      if (aboutWords < MIN_ABOUT_WORDS) {
        setError(`About trip must be at least ${MIN_ABOUT_WORDS} words.`);
        return;
      }
      if (form.images.length === 0) {
        setError('Add a cover image.');
        return;
      }
    }
    setError(null);
    setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  };

  const goBack = () => {
    setError(null);
    setStep((s) => Math.max(1, s - 1));
  };

  const goToStep = (target: number) => {
    if (target < step) {
      setError(null);
      setStep(target);
    }
  };

  if (!open) return null;

  const title = isEdit
    ? 'Edit hiking activity'
    : `Add ${ACTIVITY_TYPE_GROUP_LABELS.hiking.toLowerCase()} activity`;
  const isLastStep = step === TOTAL_STEPS;
  const isPublishedEdit = isEdit && editingActivity?.status === 'published';

  const locationTabs = (
    <FormTabBar
      tabs={[...LOCATION_TABS]}
      activeId={locationTab}
      onChange={(id) => setLocationTab(id as (typeof LOCATION_TABS)[number]['id'])}
    />
  );

  const instructionTabs = (
    <FormTabBar
      tabs={[...INSTRUCTION_TABS]}
      activeId={instructionTab}
      onChange={(id) => setInstructionTab(id as (typeof INSTRUCTION_TABS)[number]['id'])}
    />
  );

  const stepProgress = (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          Step {step} of {TOTAL_STEPS}
        </span>
        <span className="font-medium text-emerald-700">{STEPS[step - 1]}</span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full bg-emerald-600 transition-all duration-300"
          style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
        />
      </div>
      <div className="flex gap-1 overflow-x-auto pb-0.5">
        {STEPS.map((name, i) => {
          const stepNum = i + 1;
          const isActive = stepNum === step;
          const isComplete = stepNum < step;
          return (
            <button
              key={name}
              type="button"
              disabled={stepNum > step}
              onClick={() => goToStep(stepNum)}
              className={`flex items-center gap-1.5 shrink-0 px-2 py-1 rounded-md text-xs touch-manipulation ${
                isActive
                  ? 'bg-emerald-50 text-emerald-800 font-semibold'
                  : isComplete
                    ? 'text-gray-700 hover:bg-gray-100'
                    : 'text-gray-400 cursor-default'
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                  isActive
                    ? 'bg-emerald-600 text-white'
                    : isComplete
                      ? 'bg-gray-700 text-white'
                      : 'bg-gray-200 text-gray-500'
                }`}
              >
                {stepNum}
              </span>
              <span className="hidden sm:inline">{name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
    <ActivityFormShell
      wide
      title={title}
      onClose={onClose}
      progress={stepProgress}
      stickyTabs={step === 3 ? locationTabs : step === 4 ? instructionTabs : undefined}
      footer={
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3">
          <div className="flex justify-end gap-2 flex-wrap">
            {step > 1 && (
              <button
                type="button"
                onClick={goBack}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-white"
              >
                Back
              </button>
            )}
            {!isLastStep && (
              <button
                type="button"
                onClick={goNext}
                className="px-4 py-2 bg-emerald-600 text-white rounded-md text-sm font-medium hover:bg-emerald-700"
              >
                Next
              </button>
            )}
            {isLastStep && (
              <>
                {isPublishedEdit ? (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void handleSave('publish')}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-md text-sm font-medium hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {saving ? 'Saving…' : 'Save changes'}
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void handleSave('draft')}
                      className="px-4 py-2 border border-emerald-600 text-emerald-700 rounded-md text-sm font-medium hover:bg-emerald-50 disabled:opacity-60"
                    >
                      {saving ? 'Saving…' : 'Save as draft'}
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void handleSaveAndPreview()}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-800 hover:bg-white disabled:opacity-60"
                    >
                      {saving ? 'Saving…' : 'Save & preview'}
                    </button>
                    {previewReady && (
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => void handleSave('publish')}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-md text-sm font-medium hover:bg-emerald-700 disabled:opacity-60"
                      >
                        {saving ? 'Saving…' : 'Publish'}
                      </button>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {step === 1 && (
          <>
            <div>
              <label className={FORM_LABEL}>
                Title * <span className="text-gray-400 font-normal">({titleWords}/5 words)</span>
              </label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => set({ title: e.target.value })}
                className={FORM_INPUT}
                placeholder="e.g. Jebel Jais Sunrise Hike"
              />
            </div>

            <div>
              <label className={FORM_LABEL}>Venue *</label>
              <LocationSelect
                value={form.locationId}
                onChange={(locationId) => set({ locationId })}
                tenantId={hostTenantId || undefined}
                activityType="hiking"
                locations={venueLocations}
                required
                addNewHref={venueAddHref}
                addNewLabel="Add location"
                onAddNew={handleAddVenue}
              />
            </div>

            <div>
              <label className={FORM_LABEL}>Fitness level</label>
              <select
                value={form.fitnessLevel}
                onChange={(e) => set({ fitnessLevel: e.target.value })}
                className={FORM_INPUT}
              >
                <option value="">Select level…</option>
                {FITNESS_OPTIONS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>

            {canPickHostOrganization && pickerHostOrganizations.length > 0 && (
              <div>
                <label className={FORM_LABEL}>Host organization *</label>
                <select
                  required
                  value={form.tenantId}
                  onChange={(e) => set({ tenantId: e.target.value })}
                  className={FORM_INPUT}
                >
                  <option value="">Select organization…</option>
                  {pickerHostOrganizations.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {canPickHostOrganization && hostTenantId && (
              <HostSelect
                tenantId={hostTenantId}
                value={form.hostUserId}
                onChange={(hostUserId) => set({ hostUserId })}
              />
            )}

            <div className="grid grid-cols-2 gap-3 items-end">
              <div className="min-w-0">
                <label className={FORM_LABEL}>Trip date *</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => set({ date: e.target.value })}
                  className={`${FORM_INPUT} min-h-[44px] text-base touch-manipulation`}
                />
              </div>
              <div className="min-w-0">
                <label className={FORM_LABEL}>Start time *</label>
                <TimePicker
                  value={form.time}
                  onChange={(time) => set({ time })}
                  required
                  className="w-full"
                />
              </div>
            </div>

            {editingActivity?.status === 'published' && (
              <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                Changing the start date or time will notify all confirmed participants.
              </p>
            )}

            <div>
              <label className={FORM_LABEL}>
                About trip *{' '}
                <span className="text-gray-400 font-normal">
                  ({aboutWords}/{MIN_ABOUT_WORDS} min, 100 max words)
                </span>
              </label>
              <textarea
                value={form.description}
                onChange={(e) => set({ description: e.target.value })}
                className={FORM_TEXTAREA}
                rows={5}
                placeholder="What will participants experience? (at least 10 words)"
                required
              />
            </div>

            <div>
              <label className={FORM_LABEL}>Cover image *</label>
              <ImageUpload
                images={form.images}
                onChange={(images) => set({ images: images.slice(0, 1) })}
                max={1}
                keyPrefix="activities"
                tenantId={hostTenantId || undefined}
                kind="activity-image"
                preset="activity"
              />
            </div>
          </>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Set how people can join and what it costs.</p>

            <div>
              <label className={FORM_LABEL}>Available spots *</label>
              <input
                type="number"
                min={1}
                value={form.capacity}
                onChange={(e) => set({ capacity: Number(e.target.value) })}
                className={FORM_INPUT}
              />
            </div>

            <div>
              <label className={FORM_LABEL}>Pricing</label>
              <div className="flex flex-wrap gap-2">
                {(['free', 'shared', 'paid'] as PricingMode[]).map((mode) => {
                  const disabled = mode === 'paid' && !isBusinessOrg;
                  return (
                    <button
                      key={mode}
                      type="button"
                      disabled={disabled}
                      onClick={() => set({ pricingMode: mode })}
                      className={`px-3 py-1.5 rounded-md text-sm border ${
                        form.pricingMode === mode
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      } disabled:opacity-40 disabled:cursor-not-allowed`}
                    >
                      {mode === 'free' ? 'Free' : mode === 'shared' ? 'Cost Shared' : 'Professional Paid trip'}
                    </button>
                  );
                })}
              </div>
              {form.pricingMode === 'paid' && !isBusinessOrg && (
                <p className="text-xs text-gray-500 mt-1">Paid trips are available for business organizers only.</p>
              )}
            </div>

            {form.pricingMode === 'shared' && (
              <div className="space-y-3 rounded-lg border border-gray-200 p-4 bg-gray-50/50">
                <div>
                  <label className={FORM_LABEL}>Shared amount (AED) *</label>
                  <input
                    type="number"
                    min={1}
                    value={form.sharedAmount || ''}
                    onChange={(e) => set({ sharedAmount: Number(e.target.value) })}
                    className={FORM_INPUT}
                  />
                </div>
                <div>
                  <label className={FORM_LABEL}>
                    Let participants know why this cost is shared among participants *
                  </label>
                  <textarea
                    value={form.sharedCostInfo}
                    onChange={(e) => set({ sharedCostInfo: e.target.value })}
                    className={FORM_INPUT}
                    rows={2}
                    placeholder="e.g. Covers transport and park entry, split evenly among hikers…"
                  />
                </div>
              </div>
            )}

            {form.pricingMode === 'paid' && isBusinessOrg && (
              <div className="space-y-3 rounded-lg border border-gray-200 p-4 bg-gray-50/50">
                <div>
                  <label className={FORM_LABEL}>Price (AED) *</label>
                  <input
                    type="number"
                    min={1}
                    value={form.price || ''}
                    onChange={(e) => set({ price: Number(e.target.value) })}
                    className={FORM_INPUT}
                  />
                </div>
                <div>
                  <label className={FORM_LABEL}>Payment terms *</label>
                  <textarea
                    value={form.paymentTerms}
                    onChange={(e) => set({ paymentTerms: e.target.value })}
                    className={FORM_INPUT}
                    rows={2}
                    placeholder="How and when participants pay (off-platform)…"
                  />
                </div>
              </div>
            )}

            <div className="rounded-lg border border-gray-200 p-4 bg-gray-50/50 space-y-3">
              <p className={FORM_LABEL}>Participation rules</p>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.noChildren}
                    onChange={(e) => set({ noChildren: e.target.checked })}
                    className="rounded border-gray-300 text-emerald-600"
                  />
                  No children
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.noPets}
                    onChange={(e) => set({ noPets: e.target.checked })}
                    className="rounded border-gray-300 text-emerald-600"
                  />
                  No pets
                </label>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Drop a pin on the map or paste a Google Maps link for each location.
            </p>
            <div className="pt-2">
              {locationTab === 'start' && (
                <ActivityLocationPinField
                  label="Hike start point"
                  hideLabel
                  value={form.start}
                  onChange={(patch) => setPin('start', patch)}
                  centerLat={venueCenter.lat}
                  centerLng={venueCenter.lng}
                  required
                />
              )}
              {locationTab === 'parking' && (
                <ActivityLocationPinField
                  label="Parking"
                  hideLabel
                  value={form.parking}
                  onChange={(patch) => setPin('parking', patch)}
                  centerLat={venueCenter.lat}
                  centerLng={venueCenter.lng}
                />
              )}
              {locationTab === 'meeting' && (
                <ActivityLocationPinField
                  label="Meeting point"
                  hideLabel
                  value={form.meeting}
                  onChange={(patch) => setPin('meeting', patch)}
                  centerLat={venueCenter.lat}
                  centerLng={venueCenter.lng}
                />
              )}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Participants must accept mandatory instructions when requesting to join.
            </p>

            {instructionTab === 'mandatory' && (
              <div className="space-y-4 pt-2">
                <div>
                  <label className={FORM_LABEL}>What to bring *</label>
                  <div className="space-y-2">
                    {form.whatToBringItems.map((item, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => {
                            const next = [...form.whatToBringItems];
                            next[i] = e.target.value;
                            set({ whatToBringItems: next });
                          }}
                          className={FORM_INPUT}
                          placeholder={`Item ${i + 1}`}
                        />
                        {form.whatToBringItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              set({
                                whatToBringItems: form.whatToBringItems.filter((_, idx) => idx !== i),
                              })
                            }
                            className="text-sm text-red-600 shrink-0 px-2"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => set({ whatToBringItems: [...form.whatToBringItems, ''] })}
                      className="text-sm text-emerald-700 font-medium hover:underline"
                    >
                      + Add new
                    </button>
                  </div>
                </div>

                <div>
                  <label className={FORM_LABEL}>Instructions</label>
                  <textarea
                    value={form.mandatoryInstructions}
                    onChange={(e) => set({ mandatoryInstructions: e.target.value })}
                    className={FORM_TEXTAREA}
                    rows={6}
                    placeholder="Safety rules, meeting protocol, pace expectations…"
                  />
                </div>
              </div>
            )}

            {instructionTab === 'recommendation' && (
              <div className="pt-2">
                <label className={FORM_LABEL}>Additional requirements</label>
                <textarea
                  value={form.additionalRequirements}
                  onChange={(e) => set({ additionalRequirements: e.target.value })}
                  className={FORM_TEXTAREA}
                  rows={8}
                  placeholder="Optional recommendations — gear suggestions, fitness tips, weather notes…"
                />
              </div>
            )}
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <label className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 p-4 bg-gray-50/50 cursor-pointer">
              <div>
                <p className="text-sm font-medium text-gray-900">Car pool available</p>
                <p className="text-xs text-gray-500 mt-0.5">Let participants share rides to the trailhead.</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={form.carPoolEnabled}
                onClick={() => set({ carPoolEnabled: !form.carPoolEnabled })}
                className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors ${
                  form.carPoolEnabled ? 'bg-emerald-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
                    form.carPoolEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </label>

            {form.carPoolEnabled && (
              <div className="space-y-4 rounded-lg border border-gray-200 p-4">
                <div>
                  <label className={FORM_LABEL}>Available seats *</label>
                  <input
                    type="number"
                    min={1}
                    value={form.carPoolSeats || ''}
                    onChange={(e) => set({ carPoolSeats: Number(e.target.value) })}
                    className={FORM_INPUT}
                    placeholder="e.g. 3"
                  />
                </div>
                <div>
                  <label className={FORM_LABEL}>Car pool pricing</label>
                  <div className="flex flex-wrap gap-2">
                    {(['free', 'shared'] as CarPoolPricing[]).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => set({ carPoolPricing: mode })}
                        className={`px-3 py-1.5 rounded-md text-sm border ${
                          form.carPoolPricing === mode
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {mode === 'free' ? 'Free' : 'Shared'}
                      </button>
                    ))}
                  </div>
                </div>

                {form.carPoolPricing === 'shared' && (
                  <div>
                    <label className={FORM_LABEL}>Amount per seat (AED) *</label>
                    <input
                      type="number"
                      min={1}
                      value={form.carPoolSharedAmount || ''}
                      onChange={(e) => set({ carPoolSharedAmount: Number(e.target.value) })}
                      className={FORM_INPUT}
                    />
                  </div>
                )}

                <div>
                  <label className={FORM_LABEL}>Details (optional)</label>
                  <textarea
                    value={form.carPoolDetails}
                    onChange={(e) => set({ carPoolDetails: e.target.value })}
                    className={FORM_TEXTAREA}
                    rows={4}
                    placeholder="e.g. 3 seats available, meet at Mall of Emirates…"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>
        )}
      </div>
    </ActivityFormShell>

    {previewTrip && (
      <ActivityTripPreviewOverlay trip={previewTrip} onClose={() => setPreviewTrip(null)} />
    )}
    </>
  );
};
