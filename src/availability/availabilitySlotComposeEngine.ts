import type {
  AvailabilityEngagementTerms,
  AvailabilitySlotCapacity,
  AvailabilitySlotTransportMode,
  AvailabilitySlotVehicleType,
  AvailabilityVisibility,
  ExploreComposeWire,
  IntentFixedComposeKind,
  MemberAvailabilityDTO,
  MemberAvailabilitySlotDTO,
  ScheduleModality,
  UpsertMemberAvailabilityInput,
} from '@uaetrail/shared-types';
import { sanitizeAvailabilitySlotLogistics, sanitizeDestinationRegions } from '@uaetrail/shared-types';
import type { AvailabilityOpenLogisticsState } from './AvailabilityOpenLogisticsFields';
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

export type AvailabilityLocationMode = 'open' | 'region' | 'destination';

export type OpenAvailabilityEditorDraft = {
  selectedDays: ReadonlySet<string>;
  capacity: AvailabilitySlotCapacity;
  modalities: ScheduleModality[];
  visibility: AvailabilityVisibility;
  note: string;
  locationMode: AvailabilityLocationMode;
  region: string;
  destinationId: string;
  guideEngagementTerms?: AvailabilityEngagementTerms | null;
  destinationRegions: string[];
  partySize: number;
  transportMode: AvailabilityOpenLogisticsState['transportMode'];
  selfVehicleType: AvailabilityOpenLogisticsState['selfVehicleType'];
  rideshareSeatsNeeded: number;
};

const mapOpenTransportMode = (
  mode: AvailabilityOpenLogisticsState['transportMode']
): AvailabilitySlotTransportMode | null => {
  if (mode === 'self') return 'has_vehicle';
  if (mode === 'rideshare') return 'needs_carpool';
  return null;
};

const mapOpenVehicleType = (
  value: AvailabilityOpenLogisticsState['selfVehicleType']
): AvailabilitySlotVehicleType | null => {
  if (value === 'sedan' || value === 'suv' || value === '4x4' || value === 'van') return value;
  return null;
};

export const resolveOpenSlotDestinationRegions = (
  draft: Pick<OpenAvailabilityEditorDraft, 'destinationRegions' | 'locationMode' | 'region'>
): string[] | null => {
  const fromMulti = sanitizeDestinationRegions(draft.destinationRegions);
  if (fromMulti?.length) return fromMulti;
  if (draft.locationMode === 'region' && draft.region.trim()) {
    return sanitizeDestinationRegions([draft.region.trim()]);
  }
  return null;
};

const openLogisticsFromDraft = (
  draft: Pick<
    OpenAvailabilityEditorDraft,
    'partySize' | 'transportMode' | 'selfVehicleType' | 'rideshareSeatsNeeded'
  >
) =>
  sanitizeAvailabilitySlotLogistics({
    partySize: draft.partySize,
    transportMode: mapOpenTransportMode(draft.transportMode),
    vehicleType:
      draft.transportMode === 'self' ? mapOpenVehicleType(draft.selfVehicleType) : null,
    carpoolSeatsNeeded:
      draft.transportMode === 'rideshare' ? draft.rideshareSeatsNeeded : null,
  });

/** Hydrate open-editor state from saved availability (slot model, not legacy `kinds`). */
export const openEditorStateFromMemberAvailability = (
  data: MemberAvailabilityDTO | null | undefined
): Pick<
  OpenAvailabilityEditorDraft,
  | 'capacity'
  | 'modalities'
  | 'destinationRegions'
  | 'partySize'
  | 'transportMode'
  | 'selfVehicleType'
  | 'rideshareSeatsNeeded'
> => {
  const openSlots = (data?.slots ?? []).filter((slot) => slot.scheduleKind !== 'fixed');
  const capacity: AvailabilitySlotCapacity = openSlots.some((slot) => slot.capacity === 'guide')
    ? 'guide'
    : 'participant';
  const fromSlots = discoveryModalitiesFromSlots(openSlots);
  const docModalitiesFallback = (data?.kinds ?? []).filter(
    (kind): kind is ScheduleModality => kind !== 'guide' && isScheduleModality(kind)
  );
  const modalities =
    fromSlots.length > 0 ? fromSlots : docModalitiesFallback.length > 0 ? docModalitiesFallback : ['hiking'];

  const sample = openSlots[0];
  const transportMode: AvailabilityOpenLogisticsState['transportMode'] =
    sample?.transportMode === 'has_vehicle'
      ? 'self'
      : sample?.transportMode === 'needs_carpool'
        ? 'rideshare'
        : null;

  return {
    capacity,
    modalities,
    destinationRegions: sample?.destinationRegions ?? [],
    partySize: sample?.partySize ?? 1,
    transportMode,
    selfVehicleType:
      transportMode === 'self' && sample?.vehicleType ? sample.vehicleType : null,
    rideshareSeatsNeeded: sample?.carpoolSeatsNeeded ?? 1,
  };
};

