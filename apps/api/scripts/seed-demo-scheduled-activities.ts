import { ActivityStatus, ActivityType } from '../src/domain/enums.js';
import { findAuthUserByEmail, findAuthUsersByIds } from '../src/lib/auth-users-store.js';
import type { ActivityGuideRecord } from '../src/domain/types.js';
import {
  buildActivityFromCreateInput,
  type ActivityCreateInput,
} from '../src/lib/entity-builders.js';
import { COLLECTIONS } from '../src/lib/collections.js';
import { findActivityDocInMongo, writeActivityDocToMongo } from '../src/lib/entity-sync.js';
import { invalidateExploreMapCache } from '../src/lib/explore-map-cache.js';
import { connectMongo, getMongoClient } from '../src/lib/mongo.js';
import { findTenantById } from '../src/lib/tenant-store.js';
import type { MemberVehicleColor } from '@uaetrail/shared-types';

const AGENCY_TENANT_ID = 'tenant-uae-adventure';
const HOST_TENANT_ID = 'tenant-desert-explorer';

/** Stable garage row for Omar (individual host) — linked from demo rideshare outings. */
export const DEMO_INDIVIDUAL_HOST_VEHICLE_ID = 'seed-member-vehicle-omar-landcruiser';

const DEMO_INDIVIDUAL_HOST_VEHICLE = {
  make: 'Toyota',
  model: 'Land Cruiser',
  color: 'blue' as MemberVehicleColor,
  year: 2019,
  plateNumber: 'L 48291',
};

const demoIndividualHostVehiclePublicSnapshot = () => ({
  id: DEMO_INDIVIDUAL_HOST_VEHICLE_ID,
  make: DEMO_INDIVIDUAL_HOST_VEHICLE.make,
  model: DEMO_INDIVIDUAL_HOST_VEHICLE.model,
  color: DEMO_INDIVIDUAL_HOST_VEHICLE.color,
  year: DEMO_INDIVIDUAL_HOST_VEHICLE.year,
});

const ensureDemoIndividualHostVehicle = async (userId: string): Promise<void> => {
  const now = new Date();
  await getMongoClient()!
    .db()
    .collection<{
      _id: string;
      userId: string;
      make: string;
      model: string;
      color: MemberVehicleColor;
      year: number;
      plateNumber: string;
      createdAt: Date;
      updatedAt: Date;
    }>(COLLECTIONS.MEMBER_VEHICLES)
    .updateOne(
      { _id: DEMO_INDIVIDUAL_HOST_VEHICLE_ID },
      {
        $set: {
          userId,
          ...DEMO_INDIVIDUAL_HOST_VEHICLE,
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true }
    );
};

/** Published demo outings that should appear on `GET /explore/map` (refreshed on ensure). */
export const DEMO_EXPLORE_PUBLISHED_ACTIVITY_IDS = [
  'seed-event-jais',
  'seed-event-fossil-camp',
  'seed-event-shawka-free',
  'seed-event-desert-meetup',
  'seed-event-kite-beach-run',
  'seed-event-rideshare-marina-jais',
  'seed-event-boulder-session',
  'seed-event-hatta-dam-social-hike',
  'seed-event-al-ain-dunes-camp',
  'seed-event-khorfakkan-coastal-walk',
] as const;

export type DemoActivitySeedContext = {
  agencyTenantId: string;
  individualHostTenantId: string;
  agencyOwnerId: string;
  agencyGuideId: string;
  individualHostId: string;
};

const upsertEvent = async (id: string, data: ActivityCreateInput) => {
  const doc = buildActivityFromCreateInput(data, id);
  const existing = await findActivityDocInMongo(id);
  if (existing) {
    doc.createdAt = existing.createdAt;
  }
  await writeActivityDocToMongo(doc);
  return doc;
};

const acceptedGuides = async (
  userIds: string[],
  assignedByUserId: string
): Promise<ActivityGuideRecord[]> => {
  const now = new Date();
  const users = await findAuthUsersByIds(userIds);
  const byId = new Map(users.map((user) => [user._id, user]));
  return userIds.map((userId) => {
    const user = byId.get(userId);
    return {
      userId,
      displayName: user?.profile.displayName?.trim() || 'Guide',
      avatarUrl: user?.profile.avatarUrl ?? null,
      status: 'accepted' as const,
      assignedByUserId,
      assignedAt: now,
      respondedAt: now,
    };
  });
};

const attachGuides = async (activityId: string, userIds: string[], assignedByUserId: string) => {
  const doc = await findActivityDocInMongo(activityId);
  if (!doc) return;
  doc.guides = await acceptedGuides(userIds, assignedByUserId);
  await writeActivityDocToMongo(doc);
};

const daysFromNow = (days: number, hours: number, minutes = 0): Date => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hours, minutes, 0, 0);
  return date;
};

