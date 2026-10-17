/**
 * Canonical host/organize activity publish payload (join rules, pricing, location refs).
 *
 * Entry points:
 * - Explore FAB: `src/services/organizeActivityPublish.ts` → `buildOrganizeActivityPublishInput` / `publishOrganizeActivity`
 * - Explore Organize: `src/services/organizeActivityPublish.ts` → `buildHostActivityPublishPayload`
 */
import type {
  ActivityGroupChatPostPolicy,
  ActivityJoinMode,
  OutingCategory,
  OutingTopic,
  ParticipationMode,
} from '@uaetrail/shared-types';
import {
  APPROVAL_PARTICIPATION_REQUIREMENT,
  PRIVATE_JOIN_REQUIREMENT_PREFIX,
  RSVP_PARTICIPATION_REQUIREMENT,
} from '@uaetrail/shared-types';
export const OPEN_JOIN_REQUIREMENT = 'Open: anyone can request to join';

export const PRIVATE_JOIN_REQUIREMENT = `${PRIVATE_JOIN_REQUIREMENT_PREFIX} — approval required`;

export const privateJoinRequirementLine = (participationMode: ParticipationMode): string =>
  participationMode === 'rsvp'
    ? `${PRIVATE_JOIN_REQUIREMENT_PREFIX} — invite link only`
    : PRIVATE_JOIN_REQUIREMENT;

export type ActivityPublishPricing = {
  pricingMode: 'free' | 'shared' | 'paid';
  price: number;
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

export type ActivityPublishRideshare = {
  rideshareEnabled?: boolean;
  rideshareFree?: boolean;
  ridesharePriceAed?: number | null;
  rideshareSeats?: number | null;
  rideshareDetails?: string | null;
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
  hostId?: string;
  rideshare?: ActivityPublishRideshare;
  outingCategory?: OutingCategory | null;
  outingTopic?: OutingTopic | null;
  /** Optional lineage when reorganizing from a prior activity (audit only). */
  clonedFromActivityId?: string | null;
  /** Parent hike/camp/event when publishing a linked rideshare. */
  linkedActivityId?: string | null;
  groupChatPostPolicy?: ActivityGroupChatPostPolicy;
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

/** Build the POST/PATCH body for operator activities API. */
export const buildHostActivityPublishPayload = (input: ActivityPublishInput): Record<string, unknown> => {
  const isRideshare = input.activityType === 'rideshare';
  const rideshare = input.rideshare ?? {};
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
    hostId: input.hostId,
  };

  if (input.outingCategory) {
    payload.outingCategory = input.outingCategory;
  }
  if (input.outingTopic) {
    payload.outingTopic = input.outingTopic;
  }
  if (input.clonedFromActivityId?.trim()) {
    payload.clonedFromActivityId = input.clonedFromActivityId.trim();
  }
  if (input.linkedActivityId?.trim()) {
    payload.linkedActivityId = input.linkedActivityId.trim();
  }
  if (input.groupChatPostPolicy) {
    payload.groupChatPostPolicy = input.groupChatPostPolicy;
  }

  if (isRideshare || rideshare.rideshareEnabled) {
    payload.rideshareEnabled = isRideshare ? true : rideshare.rideshareEnabled;
    if (rideshare.rideshareFree !== undefined) payload.rideshareFree = rideshare.rideshareFree;
    if (rideshare.ridesharePriceAed !== undefined) payload.ridesharePriceAed = rideshare.ridesharePriceAed;
    if (rideshare.rideshareSeats !== undefined) payload.rideshareSeats = rideshare.rideshareSeats;
    if (rideshare.rideshareDetails !== undefined) payload.rideshareDetails = rideshare.rideshareDetails;
  }

  return payload;
};

