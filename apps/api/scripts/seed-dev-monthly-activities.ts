import crypto from 'crypto';
import {
  ActivityStatus,
  ActivityType,
  RequestStatus,
  ReviewTargetType,
} from '../src/domain/enums.js';
import {
  buildActivityFromCreateInput,
  type ActivityCreateInput,
} from '../src/lib/entity-builders.js';
import { COLLECTIONS } from '../src/lib/collections.js';
import { findActivityDocInMongo, writeActivityDocToMongo } from '../src/lib/entity-sync.js';
import { getMongoClient } from '../src/lib/mongo.js';
import { createSocialReview } from '../src/lib/social-reviews-store.js';
import type { DemoActivitySeedContext } from './seed-demo-scheduled-activities.js';
import { DEV_RICH_CATALOG_LOCATIONS } from './seed-dev-rich-catalog.js';

const CORE_ACTIVITY_LOCATIONS = [
  'jebel-jais-summit-trail',
  'wadi-shawka-loop',
  'fossil-rock-desert-camp',
  'hatta-dam-loop',
  'hatta-wadi-hub-loop',
  'al-qudra-cycling-loop',
  'jumeirah-kite-beach',
  'khorfakkan-beach-trail',
  'al-ain-desert-camp',
  'dibba-beach-camp',
];

const LOCATION_POOL = [
  ...CORE_ACTIVITY_LOCATIONS,
  ...DEV_RICH_CATALOG_LOCATIONS.map((row) => row.id),
];

const MONTHS_TO_SEED = 3;
const ACTIVITIES_PER_MONTH = 15;

const MONTHLY_TYPE_PLAN: ActivityType[] = [
  ActivityType.HIKING,
  ActivityType.HIKING,
  ActivityType.HIKING,
  ActivityType.HIKING,
  ActivityType.HIKING,
  ActivityType.HIKING,
  ActivityType.CAMPING,
  ActivityType.CAMPING,
  ActivityType.CAMPING,
  ActivityType.CAMPING,
  ActivityType.EVENT,
  ActivityType.EVENT,
  ActivityType.EVENT,
  ActivityType.RIDESHARE,
  ActivityType.RIDESHARE,
];

const outingCategoryFor = (type: ActivityType): string => {
  if (type === ActivityType.HIKING) return 'hiking';
  if (type === ActivityType.CAMPING) return 'camping';
  if (type === ActivityType.RIDESHARE) return 'rideshare';
  if (type === ActivityType.SHOP) return 'activities';
  return 'events';
};

const titleFor = (type: ActivityType, locationId: string, monthIndex: number, slot: number): string => {
  const labels: Record<string, string> = {
    'jebel-jais-summit-trail': 'Jebel Jais',
    'wadi-shawka-loop': 'Wadi Shawka',
    'fossil-rock-desert-camp': 'Fossil Rock',
    'hatta-dam-loop': 'Hatta Dam',
    'al-rabi-khorfakkan-trail': 'Al Rabi',
    'mleiha-fossil-rock-hike': 'Mleiha',
    'stairway-to-heaven-rak': 'Stairway ridge',
  };
  const place = labels[locationId] ?? locationId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const monthTag = `M${monthIndex + 1}`;
  if (type === ActivityType.RIDESHARE) return `${monthTag} rideshare → ${place}`;
  if (type === ActivityType.CAMPING) return `${monthTag} overnight — ${place}`;
  if (type === ActivityType.EVENT) return `${monthTag} community meetup — ${place}`;
  return `${monthTag} group hike — ${place} #${slot + 1}`;
};

const calendarStartAt = (monthOffset: number, slotIndex: number): Date => {
  const anchor = new Date();
  const year = anchor.getFullYear();
  const month = anchor.getMonth() + monthOffset;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const usableDays = Math.max(daysInMonth - 3, 15);
  const day = 2 + Math.floor((slotIndex * usableDays) / ACTIVITIES_PER_MONTH);
  const hour = 6 + (slotIndex % 5) * 2;
  const minute = slotIndex % 2 === 0 ? 0 : 30;
  return new Date(year, month, Math.min(day, daysInMonth - 1), hour, minute, 0, 0);
};

const stableActivityId = (monthOffset: number, slotIndex: number): string =>
  `seed-dev-cal-m${monthOffset}-s${String(slotIndex).padStart(2, '0')}`;

const upsertEvent = async (id: string, data: ActivityCreateInput) => {
  const doc = buildActivityFromCreateInput(data, id);
  const existing = await findActivityDocInMongo(id);
  if (existing) {
    doc.createdAt = existing.createdAt;
  }
  await writeActivityDocToMongo(doc);
};

const db = () => getMongoClient()!.db();

const seedApprovedParticipant = async (
  activityId: string,
  userId: string,
  reviewerId: string
): Promise<void> => {
  const now = new Date();
  const existingRequest = await db().collection(COLLECTIONS.ACTIVITY_REQUESTS).findOne({ activityId, userId });
  const requestId = existingRequest?._id ?? crypto.randomUUID();

  await db()
    .collection(COLLECTIONS.ACTIVITY_REQUESTS)
    .updateOne(
      { activityId, userId },
      {
        $set: {
          status: RequestStatus.APPROVED,
          reviewedById: reviewerId,
          reviewedAt: now,
          updatedAt: now,
        },
        $setOnInsert: {
          _id: requestId,
          note: null,
          hostNote: 'See you on the trail.',
          cancelReason: null,
          cancelMessage: null,
          cancelledAt: null,
          selectedPackageIndex: null,
          createdAt: now,
        },
      },
      { upsert: true }
    );

  await db()
    .collection(COLLECTIONS.ACTIVITY_PARTICIPANTS)
    .updateOne(
      { requestId },
      {
        $set: { activityId, userId, approvedById: reviewerId },
        $setOnInsert: {
          _id: crypto.randomUUID(),
          checkedInAt: null,
          createdAt: now,
        },
      },
      { upsert: true }
    );
};

