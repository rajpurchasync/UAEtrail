import type {
  AvailabilityEngagementTerms,
  AvailabilitySlotCapacity,
  AvailabilityVisibility,
  ExploreComposeWire,
  IntentFixedComposeKind,
  MemberAvailabilityDTO,
  MemberAvailabilitySlotDTO,
  ScheduleModality,
  UpsertMemberAvailabilityInput,
} from '@uaetrail/shared-types';
import { defaultGuideEngagementTerms, discoveryModalitiesFromSlots } from '@uaetrail/shared-types';
import {
  isScheduleModality,
  normalizeMemberAvailabilitySlotsForStorage,
} from '@uaetrail/shared-types';
import type { AvailabilityFixedDraft } from '../explore/ui/intentFixedFlowEngine';
import { saveMemberAvailability } from './saveMemberAvailability';

const INTENT_OPEN_CAPACITY_SESSION = 'uaetrail:compose:intent-open-capacity';

export type OpenAvailabilityComposePrefill = {
  scheduleKind: 'open';
  capacity: AvailabilitySlotCapacity;
  modalities: ScheduleModality[];
};

export type FixedAvailabilityComposePrefill = {
  scheduleKind: 'fixed';
  capacity: AvailabilitySlotCapacity;
  modalities: ScheduleModality[];
};

export type AvailabilityLocationMode = 'open' | 'region' | 'area';

export type OpenAvailabilityEditorDraft = {
  selectedDays: ReadonlySet<string>;
  capacity: AvailabilitySlotCapacity;
  modalities: ScheduleModality[];
  visibility: AvailabilityVisibility;
  note: string;
  locationMode: AvailabilityLocationMode;
  region: string;
  areaId: string;
  guideEngagementTerms?: AvailabilityEngagementTerms | null;
};

/** Hydrate open-editor state from saved availability (slot model, not legacy `kinds`). */
export const openEditorStateFromMemberAvailability = (
  data: MemberAvailabilityDTO | null | undefined
): { capacity: AvailabilitySlotCapacity; modalities: ScheduleModality[] } => {
  const openSlots = (data?.slots ?? []).filter((slot) => slot.scheduleKind !== 'fixed');
  const capacity: AvailabilitySlotCapacity = openSlots.some((slot) => slot.capacity === 'guide')
    ? 'guide'
    : 'participant';
  const fromSlots = discoveryModalitiesFromSlots(openSlots);
  if (fromSlots.length > 0) return { capacity, modalities: fromSlots };
  const fromKinds = (data?.kinds ?? []).filter(
    (kind): kind is ScheduleModality => kind !== 'guide' && isScheduleModality(kind)
  );
  return {
    capacity,
    modalities: fromKinds.length > 0 ? fromKinds : ['hiking'],
  };
};

export const initialOpenEditorFromPrefill = (
  prefill: OpenAvailabilityComposePrefill
): Pick<OpenAvailabilityEditorDraft, 'capacity' | 'modalities'> => ({
  capacity: prefill.capacity,
  modalities: prefill.modalities.length ? [...prefill.modalities] : ['hiking'],
});

export const buildOpenSlotsFromEditor = (
  selectedDays: ReadonlySet<string>,
  modalities: ScheduleModality[],
  capacity: AvailabilitySlotCapacity,
  guideEngagementTerms?: AvailabilityEngagementTerms | null
): MemberAvailabilitySlotDTO[] => {
  const terms =
    capacity === 'guide' ? guideEngagementTerms ?? defaultGuideEngagementTerms() : null;
  return normalizeMemberAvailabilitySlotsForStorage(
    [...selectedDays].map((iso) => ({
      startDate: iso,
      endDate: iso,
      timeBand: 'any' as const,
      scheduleKind: 'open' as const,
      capacity,
      modalities,
      engagementTerms: terms,
    }))
  );
};

export const mergeOpenSlotsWithExisting = (
  existing: MemberAvailabilityDTO | null | undefined,
  openSlots: MemberAvailabilitySlotDTO[]
): MemberAvailabilitySlotDTO[] => {
  const fixed = (existing?.slots ?? []).filter((slot) => slot.scheduleKind === 'fixed');
  return [...openSlots, ...fixed];
};

