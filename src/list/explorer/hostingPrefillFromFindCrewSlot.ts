import type { MemberAvailabilitySlotDTO, ScheduleModality } from '@uaetrail/shared-types';
import {
  emptyCreateActivityDraft,
  hydrateCreateActivityDraft,
  type CreateActivityKind,
} from '@/explore/ui/hostingFlowEngine';
import type { HostingWizardPrefill } from '@/explore/ui/hostingWizardPrefill';

const modalityToHostKind = (modality: ScheduleModality | undefined): CreateActivityKind => {
  switch (modality) {
    case 'camping':
      return 'camping';
    case 'rideshare':
      return 'rideshare';
    case 'event':
      return 'event';
    case 'hiking':
      return 'hiking';
    default:
      return 'activity';
  }
};

const timeFromSlotStartAt = (startAt: string | null | undefined): string | null => {
  if (!startAt?.trim()) return null;
  const match = startAt.match(/T(\d{2}:\d{2})/);
  return match?.[1] ?? null;
};

/** Host wizard prefill from a Find crew availability slot (Propose a plan). */
export const hostingPrefillFromFindCrewSlot = (
  slot: MemberAvailabilitySlotDTO,
  options?: { destinationId?: string | null; note?: string | null }
): HostingWizardPrefill => {
  const modality = slot.modalities?.[0];
  const kind = modalityToHostKind(modality);
  const time = timeFromSlotStartAt(slot.startAt);
  const hasFromPin = slot.latitude != null && slot.longitude != null;
  const destinationRegions = slot.destinationRegions?.filter(Boolean).join(' · ') ?? '';

  const draft = hydrateCreateActivityDraft({
    kind,
    title:
      slot.title?.trim() ||
      (destinationRegions
        ? `Plan with crew — ${destinationRegions}`
        : modality
          ? `Plan a ${modality} outing`
          : 'Plan an outing together'),
    date: slot.startDate,
    endDate: slot.endDate !== slot.startDate ? slot.endDate : '',
    timeMode: time ? 'specific' : 'flexible',
    time: time ?? emptyCreateActivityDraft().time,
    meetingTime: time ?? emptyCreateActivityDraft().meetingTime,
    latitude: hasFromPin ? slot.latitude : null,
    longitude: hasFromPin ? slot.longitude : null,
    fromLabel: hasFromPin ? 'From their map pin' : '',
    fromLocationPrecise: hasFromPin,
    locationPrecision: slot.locationPrecision === 'specific' ? 'specific' : 'general',
    toLatitude: slot.destinationLatitude,
    toLongitude: slot.destinationLongitude,
    toLabel: slot.destinationLatitude != null ? 'Their destination pin' : '',
    registryPlaceDestinationId: options?.destinationId?.trim() || null,
    description: options?.note?.trim() || '',
    capacity: slot.partySize && slot.partySize > 0 ? Math.min(99, slot.partySize) : 8,
  });

  return { draft };
};