const seedPendingRequest = async (
  activityId: string,
  userId: string
): Promise<void> => {
  const now = new Date();
  await db()
    .collection(COLLECTIONS.ACTIVITY_REQUESTS)
    .updateOne(
      { activityId, userId },
      {
        $set: {
          status: RequestStatus.PENDING,
          note: 'Can I join this date?',
          updatedAt: now,
        },
        $setOnInsert: {
          _id: crypto.randomUUID(),
          hostNote: null,
          cancelReason: null,
          cancelMessage: null,
          cancelledAt: null,
          selectedPackageIndex: null,
          reviewedAt: null,
          reviewedById: null,
          createdAt: now,
        },
      },
      { upsert: true }
    );
};

const upsertActivityReview = async (input: {
  userId: string;
  activityId: string;
  rating: number;
  comment: string;
}): Promise<void> => {
  const existing = await db().collection(COLLECTIONS.SOCIAL_REVIEWS).findOne({
    userId: input.userId,
    targetType: ReviewTargetType.ACTIVITY,
    targetId: input.activityId,
  });
  if (existing) {
    await db()
      .collection(COLLECTIONS.SOCIAL_REVIEWS)
      .updateOne({ _id: existing._id }, { $set: { rating: input.rating, comment: input.comment } });
    return;
  }
  await createSocialReview({
    userId: input.userId,
    targetType: ReviewTargetType.ACTIVITY,
    targetId: input.activityId,
    rating: input.rating,
    comment: input.comment,
  });
};

export type DevMonthlyActivitySeedResult = {
  published: number;
  months: number;
  participantsSeeded: number;
  pendingRequests: number;
  reviews: number;
};

export const seedDevMonthlyActivities = async (
  ctx: DemoActivitySeedContext,
  participantUserIds: string[]
): Promise<DevMonthlyActivitySeedResult> => {
  let published = 0;
  let participantsSeeded = 0;
  let pendingRequests = 0;
  let reviews = 0;

  for (let monthOffset = 0; monthOffset < MONTHS_TO_SEED; monthOffset += 1) {
    for (let slot = 0; slot < ACTIVITIES_PER_MONTH; slot += 1) {
      const activityType = MONTHLY_TYPE_PLAN[slot];
      const locationId = LOCATION_POOL[(monthOffset * ACTIVITIES_PER_MONTH + slot) % LOCATION_POOL.length];
      const id = stableActivityId(monthOffset, slot);
      const useAgency = slot % 2 === 0;
      const tenantId = useAgency ? ctx.agencyTenantId : ctx.individualHostTenantId;
      const createdBy = useAgency ? ctx.agencyOwnerId : ctx.individualHostId;
      const hostId = useAgency ? ctx.agencyGuideId : ctx.individualHostId;
      const startAt = calendarStartAt(monthOffset, slot);

      const base: ActivityCreateInput = {
        tenantId: tenantId,
        locationId: locationId,
        createdById: createdBy,
        hostId: hostId,
        activityType,
        title: titleFor(activityType, locationId, monthOffset, slot),
        description: `Dev calendar outing (${activityType}) anchored at ${locationId}.`,
        startAt,
        meetingPoint: 'Coordinates shared after join approval',
        meetingLat: null,
        meetingLng: null,
        priceAed: activityType === ActivityType.CAMPING ? 120 : activityType === ActivityType.RIDESHARE ? 35 : 0,
        capacity: activityType === ActivityType.RIDESHARE ? 4 : 16,
        status: ActivityStatus.PUBLISHED,
        publishedAt: new Date(),
        itinerary: ['Meet at listed time', 'Main activity block', 'Wrap and share photos'],
        requirements: ['Water', 'Sun protection', 'Trail-appropriate footwear'],
        outingCategory: outingCategoryFor(activityType),
        ...(activityType === ActivityType.EVENT ? { participationMode: 'rsvp' as const } : {}),
        ...(activityType === ActivityType.RIDESHARE
          ? {
              rideshareEnabled: true,
              rideshareSeats: 4,
              pricingMode: 'shared' as const,
            }
          : {}),
      };

      await upsertEvent(id, base);
      published += 1;

      if (participantUserIds.length === 0) continue;

      const primary = participantUserIds[slot % participantUserIds.length];
      const secondary = participantUserIds[(slot + 1) % participantUserIds.length];
      const reviewer = useAgency ? ctx.agencyOwnerId : ctx.individualHostId;

      if (slot % 3 !== 2) {
        await seedApprovedParticipant(id, primary, reviewer);
        participantsSeeded += 1;
      }
      if (slot % 4 === 1 && secondary !== primary) {
        await seedPendingRequest(id, secondary);
        pendingRequests += 1;
      }
      if (monthOffset === 0 && slot < 5) {
        await upsertActivityReview({
          userId: primary,
          activityId: id,
          rating: 4 + (slot % 2),
          comment: 'Well organized — good pacing and clear meetup pin.',
        });
        reviews += 1;
      }
    }
  }

  return {
    published,
    months: MONTHS_TO_SEED,
    participantsSeeded,
    pendingRequests,
    reviews,
  };
};