export const initialOpenEditorFromPrefill = (
  prefill: OpenAvailabilityComposePrefill
): Pick<OpenAvailabilityEditorDraft, 'capacity' | 'modalities'> => ({
  capacity: prefill.capacity,
  modalities: prefill.modalities.length ? [...prefill.modalities] : ['hiking'],
});

export const buildOpenSlotsFromEditor = (
  draft: Pick<
    OpenAvailabilityEditorDraft,
    | 'selectedDays'
    | 'modalities'
    | 'capacity'
    | 'guideEngagementTerms'
    | 'destinationRegions'
    | 'locationMode'
    | 'region'
    | 'partySize'
    | 'transportMode'
    | 'selfVehicleType'
    | 'rideshareSeatsNeeded'
  >
): MemberAvailabilitySlotDTO[] => {
  const terms =
    draft.capacity === 'guide'
      ? draft.guideEngagementTerms ?? defaultGuideEngagementTerms()
      : null;
  const destinationRegions = resolveOpenSlotDestinationRegions(draft);
  const logistics = openLogisticsFromDraft(draft);

  return normalizeMemberAvailabilitySlotsForStorage(
    [...draft.selectedDays].map((iso) => ({
      startDate: iso,
      endDate: iso,
      timeBand: 'any' as const,
      scheduleKind: 'open' as const,
      capacity: draft.capacity,
      modalities: draft.modalities,
      engagementTerms: terms,
      destinationRegions,
      ...logistics,
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
  const openSlots = buildOpenSlotsFromEditor(draft);
  return {
    visibility: draft.visibility,
    note: draft.note.trim() || null,
    region: draft.locationMode === 'region' ? draft.region.trim() : null,
    destinationId: draft.locationMode === 'destination' ? draft.destinationId.trim() : null,
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

const mapFixedDraftTransportMode = (
  mode: AvailabilityFixedDraft['transportMode']
): AvailabilitySlotTransportMode | null => {
  if (mode === 'self') return 'has_vehicle';
  if (mode === 'rideshare') return 'needs_carpool';
  return null;
};

const mapFixedVehicleType = (
  value: AvailabilityFixedDraft['selfVehicleType']
): AvailabilitySlotVehicleType | null => {
  if (value === 'sedan' || value === 'suv' || value === '4x4' || value === 'van') return value;
  return null;
};

export const buildFixedSlotFromDraft = (
  draft: AvailabilityFixedDraft,
  dateIso: string,
  startAt: string
): MemberAvailabilitySlotDTO => {
  const kind = draft.kind ?? 'other';
  const modality = fixedWizardKindToModality(kind);
  const capacity = draft.capacity === 'guide' ? 'guide' : 'participant';
  const logistics = sanitizeAvailabilitySlotLogistics({
    partySize: draft.partySize,
    transportMode: mapFixedDraftTransportMode(draft.transportMode),
    vehicleType:
      draft.transportMode === 'self' ? mapFixedVehicleType(draft.selfVehicleType) : null,
    carpoolSeatsNeeded:
      draft.transportMode === 'rideshare' ? draft.rideshareSeatsNeeded : null,
    destinationLatitude: draft.toPinPlaced ? draft.toLatitude : null,
    destinationLongitude: draft.toPinPlaced ? draft.toLongitude : null,
    destinationPrecision: draft.toPinPlaced ? draft.locationPrecision : null,
  });

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
    capacity,
    modalities: [modality],
    engagementTerms:
      capacity === 'guide' ? draft.guideEngagementTerms ?? defaultGuideEngagementTerms() : null,
    destinationRegions: sanitizeDestinationRegions(
      draft.destinationRegions.length > 0
        ? draft.destinationRegions
        : draft.preferredArea.trim()
          ? [draft.preferredArea.trim()]
          : null
    ),
    ...logistics,
  };
};

export const buildFixedAvailabilityUpsert = (
  existing: MemberAvailabilityDTO,
  fixedSlot: MemberAvailabilitySlotDTO,
  draft: AvailabilityFixedDraft,
  note: string | null
): UpsertMemberAvailabilityInput => ({
  visibility: existing.visibility === 'hidden' ? 'public' : existing.visibility,
  region: draft.preferredArea.trim() || existing.region || null,
  destinationId: draft.destinationId?.trim() || existing.destinationId || null,
  note: note?.trim() || existing.note || null,
  slots: [...existing.slots, fixedSlot],
});

/** Append a fixed slot and persist — shared by intent fixed wizard. */
export const saveFixedAvailabilitySlot = async (
  existing: MemberAvailabilityDTO,
  draft: AvailabilityFixedDraft,
  fixedSlot: MemberAvailabilitySlotDTO,
  note: string | null
): Promise<MemberAvailabilityDTO> => {
  const body = buildFixedAvailabilityUpsert(existing, fixedSlot, draft, note);
  return saveMemberAvailability(body);
};