/** Activity modalities on a schedule block — `guide` is capacity, not a modality. */
export const SCHEDULE_MODALITIES = ['hiking', 'camping', 'event', 'rideshare', 'other'] as const;
export type ScheduleModality = (typeof SCHEDULE_MODALITIES)[number];

export const AVAILABILITY_SLOT_CAPACITIES = ['participant', 'guide'] as const;
export type AvailabilitySlotCapacity = (typeof AVAILABILITY_SLOT_CAPACITIES)[number];

export const AVAILABILITY_PRICING_KINDS = ['free', 'paid', 'upon_request'] as const;
export type AvailabilityPricingKind = (typeof AVAILABILITY_PRICING_KINDS)[number];

export const AVAILABILITY_TOUR_SHAPES = ['private', 'group', 'either'] as const;
export type AvailabilityTourShape = (typeof AVAILABILITY_TOUR_SHAPES)[number];

export type AvailabilityEngagementTerms = {
  pricingKind: AvailabilityPricingKind;
  rate?: number | null;
  tourShape?: AvailabilityTourShape | null;
  minParticipants?: number | null;
  maxParticipants?: number | null;
};

export type MemberAvailabilitySlotWire = {
  slotId?: string;
  scheduleKind?: 'open' | 'fixed' | null;
  startDate: string;
  endDate: string;
  timeBand?: 'morning' | 'afternoon' | 'evening' | 'any' | null;
  startAt?: string | null;
  endAt?: string | null;
  title?: string | null;
  locationId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  locationPrecision?: 'general' | 'specific' | null;
  capacity?: AvailabilitySlotCapacity | null;
  modalities?: (ScheduleModality | 'guide' | string)[] | null;
  engagementTerms?: AvailabilityEngagementTerms | null;
};

const scheduleModalitySet = new Set<string>(SCHEDULE_MODALITIES);
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const isScheduleModality = (value: string): value is ScheduleModality =>
  scheduleModalitySet.has(value);

export const assertNoGuideModality = (modalities: string[]): boolean =>
  !modalities.some((m) => m === 'guide');

const slotHasValidCalendarRange = (slot: MemberAvailabilitySlotWire): boolean =>
  ISO_DATE.test(slot.startDate) &&
  ISO_DATE.test(slot.endDate) &&
  slot.startDate <= slot.endDate;

export const defaultScheduleKind = (slot: MemberAvailabilitySlotWire): 'open' | 'fixed' =>
  slot.scheduleKind === 'fixed' ? 'fixed' : 'open';

/** Hydrate slot capacity + modalities for wire/storage (legacy doc `kinds` fallback). */
export const normalizeAvailabilitySlot = (
  slot: MemberAvailabilitySlotWire,
  docKindsHint?: string[]
): MemberAvailabilitySlotWire => {
  const scheduleKind = defaultScheduleKind(slot);
  const docHadGuideKind = docKindsHint?.includes('guide') ?? false;
  const capacity: AvailabilitySlotCapacity =
    slot.capacity === 'guide' || slot.capacity === 'participant'
      ? slot.capacity
      : docHadGuideKind
        ? 'guide'
        : 'participant';

  let modalities = (slot.modalities ?? []).filter(isScheduleModality);
  if (modalities.length === 0 && docKindsHint?.length) {
    modalities = docKindsHint.filter((k): k is ScheduleModality => k !== 'guide' && isScheduleModality(k));
  }
  if (modalities.length === 0 && scheduleKind === 'open') {
    modalities = ['hiking'];
  }

  return {
    ...slot,
    scheduleKind,
    capacity,
    modalities,
    engagementTerms: slot.engagementTerms ?? null,
  };
};

export const hydrateMemberAvailabilitySlots = (
  slots: MemberAvailabilitySlotWire[],
  docKindsHint?: string[]
): MemberAvailabilitySlotWire[] => slots.map((slot) => normalizeAvailabilitySlot(slot, docKindsHint));

/** Index field for legacy readers — modalities only (never `guide`). */
export const deriveLegacyKindsFromSlots = (slots: MemberAvailabilitySlotWire[]): ScheduleModality[] => {
  const set = new Set<ScheduleModality>();
  for (const slot of slots) {
    for (const modality of slot.modalities ?? []) {
      if (isScheduleModality(modality)) set.add(modality);
    }
  }
  return [...set];
};

export type MemberAvailabilityWriteValidation = {
  code: string;
  message: string;
};

export const validateMemberAvailabilityWrite = (input: {
  slots: MemberAvailabilitySlotWire[];
  visibility: 'public' | 'friends' | 'hidden';
  guideProfileComplete: boolean;
  canHostPaidActivities: boolean;
}): MemberAvailabilityWriteValidation | null => {
  if (input.visibility === 'hidden') return null;

  if (input.slots.length === 0) {
    return {
      code: 'availability_slots_required',
      message: 'Add at least one future available day or set visibility to hidden.',
    };
  }

  for (const raw of input.slots) {
    if (!slotHasValidCalendarRange(raw)) {
      return {
        code: 'invalid_availability_slot',
        message: 'One or more availability days are invalid.',
      };
    }

    if ((raw.modalities ?? []).some((m) => String(m) === 'guide')) {
      return {
        code: 'guide_modality_forbidden',
        message: 'Guide is a capacity, not a modality. Remove guide from activity types.',
      };
    }

    const slot = normalizeAvailabilitySlot(raw);
    if (!assertNoGuideModality(slot.modalities ?? [])) {
      return {
        code: 'guide_modality_forbidden',
        message: 'Guide is a capacity, not a modality. Remove guide from activity types.',
      };
    }

    if (slot.capacity === 'participant' && (slot.modalities?.length ?? 0) === 0) {
      return {
        code: 'modalities_required',
        message: 'Choose at least one activity for participant availability.',
      };
    }

    if (slot.capacity === 'guide' && !input.guideProfileComplete) {
      return {
        code: 'guide_profile_required',
        message: 'Complete your guide profile before offering guide availability.',
      };
    }

    const terms = slot.engagementTerms;
    if (terms?.pricingKind === 'paid') {
      if (!input.canHostPaidActivities) {
        return {
          code: 'paid_terms_not_allowed',
          message: 'Paid outings require a verified business or Pro operator profile.',
        };
      }
      if (terms.rate == null || !Number.isFinite(terms.rate) || terms.rate <= 0) {
        return {
          code: 'paid_rate_required',
          message: 'Enter a rate for paid guide availability.',
        };
      }
    }

    if (slot.capacity === 'participant' && terms && terms.pricingKind !== 'free') {
      return {
        code: 'participant_terms_free_only',
        message: 'Participant availability must use free terms.',
      };
    }
  }

  return null;
};