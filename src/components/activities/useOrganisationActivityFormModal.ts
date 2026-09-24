import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ActivityDTO, ActivityDetailDTO, PlaceDTO, TenantListDTO } from '@uaetrail/shared-types';
import type { ActivityType } from '../../config/activityTypes';
import { api } from '../../api/index';
import { getActiveTenantId, setActiveTenantId } from '../../api/tenant';
import { useAuth } from '../../context/AuthContext';
import { useReloadExploreMap } from '../../hooks/useReloadExploreMap';
import { countWords } from '../../utils/activityFormHelpers';
import { buildActivityDetailPreview } from '../../utils/buildActivityDetailPreview';
import { resolveEventVenueLocationId } from '../../utils/eventVenue';
import { isBusinessHostOrg, isPlatformAdmin } from '../../utils/hostPermissions';
import type { ActivityFormSessionSnapshot } from '../../utils/activityFormSessionStorage';
import {
  activityToForm,
  buildHostActivityPayload,
  emptyActivityForm,
  type ActivityFormState,
} from './activityFormState';
import { validateActivityFormStep, validateActivityFormStepNavigation, validateAllActivityFormSteps } from './activityFormValidation';
import type { InstructionTabId } from './activityFormSteps';

export type ActivityDraftSnapshot = {
  form: ActivityFormState;
  step: number;
  locationTab: string;
  instructionTab: string;
  editingActivityId: string | null;
};

export interface UseOrganisationActivityFormModalOptions {
  open: boolean;
  activityType: ActivityType;
  tenantId?: string;
  editingActivity?: ActivityDTO | null;
  hostTenants?: TenantListDTO[];
  /** Approved places available when scheduling. */
  placeOptions?: PlaceDTO[];
  /** @deprecated Use placeOptions */
  venueLocations?: PlaceDTO[];
  sessionSnapshot?: ActivityFormSessionSnapshot | null;
  draftFromSession?: ActivityDraftSnapshot | null;
  onSessionChange?: (snapshot: ActivityFormSessionSnapshot) => void;
  onSaved?: () => void;
  onClose: () => void;
  persistDraft: (draft: ActivityDraftSnapshot, hostTenantId: string) => void;
}