/** Idempotent demo scheduled activities — dates roll forward on each run. */
export const seedDemoScheduledActivities = async (
  ctx: DemoActivitySeedContext
): Promise<{ jaisActivityId: string }> => {
  const event = await upsertEvent('seed-event-jais', {
    tenantId: ctx.agencyTenantId,
    locationId: 'jebel-jais-summit-trail',
    createdById: ctx.agencyOwnerId,
    hostId: ctx.agencyGuideId,
    activityType: ActivityType.HIKING,
    title: 'Jebel Jais Group Hike',
    description: 'Guided early morning summit trek.',
    startAt: daysFromNow(7, 6),
    meetingPoint: 'Jebel Jais Base Parking',
    meetingLat: 25.9433,
    meetingLng: 56.1422,
    priceAed: 120,
    capacity: 15,
    status: ActivityStatus.PUBLISHED,
    publishedAt: new Date(),
    itinerary: ['Meet at 6:00 AM', 'Summit climb', 'Return by noon'],
    requirements: ['Water 2L', 'Hiking shoes', 'Cap and sunscreen'],
    outingCategory: 'hiking',
  });
  await attachGuides('seed-event-jais', [ctx.agencyGuideId, ctx.agencyOwnerId], ctx.agencyOwnerId);

  await upsertEvent('seed-event-fossil-camp', {
    tenantId: ctx.individualHostTenantId,
    locationId: 'fossil-rock-desert-camp',
    createdById: ctx.individualHostId,
    hostId: ctx.individualHostId,
    activityType: ActivityType.CAMPING,
    title: 'Fossil Rock Overnight Camp',
    description: 'Desert camping with stargazing and sunrise photography.',
    startAt: daysFromNow(14, 16),
    meetingPoint: 'Sharjah Desert Road (coordinates shared upon booking)',
    meetingLat: 25.2185,
    meetingLng: 55.8521,
    priceAed: 200,
    capacity: 12,
    featured: true,
    status: ActivityStatus.PUBLISHED,
    publishedAt: new Date(),
    itinerary: ['Arrive by 4 PM', 'Set up camp', 'Sunset BBQ', 'Stargazing session', 'Sunrise photography'],
    requirements: ['Sleeping bag', 'Warm jacket', 'Camera (optional)', 'Water 3L'],
    outingCategory: 'camping',
  });

  await upsertEvent('seed-event-shawka-free', {
    tenantId: ctx.agencyTenantId,
    locationId: 'wadi-shawka-loop',
    createdById: ctx.agencyOwnerId,
    hostId: ctx.agencyGuideId,
    activityType: ActivityType.HIKING,
    title: 'Wadi Shawka Community Hike',
    description:
      'Free guided group hike through Wadi Shawka — open to all skill levels. A great intro to UAE trail culture with no cost to join.',
    startAt: daysFromNow(10, 7),
    meetingPoint: 'Wadi Shawka Dam parking',
    meetingLat: 25.3385,
    meetingLng: 56.1188,
    priceAed: 0,
    capacity: 20,
    featured: true,
    status: ActivityStatus.PUBLISHED,
    publishedAt: new Date(),
    itinerary: ['Meet at 7:00 AM', 'Loop trail through the wadi', 'Return by 11:00 AM'],
    requirements: ['Water 1.5L', 'Trail shoes', 'Sun protection'],
    outingCategory: 'hiking',
  });

  await upsertEvent('seed-event-omar-draft', {
    tenantId: ctx.individualHostTenantId,
    locationId: 'fossil-rock-desert-camp',
    createdById: ctx.individualHostId,
    hostId: ctx.individualHostId,
    activityType: ActivityType.HIKING,
    title: 'Omar — Wadi loop (draft)',
    description: 'Draft plan for host QA — publish from Trips when ready.',
    startAt: daysFromNow(30, 9),
    meetingPoint: 'Sharjah — exact pin after publish',
    meetingLat: 25.22,
    meetingLng: 55.85,
    priceAed: 0,
    capacity: 8,
    status: ActivityStatus.DRAFT,
    itinerary: ['Draft — edit before publish'],
    requirements: ['Water'],
    outingCategory: 'hiking',
  });

  await upsertEvent('seed-event-desert-meetup', {
    tenantId: ctx.individualHostTenantId,
    locationId: 'fossil-rock-desert-camp',
    createdById: ctx.individualHostId,
    hostId: ctx.individualHostId,
    activityType: ActivityType.EVENT,
    title: 'Desert Sunset Meetup (Free)',
    description:
      'Free afternoon desert meetup — stargazing tips, campfire chat, and sunset views. Bring your own gear; no overnight stay required.',
    startAt: daysFromNow(21, 15),
    meetingPoint: 'Fossil Rock approach road',
    meetingLat: 25.2192,
    meetingLng: 55.8495,
    priceAed: 0,
    capacity: 25,
    featured: true,
    status: ActivityStatus.PUBLISHED,
    publishedAt: new Date(),
    itinerary: ['Arrive by 3 PM', 'Sunset viewpoint', 'Campfire & stargazing intro', 'Wrap up by 9 PM'],
    requirements: ['Chair or mat', 'Warm layer', 'Snacks & water'],
    outingCategory: 'events',
    participationMode: 'rsvp',
  });

  await upsertEvent('seed-event-kite-beach-run', {
    tenantId: ctx.agencyTenantId,
    locationId: 'jumeirah-kite-beach',
    createdById: ctx.agencyOwnerId,
    hostId: ctx.agencyGuideId,
    activityType: ActivityType.EVENT,
    title: 'Kite Beach Sunrise Run',
    description: 'Community 5K along the Dubai Marina/Kite Beach track — all paces welcome.',
    startAt: daysFromNow(5, 6, 30),
    meetingPoint: 'Kite Beach running track',
    meetingLat: 25.1654,
    meetingLng: 55.2553,
    priceAed: 0,
    capacity: 30,
    featured: true,
    status: ActivityStatus.PUBLISHED,
    publishedAt: new Date(),
    itinerary: ['Warm-up 6:30 AM', '5K out-and-back', 'Stretch & coffee'],
    requirements: ['Running shoes', 'Water bottle', 'High-vis top'],
    outingCategory: 'events',
    participationMode: 'rsvp',
  });

  await ensureDemoIndividualHostVehicle(ctx.individualHostId);

  // Linked to `seed-event-jais` — explore map peek shows “Rideshare available” on the parent hike.
  await upsertEvent('seed-event-rideshare-marina-jais', {
    tenantId: ctx.individualHostTenantId,
    locationId: 'jebel-jais-summit-trail',
    createdById: ctx.individualHostId,
    hostId: ctx.individualHostId,
    activityType: ActivityType.RIDESHARE,
    linkedActivityId: 'seed-event-jais',
    title: 'Rideshare Dubai Marina → Jebel Jais',
    description: 'Shared ride for the Jebel Jais hike — split fuel costs.',
    startAt: daysFromNow(6, 5),
    meetingPoint: 'Dubai Marina Mall parking',
    meetingLat: 25.0782,
    meetingLng: 55.1394,
    startPoint: 'Jebel Jais Viewing Deck',
    startLat: 25.9433,
    startLng: 56.1422,
    pricingMode: 'shared',
    rideshareEnabled: true,
    rideshareFree: false,
    ridesharePriceAed: 35,
    rideshareSeats: 4,
    rideshareDetails:
      'Blue Toyota Land Cruiser (2019). AC on, roof rack for one hiking bag per seat. Non-smoking.',
    rideshareVehicleId: DEMO_INDIVIDUAL_HOST_VEHICLE_ID,
    rideshareVehicle: demoIndividualHostVehiclePublicSnapshot(),
    priceAed: 35,
    capacity: 4,
    featured: true,
    status: ActivityStatus.PUBLISHED,
    publishedAt: new Date(),
    itinerary: ['Depart Marina 5:00 AM', 'Arrive Jebel Jais ~7:00 AM'],
    requirements: ['Be on time', 'Share fuel cost at pickup', 'Max 1 bag per seat'],
    outingCategory: 'rideshare',
  });

  await upsertEvent('seed-event-boulder-session', {
    tenantId: ctx.agencyTenantId,
    locationId: 'hatta-dam-loop',
    createdById: ctx.agencyOwnerId,
    hostId: ctx.agencyGuideId,
    activityType: ActivityType.EVENT,
    outingCategory: 'activities',
    outingTopic: 'climbing',
    title: 'Evening boulder session (Hatta)',
    description: 'Outdoor bouldering meetup — all levels welcome; crash pads shared.',
    startAt: daysFromNow(9, 17),
    meetingPoint: 'Hatta Wadi Hub parking',
    meetingLat: 24.82,
    meetingLng: 56.13,
    priceAed: 0,
    capacity: 10,
    featured: true,
    status: ActivityStatus.PUBLISHED,
    publishedAt: new Date(),
    itinerary: ['Meet 5 PM', 'Warm-up problems', 'Wrap by 8 PM'],
    requirements: ['Activity type: Climb', 'Climbing shoes', 'Water'],
    participationMode: 'approval',
  });

  await upsertEvent('seed-event-hatta-dam-social-hike', {
    tenantId: ctx.individualHostTenantId,
    locationId: 'hatta-dam-loop',
    createdById: ctx.individualHostId,
    hostId: ctx.individualHostId,
    activityType: ActivityType.HIKING,
    title: 'Hatta Dam loop — social hike',
    description: 'Easy dam loop for new hikers — coffee stop after the walk.',
    startAt: daysFromNow(8, 8),
    meetingPoint: 'Hatta Dam parking',
    meetingLat: 24.7847,
    meetingLng: 56.118,
    priceAed: 0,
    capacity: 14,
    featured: true,
    status: ActivityStatus.PUBLISHED,
    publishedAt: new Date(),
    itinerary: ['Meet 8 AM', 'Dam loop', 'Coffee in Hatta town'],
    requirements: ['Trail shoes', 'Water 1L', 'Hat'],
    outingCategory: 'hiking',
  });

  await upsertEvent('seed-event-al-ain-dunes-camp', {
    tenantId: ctx.agencyTenantId,
    locationId: 'al-ain-desert-camp',
    createdById: ctx.agencyOwnerId,
    hostId: ctx.agencyGuideId,
    activityType: ActivityType.CAMPING,
    title: 'Al Ain dune camp weekend',
    description: 'Guided overnight on Remah dunes — tents provided, BYO sleeping bag.',
    startAt: daysFromNow(16, 15),
    meetingPoint: 'Al Ain desert access track',
    meetingLat: 24.05,
    meetingLng: 55.55,
    priceAed: 180,
    capacity: 10,
    featured: true,
    status: ActivityStatus.PUBLISHED,
    publishedAt: new Date(),
    itinerary: ['Arrive 3 PM', 'Camp setup', 'Sunset dunes', 'Breakfast pack-up'],
    requirements: ['Sleeping bag', 'Warm layers', 'Headlamp'],
    outingCategory: 'camping',
  });

  await upsertEvent('seed-event-khorfakkan-coastal-walk', {
    tenantId: ctx.agencyTenantId,
    locationId: 'khorfakkan-beach-trail',
    createdById: ctx.agencyOwnerId,
    hostId: ctx.agencyGuideId,
    activityType: ActivityType.EVENT,
    title: 'Khorfakkan corniche walk',
    description: 'Coastal walk under the Hajar Mountains — swim stop optional.',
    startAt: daysFromNow(11, 7, 30),
    meetingPoint: 'Khorfakkan corniche parking',
    meetingLat: 25.365,
    meetingLng: 56.352,
    priceAed: 0,
    capacity: 18,
    featured: true,
    status: ActivityStatus.PUBLISHED,
    publishedAt: new Date(),
    itinerary: ['Meet 7:30 AM', 'Corniche walk', 'Optional swim'],
    requirements: ['Sun protection', 'Water', 'Towel if swimming'],
    outingCategory: 'events',
    participationMode: 'rsvp',
  });

  return { jaisActivityId: event._id };
};