export const buildOpenAvailabilityUpsert = (
  draft: OpenAvailabilityEditorDraft,
  existing: MemberAvailabilityDTO | null | undefined
): UpsertMemberAvailabilityInput => {
  const openSlots = buildOpenSlotsFromEditor(
    draft.selectedDays,
    draft.modalities,
    draft.capacity,
    draft.guideEngagementTerms
  );
  return {
    visibility: draft.visibility,
    note: draft.note.trim() || null,
    region: draft.locationMode === 'region' ? draft.region.trim() : null,
    areaId: draft.locationMode === 'area' ? draft.areaId.trim() : null,
    slots: mergeOpenSlotsWithExisting(existing, openSlots),
  };
};

export const intentFixedKindToScheduleModality = (
  kind: IntentFixedComposeKind | string | null | undefined
): ScheduleModality => {
  if (kind && isScheduleModality(kind)) return kind;
  return 'other';
};

/** §8.10.4 — `intent:open` default participant; optional `capacity=guide`. */
export const prefillOpenIntentCompose = (options?: {
  capacityParam?: string | null;
}): OpenAvailabilityComposePrefill => {
  const fromSession = readIntentOpenComposeCapacity();
  const capacity: AvailabilitySlotCapacity =
    options?.capacityParam === 'guide' || fromSession === 'guide' ? 'guide' : 'participant';
  return {
    scheduleKind: 'open',
    capacity,
    modalities: ['hiking'],
  };
};

/** §8.10.4 — `intent:fixed:<modality>` participant + single modality (never `guide`). */
export const prefillFixedIntentCompose = (
  kind: IntentFixedComposeKind | string
): FixedAvailabilityComposePrefill => ({
  scheduleKind: 'fixed',
  capacity: 'participant',
  modalities: [intentFixedKindToScheduleModality(kind)],
});

export const prefillFromIntentComposeRoute = (
  route: Extract<ExploreComposeWire, { composeKind: 'intent' }>,
  options?: { capacityParam?: string | null }
): OpenAvailabilityComposePrefill | FixedAvailabilityComposePrefill => {
  if (route.mode === 'open') return prefillOpenIntentCompose(options);
  return prefillFixedIntentCompose(route.kind);
};

export const readIntentOpenComposeCapacity = (): AvailabilitySlotCapacity | null => {
  try {
    const value = sessionStorage.getItem(INTENT_OPEN_CAPACITY_SESSION);
    if (value === 'guide' || value === 'participant') return value;
  } catch {
    /* ignore */
  }
  return null;
};

export const writeIntentOpenComposeCapacity = (capacity: AvailabilitySlotCapacity): void => {
  try {
    sessionStorage.setItem(INTENT_OPEN_CAPACITY_SESSION, capacity);
  } catch {
    /* ignore */
  }
};

const fixedWizardKindToModality = (kind: string): ScheduleModality =>
  intentFixedKindToScheduleModality(kind);

export const buildFixedSlotFromDraft = (
  draft: AvailabilityFixedDraft,
  dateIso: string,
  startAt: string
): MemberAvailabilitySlotDTO => {
  const kind = draft.kind ?? 'other';
  const modality = fixedWizardKindToModality(kind);
  return {
    scheduleKind: 'fixed',
    startDate: dateIso,
    endDate: dateIso,
    startAt,
    endAt: startAt,
    title: draft.title.trim(),
    latitude: draft.latitude,
    longitude: draft.longitude,
    locationPrecision: draft.locationPrecision,
    timeBand: null,
    capacity: 'participant',
    modalities: [modality],
  };
};

export const buildFixedAvailabilityUpsert = (
  existing: MemberAvailabilityDTO,
  fixedSlot: MemberAvailabilitySlotDTO,
  draft: AvailabilityFixedDraft
): UpsertMemberAvailabilityInput => ({
  visibility: existing.visibility === 'hidden' ? 'public' : existing.visibility,
  region: draft.preferredArea.trim() || existing.region || null,
  areaId: draft.areaId?.trim() || existing.areaId || null,
  note: existing.note,
  slots: [...existing.slots, fixedSlot],
});

/** Append a fixed slot and persist — shared by intent fixed wizard. */
export const saveFixedAvailabilitySlot = async (
  existing: MemberAvailabilityDTO,
  draft: AvailabilityFixedDraft,
  fixedSlot: MemberAvailabilitySlotDTO
): Promise<MemberAvailabilityDTO> => {
  const body = buildFixedAvailabilityUpsert(existing, fixedSlot, draft);
  return saveMemberAvailability(body);
};