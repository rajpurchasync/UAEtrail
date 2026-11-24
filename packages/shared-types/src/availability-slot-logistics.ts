import type { MemberAvailabilitySlotDTO } from './member-availability.js';

/** How a member plans to reach the outing (availability slot — not activity transport). */
export const AVAILABILITY_SLOT_TRANSPORT_MODES = ['has_vehicle', 'needs_carpool'] as const;
export type AvailabilitySlotTransportMode = (typeof AVAILABILITY_SLOT_TRANSPORT_MODES)[number];

export const AVAILABILITY_SLOT_VEHICLE_TYPES = ['sedan', 'suv', '4x4', 'van'] as const;
export type AvailabilitySlotVehicleType = (typeof AVAILABILITY_SLOT_VEHICLE_TYPES)[number];

const transportModeSet = new Set<string>(AVAILABILITY_SLOT_TRANSPORT_MODES);
const vehicleTypeSet = new Set<string>(AVAILABILITY_SLOT_VEHICLE_TYPES);

export const isAvailabilitySlotTransportMode = (value: string): value is AvailabilitySlotTransportMode =>
  transportModeSet.has(value);

export const isAvailabilitySlotVehicleType = (value: string): value is AvailabilitySlotVehicleType =>
  vehicleTypeSet.has(value);

const VEHICLE_LABELS: Record<AvailabilitySlotVehicleType, string> = {
  sedan: 'Sedan',
  suv: 'SUV',
  '4x4': '4x4',
  van: 'Van',
};

export type AvailabilitySlotLogisticsWire = {
  partySize?: number | null;
  transportMode?: AvailabilitySlotTransportMode | null;
  vehicleType?: AvailabilitySlotVehicleType | null;
  carpoolSeatsNeeded?: number | null;
  destinationLatitude?: number | null;
  destinationLongitude?: number | null;
  destinationPrecision?: 'general' | 'specific' | null;
};

export const sanitizeAvailabilitySlotLogistics = (
  input: AvailabilitySlotLogisticsWire
): AvailabilitySlotLogisticsWire => {
  const partySize =
    typeof input.partySize === 'number' && Number.isFinite(input.partySize) && input.partySize >= 1
      ? Math.min(99, Math.round(input.partySize))
      : null;

  let transportMode: AvailabilitySlotTransportMode | null = null;
  if (input.transportMode && isAvailabilitySlotTransportMode(input.transportMode)) {
    transportMode = input.transportMode;
  }

  let vehicleType: AvailabilitySlotVehicleType | null = null;
  if (input.vehicleType && isAvailabilitySlotVehicleType(input.vehicleType)) {
    vehicleType = input.vehicleType;
  }

  let carpoolSeatsNeeded: number | null = null;
  if (
    typeof input.carpoolSeatsNeeded === 'number' &&
    Number.isFinite(input.carpoolSeatsNeeded) &&
    input.carpoolSeatsNeeded >= 1
  ) {
    carpoolSeatsNeeded = Math.min(20, Math.round(input.carpoolSeatsNeeded));
  }

  if (transportMode === 'has_vehicle') {
    carpoolSeatsNeeded = null;
  } else if (transportMode === 'needs_carpool') {
    vehicleType = null;
  } else {
    vehicleType = null;
    carpoolSeatsNeeded = null;
  }

  const lat = input.destinationLatitude;
  const lng = input.destinationLongitude;
  const destinationLatitude = typeof lat === 'number' && Number.isFinite(lat) ? lat : null;
  const destinationLongitude = typeof lng === 'number' && Number.isFinite(lng) ? lng : null;
  const destinationPrecision =
    destinationLatitude != null &&
    destinationLongitude != null &&
    (input.destinationPrecision === 'general' || input.destinationPrecision === 'specific')
      ? input.destinationPrecision
      : destinationLatitude != null
        ? 'general'
        : null;

  return {
    partySize,
    transportMode,
    vehicleType,
    carpoolSeatsNeeded,
    destinationLatitude,
    destinationLongitude,
    destinationPrecision,
  };
};

/** Human-readable transport line for browse cards and profile. */
export const formatAvailabilitySlotTransportLine = (
  slot: Pick<
    MemberAvailabilitySlotDTO,
  'transportMode' | 'vehicleType' | 'carpoolSeatsNeeded'
  >
): string | null => {
  if (slot.transportMode === 'has_vehicle') {
    const label = slot.vehicleType ? VEHICLE_LABELS[slot.vehicleType] : null;
    return label ? `Has transport · ${label}` : 'Has transport';
  }
  if (slot.transportMode === 'needs_carpool') {
    const seats = slot.carpoolSeatsNeeded;
    if (seats != null && seats > 0) {
      return `Needs carpool · ${seats} seat${seats === 1 ? '' : 's'}`;
    }
    return 'Needs carpool';
  }
  return null;
};

/** Party size for cards — omit default solo. */
export const formatAvailabilitySlotPartyLine = (
  slot: Pick<MemberAvailabilitySlotDTO, 'partySize'>
): string | null => {
  const size = slot.partySize;
  if (size == null || size <= 1) return null;
  return `Party of ${size}`;
};

export const formatAvailabilitySlotLogisticsLine = (
  slot: Pick<
    MemberAvailabilitySlotDTO,
    'partySize' | 'transportMode' | 'vehicleType' | 'carpoolSeatsNeeded'
  >
): string | null => {
  const parts = [formatAvailabilitySlotPartyLine(slot), formatAvailabilitySlotTransportLine(slot)].filter(
    Boolean
  ) as string[];
  return parts.length > 0 ? parts.join(' · ') : null;
};