export const resolveDemoActivitySeedContext = async (): Promise<DemoActivitySeedContext | null> => {
  const agencyOwner = await findAuthUserByEmail('organizer@uaetrails.app');
  const agencyGuide = await findAuthUserByEmail('guide@uaetrails.app');
  const individualHost = await findAuthUserByEmail('host@uaetrails.app');
  const agencyTenant = await findTenantById(AGENCY_TENANT_ID);
  const individualHostTenant = await findTenantById(HOST_TENANT_ID);

  if (!agencyOwner || !agencyGuide || !individualHost || !agencyTenant || !individualHostTenant) {
    return null;
  }

  return {
    agencyTenantId: agencyTenant.id,
    individualHostTenantId: individualHostTenant.id,
    agencyOwnerId: agencyOwner._id,
    agencyGuideId: agencyGuide._id,
    individualHostId: individualHost._id,
  };
};

/** Refresh demo outing dates when full seed was skipped (common local dev). */
export const ensureDemoExploreActivities = async (): Promise<boolean> => {
  if (process.env.NODE_ENV === 'production') return false;
  if (process.env.SEED_ENSURE_EXPLORE_ACTIVITIES === '0') return false;

  const client = await connectMongo();
  if (!client) return false;

  const ctx = await resolveDemoActivitySeedContext();
  if (!ctx) {
    console.warn('[seed] ensureDemoExploreActivities skipped — demo users/tenants missing (run SEED_DATA=true npm run seed)');
    return false;
  }

  await seedDemoScheduledActivities(ctx);
  await invalidateExploreMapCache();
  console.log(
    `[seed] Refreshed ${DEMO_EXPLORE_PUBLISHED_ACTIVITY_IDS.length} demo explore activities (upcoming start dates)`
  );
  return true;
};