export const useOrganisationActivityFormModal = ({
  open,
  activityType,
  tenantId = '',
  editingActivity = null,
  hostTenants,
  placeOptions,
  venueLocations,
  sessionSnapshot,
  draftFromSession,
  onSessionChange,
  onSaved,
  onClose,
  persistDraft,
}: UseOrganisationActivityFormModalOptions) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const reloadExploreMap = useReloadExploreMap();
  const [form, setForm] = useState<ActivityFormState>(() =>
    editingActivity ? activityToForm(editingActivity) : emptyActivityForm(activityType)
  );
  const [step, setStep] = useState(1);
  const [locationTab, setLocationTab] = useState('start');
  const [instructionTab, setInstructionTab] = useState<InstructionTabId>('mandatory');
  const [previewActivity, setPreviewActivity] = useState<ActivityDetailDTO | null>(null);
  const [draftActivityId, setDraftActivityId] = useState<string | null>(editingActivity?.id ?? null);
  const [saving, setSaving] = useState(false);
  const [previewReady, setPreviewReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tenantType, setTenantType] = useState<string>('guide_owned');
  const injectedPlaceOptions = placeOptions ?? venueLocations;
  const [places, setPlaces] = useState<PlaceDTO[]>(injectedPlaceOptions ?? []);
  const [pickerHostTenants, setPickerHostTenants] = useState<TenantListDTO[]>(
    hostTenants ?? []
  );
  const [resolvedTenantId, setResolvedTenantId] = useState(
    () => tenantId || getActiveTenantId() || sessionSnapshot?.tenantId || ''
  );
  const lastInitSignature = useRef<string | null>(null);
  const openSessionId = useRef(0);
  const initialDraftRef = useRef(draftFromSession);

  const initSignature = editingActivity
    ? `edit:${editingActivity.id}`
    : `create:${openSessionId.current}:${activityType}`;

  const isEdit = Boolean(editingActivity);
  const canPickHostTenant = isPlatformAdmin(user?.role);
  const hostTenantId = canPickHostTenant ? form.tenantId : resolvedTenantId;
  const isBusinessOrg = isBusinessHostOrg(tenantType);
  const venueAddHref = '/host/places';

  const validationOptions = { activityType, canPickHostTenant };

  const set = (patch: Partial<ActivityFormState>) => setForm((prev) => ({ ...prev, ...patch }));
  const setPin = (
    key: 'start' | 'parking' | 'meeting' | 'carPoolFrom' | 'carPoolTo',
    patch: Partial<ActivityFormState['start']>
  ) =>
    setForm((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));

  const handleAddVenue = () => {
    if (!onSessionChange) {
      navigate(venueAddHref);
      return;
    }
    persistDraft(
      {
        form,
        step,
        locationTab,
        instructionTab,
        editingActivityId: editingActivity?.id ?? draftActivityId,
      },
      hostTenantId
    );
    navigate(venueAddHref);
  };

  useEffect(() => {
    if (!open || canPickHostTenant) return;
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
        // ignore
      }
    };
    void syncTenant();
    return () => {
      disposed = true;
    };
  }, [open, canPickHostTenant, tenantId, sessionSnapshot?.tenantId]);

  useEffect(() => {
    if (!open || !canPickHostTenant) return;
    if (hostTenants?.length) {
      setPickerHostTenants(hostTenants);
      return;
    }
    let disposed = false;
    void api
      .getAdminTenants()
      .then((res) => {
        if (!disposed) setPickerHostTenants(res.data);
      })
      .catch(() => {
        if (!disposed) setPickerHostTenants([]);
      });
    return () => {
      disposed = true;
    };
  }, [open, canPickHostTenant, hostTenants]);

  useEffect(() => {
    if (!open) {
      lastInitSignature.current = null;
      openSessionId.current += 1;
      initialDraftRef.current = draftFromSession;
      setPreviewActivity(null);
      setPreviewReady(false);
      return;
    }
    if (lastInitSignature.current === initSignature) return;
    lastInitSignature.current = initSignature;

    const sessionDraft = initialDraftRef.current;

    if (editingActivity) {
      setForm(activityToForm(editingActivity));
      setStep(1);
      setLocationTab('start');
      setInstructionTab('mandatory');
      setDraftActivityId(editingActivity.id);
      setPreviewActivity(null);
      setPreviewReady(false);
    } else if (sessionDraft) {
      setForm(sessionDraft.form);
      setStep(sessionDraft.step);
      setLocationTab(sessionDraft.locationTab);
      setInstructionTab(sessionDraft.instructionTab as InstructionTabId);
      setDraftActivityId(sessionDraft.editingActivityId);
    } else {
      setForm(emptyActivityForm(activityType));
      setStep(1);
      setLocationTab('start');
      setInstructionTab('mandatory');
      setDraftActivityId(null);
    }
    setError(null);
  }, [open, initSignature, editingActivity, activityType]);

  useEffect(() => {
    if (!open || activityType !== 'event') return;
    const locationId = editingActivity?.locationId ?? form.locationId;
    if (!locationId) return;

    let disposed = false;
    void api.getPublicPlaceDetail(locationId).then((res) => {
      if (disposed) return;
      const loc = res.data;
      setForm((prev) => ({
        ...prev,
        locationId: loc.id,
        eventEmirate: loc.emirate ?? prev.eventEmirate,
        eventState: loc.region ?? prev.eventState,
        eventVenueDetail: prev.eventVenueDetail || loc.description || loc.name,
      }));
    }).catch(() => undefined);

    return () => {
      disposed = true;
    };
  }, [open, activityType, editingActivity?.locationId]);

  useEffect(() => {
    if (!open || !onSessionChange || lastInitSignature.current === null) return;
    persistDraft(
      {
        form,
        step,
        locationTab,
        instructionTab,
        editingActivityId: editingActivity?.id ?? draftActivityId,
      },
      hostTenantId
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, step, locationTab, instructionTab, open, hostTenantId]);

  useEffect(() => {
    if (!open || !user?.id) return;
    setForm((prev) => (prev.hostUserId ? prev : { ...prev, hostUserId: user.id }));
  }, [open, user?.id]);

  useEffect(() => {
    if (!open || !hostTenantId) return;
    if (canPickHostTenant) {
      const match = pickerHostTenants.find((t) => t.id === hostTenantId);
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
  }, [open, hostTenantId, canPickHostTenant, pickerHostTenants]);

  useEffect(() => {
    if (!open) return;
    if (injectedPlaceOptions) {
      setPlaces(injectedPlaceOptions);
      return;
    }
    if (canPickHostTenant) {
      let disposed = false;
      void api
        .getAdminPlaces()
        .then((res) => {
          if (!disposed) setPlaces(res.data);
        })
        .catch(() => {
          if (!disposed) setPlaces([]);
        });
      return () => {
        disposed = true;
      };
    }
    let disposed = false;
    void Promise.all([
      api.getPublicPlaces(),
      hostTenantId
        ? api.getOrganisationSubmittedPlaces(hostTenantId)
        : Promise.resolve({ data: [] as PlaceDTO[] }),
    ])
      .then(([publicRes, pendingRes]) => {
        if (disposed) return;
        setPlaces([...publicRes.data, ...pendingRes.data.filter((l) => l.status === 'draft')]);
      })
      .catch(() => {
        if (!disposed) setPlaces([]);
      });
    return () => {
      disposed = true;
    };
  }, [open, hostTenantId, injectedPlaceOptions, canPickHostTenant]);

  const placeCenter = useMemo(() => {
    const place = places.find((v) => v.id === form.locationId);
    return place?.latitude != null && place?.longitude != null
      ? { lat: place.latitude, lng: place.longitude }
      : { lat: null, lng: null };
  }, [form.locationId, places]);

  const titleWords = countWords(form.title);
  const aboutWords = countWords(form.description);

  const resolveActiveTenantId = async (): Promise<string> => {
    if (canPickHostTenant) return form.tenantId;

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
        canPickHostTenant
          ? 'Select a host.'
          : 'No host profile found. Complete host setup first.'
      );
    }

    let formForSave = form;
    if (activityType === 'event') {
      if (!form.locationId && form.images.length === 0) {
        throw new Error('Add a cover image before saving the event.');
      }
      const locationId = await resolveEventVenueLocationId(activeTenant, form);
      if (locationId !== form.locationId) {
        formForSave = { ...form, locationId };
        setForm(formForSave);
      }
    }

    const payload = {
      ...buildHostActivityPayload({
        ...formForSave,
        hostUserId: formForSave.hostUserId || user?.id || '',
      }),
      activityType,
      hostId: formForSave.hostUserId || user?.id || undefined,
    };

    if (existingId) {
      const res = await api.updateOrganisationActivity(activeTenant, existingId, payload);
      setDraftActivityId(res.data.id);
      return res.data;
    }

    const res = await api.createOrganisationActivity(activeTenant, payload);
    setDraftActivityId(res.data.id);
    return res.data;
  };

  const handleSave = async (mode: 'draft' | 'publish') => {
    const validationError =
      mode === 'publish'
        ? validateAllActivityFormSteps(form, 'publish', validationOptions)
        : validateActivityFormStep(form, 1, 'draft', validationOptions);
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
        await api.publishOrganisationActivity(publishTenant, activityId);
        await reloadExploreMap();
      }

      onSaved?.();
      if (mode === 'publish') onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save activity');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndPreview = async () => {
    const validationError = validateAllActivityFormSteps(form, 'publish', validationOptions);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const saved = await saveDraftEvent();
      let place = places.find((v) => v.id === form.locationId);
      if (!place && form.locationId) {
        try {
          const locRes = await api.getPublicPlaceDetail(form.locationId);
          place = locRes.data;
        } catch {
          // fallback in preview builder
        }
      }
      const tenantName = canPickHostTenant
        ? pickerHostTenants.find((t) => t.id === hostTenantId)?.name
        : (await api.getMyTenants().catch(() => ({ data: [] }))).data.find(
            (t) => t.tenantId === hostTenantId
          )?.tenantName;
      const activity = buildActivityDetailPreview(form, saved, place, user, tenantName);
      setPreviewActivity(activity);
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
      const err = validateActivityFormStepNavigation(form, 1, validationOptions);
      if (err) {
        setError(err);
        return;
      }
    }
    setError(null);
    setStep((s) => Math.min(5, s + 1));
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

  return {
    form,
    step,
    locationTab,
    setLocationTab,
    instructionTab,
    setInstructionTab,
    previewActivity,
    setPreviewActivity,
    saving,
    previewReady,
    error,
    places,
    /** @deprecated Use placeCenter */
    venueCenter: placeCenter,
    placeCenter,
    titleWords,
    aboutWords,
    isEdit,
    isBusinessOrg,
    canPickHostTenant,
    hostTenantId,
    pickerHostTenants,
    venueAddHref,
    placeOptions: places,
    /** @deprecated Use placeOptions */
    venueLocations: places,
    set,
    setPin,
    handleAddVenue,
    handleSave,
    handleSaveAndPreview,
    goNext,
    goBack,
    goToStep,
    editingActivity,
  };
};

/** @deprecated Use {@link useOrganisationActivityFormModal}. */
export const useHostActivityFormModal = useOrganisationActivityFormModal;

/** @deprecated Use {@link UseOrganisationActivityFormModalOptions}. */
export type UseHostActivityFormModalOptions = UseOrganisationActivityFormModalOptions;
