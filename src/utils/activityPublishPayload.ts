/**
 * Canonical host/organize activity publish payload (join rules, pricing, location refs).
 *
 * Entry points:
 * - Explore FAB: `src/services/organizeActivityPublish.ts` → `buildOrganizeActivityPublishInput` / `publishOrganizeActivity`
 * - Host console: `src/components/activities/activityFormState.ts` → `buildOrganisationActivityPayload`
 */
import type { ActivityJoinMode, ParticipationMode } from '@uaetrail/shared-types';
import {
  APPROVAL_PARTICIPATION_REQUIREMENT,
  PRIVATE_JOIN_REQUIREMENT_PREFIX,
  RSVP_PARTICIPATION_REQUIREMENT,
} from '@uaetrail/shared-types';
import type { ActivityPricePackage } from './activityPricing';

export const OPEN_JOIN_REQUIREMENT = 'Open: anyone can request to join';

export const PRIVATE_JOIN_REQUIREMENT = `${PRIVATE_JOIN_REQUIREMENT_PREFIX} — approval required`;

export const privateJoinRequirementLine = (participationMode: ParticipationMode): string =>
  participationMode === 'rsvp'
    ? `${PRIVATE_JOIN_REQUIREMENT_PREFIX} — invite link only`
    : PRIVATE_JOIN_REQUIREMENT;

export type ActivityPublishPricing = {
  pricingMode: 'free' | 'shared' | 'paid';
  price: number;
  pricePackages?: ActivityPricePackage[];
  paymentTerms?: string | null;
};

export type ActivityPublishLocation = {
  meetingPoint?: string;
  meetingLat?: number | null;
  meetingLng?: number | null;
  startPoint?: string;
  startLat?: number | null;
  startLng?: number | null;
  parkingPoint?: string;
  parkingLat?: number | null;
  parkingLng?: number | null;
  meetingDifferent?: boolean;
};

export type ActivityPublishCarpool = {
  carPoolEnabled?: boolean;
  carPoolFree?: boolean;
  carPoolPriceAed?: number | null;
  carPoolSeats?: number | null;
  carPoolDetails?: string | null;
};

/** Canonical host activity create/update body — shared by explore compose and host console. */
export type ActivityPublishInput = {
  activityType: string;
  locationId: string;
  title: string;
  description: string;
  date: string;
  time: string;
  endDate?: string;
  endTime?: string;
  capacity: number;
  pricing: ActivityPublishPricing;
  location: ActivityPublishLocation;
  requirements: string[];
  joinMode: ActivityJoinMode;
  participationMode?: ParticipationMode;
  images?: string[];
  bannerUrl?: string | null;
  signupUrl?: string | null;
  hostId?: string;
  carpool?: ActivityPublishCarpool;
};

export const defaultParticipationModeForActivityType = (activityType: string): ParticipationMode =>
  activityType === 'event' ? 'rsvp' : 'approval';

/** Participation + map visibility sentinel lines written into requirements for API fallback. */
export const buildParticipationRequirementLines = (input: {
  participationMode: ParticipationMode;
  joinMode: ActivityJoinMode;
  includeOpenJoinHint?: boolean;
}): string[] => {
  const lines: string[] = [
    input.participationMode === 'rsvp'
      ? RSVP_PARTICIPATION_REQUIREMENT
      : APPROVAL_PARTICIPATION_REQUIREMENT,
  ];

  if (input.joinMode === 'private') {
    lines.push(privateJoinRequirementLine(input.participationMode));
  } else if (input.includeOpenJoinHint !== false && input.participationMode === 'approval') {
    lines.push(OPEN_JOIN_REQUIREMENT);
  }

  return lines;
};

export const stripParticipationRequirementLines = (requirements: string[]): string[] =>
  requirements.filter((item) => {
    const trimmed = item.trim();
    if (trimmed === RSVP_PARTICIPATION_REQUIREMENT) return false;
    if (trimmed === APPROVAL_PARTICIPATION_REQUIREMENT) return false;
    if (trimmed.startsWith(PRIVATE_JOIN_REQUIREMENT_PREFIX)) return false;
    if (trimmed === OPEN_JOIN_REQUIREMENT) return false;
    return true;
  });

export const mergeParticipationRequirements = (
  requirements: string[],
  participation: {
    participationMode: ParticipationMode;
    joinMode: ActivityJoinMode;
    includeOpenJoinHint?: boolean;
  }
): string[] => [
  ...buildParticipationRequirementLines(participation),
  ...stripParticipationRequirementLines(requirements),
];

/** Build the POST/PATCH body for `/host/activities`. */
export const buildOrganisationActivityPublishPayload = (input: ActivityPublishInput): Record<string, unknown> => {
  const isCarpool = input.activityType === 'carpool';
  const carpool = input.carpool ?? {};
  const { pricing, location } = input;

  const paymentTerms = pricing.paymentTerms?.trim() ?? '';

  const payload: Record<string, unknown> = {
    activityType: input.activityType,
    locationId: input.locationId,
    title: input.title.trim(),
    description: input.description.trim(),
    date: input.date,
    time: input.time,
    ...(input.endDate ? { endDate: input.endDate } : {}),
    ...(input.endTime ? { endTime: input.endTime } : {}),
    capacity: input.capacity,
    price: Math.round(Math.max(0, pricing.price)),
    pricingMode: pricing.pricingMode,
    ...(paymentTerms ? { paymentTerms } : {}),
    meetingPoint: location.meetingPoint,
    meetingLat: location.meetingLat,
    meetingLng: location.meetingLng,
    startPoint: location.startPoint,
    startLat: location.startLat,
    startLng: location.startLng,
    parkingPoint: location.parkingPoint,
    parkingLat: location.parkingLat,
    parkingLng: location.parkingLng,
    meetingDifferent: location.meetingDifferent ?? false,
    requirements: input.requirements,
    joinMode: input.joinMode,
    participationMode: input.participationMode,
    images: input.images ?? [],
    bannerUrl: input.bannerUrl ?? null,
    signupUrl: input.signupUrl ?? null,
    hostId: input.hostId,
  };

  if (pricing.pricePackages && pricing.pricePackages.length > 0) {
    payload.pricePackages = pricing.pricePackages;
  }

  if (isCarpool || carpool.carPoolEnabled) {
    payload.carPoolEnabled = isCarpool ? true : carpool.carPoolEnabled;
    if (carpool.carPoolFree !== undefined) payload.carPoolFree = carpool.carPoolFree;
    if (carpool.carPoolPriceAed !== undefined) payload.carPoolPriceAed = carpool.carPoolPriceAed;
    if (carpool.carPoolSeats !== undefined) payload.carPoolSeats = carpool.carPoolSeats;
    if (carpool.carPoolDetails !== undefined) payload.carPoolDetails = carpool.carPoolDetails;
  }

  return payload;
};

/** @deprecated Use {@link buildOrganisationActivityPublishPayload} */
export const buildHostActivityPublishPayload = buildOrganisationActivityPublishPayload;
