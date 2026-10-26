import type { ActivityDetailDTO } from '@uaetrail/shared-types';
import { extractActivityTransportRequirementLines } from '@uaetrail/shared-types';
import { buildActivityDto } from './mappers.js';
import { sanitizeRideshareVehiclePublic } from './rideshare-vehicle-crew.js';

type ActivityDetailSource = Parameters<typeof buildActivityDto>[0];

/** Map-safe / pre-join fields for activity detail (no meeting point, itinerary, or full description). */
export const buildActivityRedactedDetail = (event: ActivityDetailSource): ActivityDetailDTO => {
  const dto = buildActivityDto(event);
  const isRideshareListing = dto.activityType === 'rideshare';

  return {
    id: dto.id,
    title: dto.title,
    activityType: dto.activityType,
    status: dto.status,
    date: dto.date,
    time: dto.time,
    endTime: dto.endTime,
    locationId: dto.locationId,
    locationName: dto.locationName,
    region: dto.region,
    description: '',
    joinMode: dto.joinMode,
    participationMode: dto.participationMode,
    requirements: extractActivityTransportRequirementLines(dto.requirements),
    rideshareEnabled: dto.rideshareEnabled,
    rideshareFree: dto.rideshareFree ?? null,
    ridesharePriceAed: dto.ridesharePriceAed ?? null,
    rideshareSeats: dto.rideshareSeats ?? null,
    rideshareDetails: dto.rideshareDetails ?? null,
    rideshareVehicleId: isRideshareListing ? (dto.rideshareVehicleId ?? null) : null,
    rideshareVehicle: isRideshareListing
      ? sanitizeRideshareVehiclePublic(dto.rideshareVehicle)
      : null,
    linkedActivityId: dto.linkedActivityId ?? null,
    linkedRideshareActivityId: dto.linkedRideshareActivityId ?? null,
    slotsTotal: dto.slotsTotal,
    slotsAvailable: dto.slotsAvailable,
    price: dto.price,
    pricingMode: dto.pricingMode,
    hostName: dto.hostName,
    hostUserId: dto.hostUserId,
    hostAvatar: dto.hostAvatar,
    tenantName: dto.tenantName,
    hostId: dto.hostId,
    createdById: dto.createdById,
    participantPreviews: dto.participantPreviews,
    displayLatitude: dto.displayLatitude,
    displayLongitude: dto.displayLongitude,
    outingCategory: dto.outingCategory,
    outingTopic: dto.outingTopic,
    bannerUrl: dto.bannerUrl,
    images: dto.images?.length ? [dto.images[0]] : undefined,
    countryCode: dto.countryCode,
    tenantId: dto.tenantId,
    tenantSlug: dto.tenantSlug,
    ...(isRideshareListing
      ? {
          meetingPoint: dto.meetingPoint ?? null,
          meetingLat: dto.meetingLat ?? null,
          meetingLng: dto.meetingLng ?? null,
          startPoint: dto.startPoint ?? null,
          startLat: dto.startLat ?? null,
          startLng: dto.startLng ?? null,
        }
      : {}),
    message: isRideshareListing
      ? 'Join this ride to unlock crew chat and the full host notes.'
      : 'Join this outing to unlock the full plan — meeting point, host notes, and crew chat.',
  };
};
