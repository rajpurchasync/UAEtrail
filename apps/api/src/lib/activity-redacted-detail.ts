import type { ActivityDetailDTO } from '@uaetrail/shared-types';
import { buildActivityDto } from './mappers.js';

type ActivityDetailSource = Parameters<typeof buildActivityDto>[0];

/** Map-safe / pre-join fields for activity detail (no meeting point, itinerary, or full description). */
export const buildActivityRedactedDetail = (event: ActivityDetailSource): ActivityDetailDTO => {
  const dto = buildActivityDto(event);
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
    requirements: [],
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
    message:
      'Join this outing to unlock the full plan — meeting point, host notes, and crew chat.',
  };
};
