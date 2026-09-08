import type { Activity } from '../domain/types.js';
import { ActivityStatus, ActivityType } from '../domain/enums.js';
import { ApiError } from '../lib/api-error.js';
import {
  cancelActivityById,
  createActivityDetailed,
  findLinkedCarpoolDocByParentId,
  publishActivityById,
  updateActivityDetailed,
} from '../lib/activities-store.js';
import { patchActivityInMongo } from '../lib/entity-sync.js';

export type CarpoolRouteInput = {
  fromLabel?: string | null;
  fromLat?: number | null;
  fromLng?: number | null;
  toLabel?: string | null;
  toLat?: number | null;
  toLng?: number | null;
};

export const carpoolRouteFromBody = (body: {
  carPoolFromPoint?: string;
  carPoolFromLat?: number;
  carPoolFromLng?: number;
  carPoolToPoint?: string;
  carPoolToLat?: number;
  carPoolToLng?: number;
}): CarpoolRouteInput => ({
  fromLabel: body.carPoolFromPoint ?? null,
  fromLat: body.carPoolFromLat ?? null,
  fromLng: body.carPoolFromLng ?? null,
  toLabel: body.carPoolToPoint ?? null,
  toLat: body.carPoolToLat ?? null,
  toLng: body.carPoolToLng ?? null,
});

export const assertCarpoolRouteWhenEnabled = (enabled: boolean, route: CarpoolRouteInput): void => {
  if (!enabled) return;

  if (
    route.fromLat == null ||
    route.fromLng == null ||
    route.toLat == null ||
    route.toLng == null
  ) {
    throw new ApiError(
      400,
      'carpool_route_required',
      'Car pool requires from and to map locations.'
    );
  }

  if (!route.fromLabel?.trim() || !route.toLabel?.trim()) {
    throw new ApiError(
      400,
      'carpool_route_labels_required',
      'Car pool requires from and to location labels.'
    );
  }
};

const buildLinkedCarpoolTitle = (parentTitle: string): string =>
  `Carpool · ${parentTitle}`.slice(0, 120);

export const syncLinkedCarpoolForParent = async (input: {
  parent: Activity;
  tenantId: string;
  actorUserId: string;
  enabled: boolean;
  route: CarpoolRouteInput;
  carPoolFree: boolean | null;
  carPoolPriceAed: number | null;
  carPoolSeats: number | null;
  carPoolDetails: string | null;
  parentTitle: string;
  parentImages: string[];
  parentHostId: string | null;
}): Promise<string | null> => {
  const existing = await findLinkedCarpoolDocByParentId(input.parent.id);

  if (!input.enabled) {
    if (existing) {
      if (existing.status !== ActivityStatus.CANCELLED) {
        await cancelActivityById(existing._id);
      }
      await patchActivityInMongo(input.parent.id, {
        linkedCarpoolActivityId: null,
        updatedAt: new Date(),
      });
    }
    return null;
  }

  assertCarpoolRouteWhenEnabled(true, input.route);

  const fromLabel = input.route.fromLabel!.trim();
  const toLabel = input.route.toLabel!.trim();
  const seats = input.carPoolSeats ?? 4;
  const shared = input.carPoolFree === false;
  const carpoolTitle = buildLinkedCarpoolTitle(input.parentTitle);
  const carpoolDescription =
    input.carPoolDetails?.trim() ||
    `Shared ride linked to ${input.parentTitle}. Pickup and drop-off confirmed after joining.`;

  const carpoolFields = {
    meetingPoint: fromLabel,
    meetingLat: input.route.fromLat!,
    meetingLng: input.route.fromLng!,
    startPoint: toLabel,
    startLat: input.route.toLat!,
    startLng: input.route.toLng!,
    carPoolEnabled: true,
    carPoolFree: input.carPoolFree,
    carPoolPriceAed: shared ? input.carPoolPriceAed ?? 0 : null,
    carPoolSeats: seats,
    carPoolDetails: input.carPoolDetails,
    title: carpoolTitle,
    description: carpoolDescription.slice(0, 2000),
    capacity: seats,
    priceAed: 0,
    pricingMode: shared ? ('shared' as const) : ('free' as const),
    images: input.parentImages.slice(0, 1),
    startAt: input.parent.startAt,
  };

  if (existing) {
    await updateActivityDetailed(existing._id, {
      ...carpoolFields,
      host: input.parentHostId ? { connect: { id: input.parentHostId } } : undefined,
    });
    await patchActivityInMongo(existing._id, {
      linkedActivityId: input.parent.id,
      activityType: ActivityType.CARPOOL,
      updatedAt: new Date(),
    });
    await patchActivityInMongo(input.parent.id, {
      linkedCarpoolActivityId: existing._id,
      updatedAt: new Date(),
    });

    if (
      input.parent.status === ActivityStatus.PUBLISHED &&
      existing.status === ActivityStatus.DRAFT
    ) {
      await publishActivityById(existing._id);
    }

    return existing._id;
  }

  const created = await createActivityDetailed({
    tenant: { connect: { id: input.tenantId } },
    location: { connect: { id: input.parent.locationId } },
    createdBy: { connect: { id: input.actorUserId } },
    host: input.parentHostId ? { connect: { id: input.parentHostId } } : undefined,
    activityType: ActivityType.CARPOOL,
    status: input.parent.status,
    publishedAt: input.parent.publishedAt,
    linkedActivityId: input.parent.id,
    ...carpoolFields,
  });

  await patchActivityInMongo(created.id, { linkedActivityId: input.parent.id });
  await patchActivityInMongo(input.parent.id, {
    linkedCarpoolActivityId: created.id,
    updatedAt: new Date(),
  });

  return created.id;
};

export const publishLinkedCarpoolIfNeeded = async (parentActivityId: string): Promise<void> => {
  const linked = await findLinkedCarpoolDocByParentId(parentActivityId);
  if (!linked || linked.status !== ActivityStatus.DRAFT) return;
  await publishActivityById(linked._id);
};
