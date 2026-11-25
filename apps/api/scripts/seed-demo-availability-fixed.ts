import type { AvailabilityKind, MemberAvailabilitySlotDTO, ScheduleModality } from '@uaetrail/shared-types';
import { isScheduleModality } from '@uaetrail/shared-types';
import { formatActivityLocal, parseLocalDateTime } from '../src/lib/datetime.js';
import { COLLECTIONS } from '../src/lib/collections.js';
import { getMongoClient } from '../src/lib/mongo.js';
import { invalidateExploreMapCache } from '../src/lib/explore-map-cache.js';
import { mergeMemberAvailabilityFixedSlotsMigration } from '../src/lib/member-availability-store.js';
import { ActivityStatus } from '../src/domain/enums.js';

/** Stable slot ids — same keys as retired demo `participant_intent` rows. */
export const SEED_FIXED_AVAILABILITY_SLOT_IDS = [
  'seed-demand-hike-hatta',
  'seed-demand-camp-fossil-rock',
  'seed-demand-event-kite-beach',
  'seed-demand-rideshare-dxb-rak',
  'seed-demand-guide-wadi-shawka',
] as const;

const DEFAULT_COUNTRY = 'AE';

const rollForwardDaysFromNow = (daysAhead: number): string =>
  new Date(Date.now() + daysAhead * 86400000).toISOString().slice(0, 10);

const seedFixedKindProjection = (
  kind: AvailabilityKind
): { capacity: 'participant' | 'guide'; modalities: ScheduleModality[] } => {
  if (kind === 'guide') {
    return { capacity: 'guide', modalities: ['hiking'] };
  }
  if (isScheduleModality(kind)) {
    return { capacity: 'participant', modalities: [kind] };
  }
  return { capacity: 'participant', modalities: ['other'] };
};

export const upsertSeedAvailabilityFixedPin = async (input: {
  slotId: string;
  userId: string;
  destinationId: string;
  kind: AvailabilityKind;
  title: string;
  date: string;
  time: string | null;
  latitude: number;
  longitude: number;
  note?: string | null;
}): Promise<void> => {
  const time = input.time?.trim() || '09:00';
  const startAt = parseLocalDateTime(input.date, time, DEFAULT_COUNTRY).toISOString();
  const projection = seedFixedKindProjection(input.kind);
  const slot: MemberAvailabilitySlotDTO = {
    slotId: input.slotId,
    scheduleKind: 'fixed',
    startDate: input.date,
    endDate: input.date,
    startAt,
    endAt: startAt,
    title: input.title.trim(),
    latitude: input.latitude,
    longitude: input.longitude,
    locationPrecision: 'specific',
    timeBand: null,
    capacity: projection.capacity,
    modalities: projection.modalities,
    engagementTerms:
      projection.capacity === 'guide'
        ? { pricingKind: 'upon_request', tourShape: 'either' }
        : null,
  };

  await mergeMemberAvailabilityFixedSlotsMigration(input.userId, {
    kinds: [...projection.modalities],
    visibility: 'public',
    destinationId: input.areaId,
    note: input.note?.trim() || null,
    fixedSlots: [slot],
  });
};

const slotRollForward = (
  slot: MemberAvailabilitySlotDTO,
  daysAheadWhenStale: number
): { slot: MemberAvailabilitySlotDTO; rolled: boolean } => {
  const today = new Date().toISOString().slice(0, 10);
  if (slot.startDate >= today) {
    return { slot, rolled: false };
  }
  const time =
    slot.startAt && Number.isFinite(Date.parse(slot.startAt))
      ? formatActivityLocal(new Date(slot.startAt), DEFAULT_COUNTRY).time
      : '09:00';
  const newDate = rollForwardDaysFromNow(daysAheadWhenStale);
  const startAt = parseLocalDateTime(newDate, time, DEFAULT_COUNTRY).toISOString();
  return {
    rolled: true,
    slot: {
      ...slot,
      startDate: newDate,
      endDate: newDate,
      startAt,
      endAt: startAt,
    },
  };
};

const refreshAvailabilityFixedSlots = async (options?: {
  slotIdFilter?: Set<string>;
  daysAheadWhenStale?: number;
}): Promise<{ updated: number; rolledForward: number }> => {
  const db = getMongoClient()!.db();
  const col = db.collection(COLLECTIONS.MEMBER_AVAILABILITY);
  const daysAhead = options?.daysAheadWhenStale ?? 5;
  let updatedDocs = 0;
  let rolledForward = 0;

  const docs = await col.find({ visibility: 'public' }).toArray();
  for (const doc of docs) {
    let docChanged = false;
    const slots = (doc.slots ?? []).map((raw) => {
      const slot = raw as MemberAvailabilitySlotDTO;
      if (slot.scheduleKind !== 'fixed' || !slot.slotId) return slot;
      if (options?.slotIdFilter && !options.slotIdFilter.has(slot.slotId)) return slot;
      const { slot: next, rolled } = slotRollForward(slot, daysAhead);
      if (rolled) {
        docChanged = true;
        rolledForward += 1;
      }
      return next;
    });
    if (docChanged) {
      await col.updateOne({ _id: doc._id }, { $set: { slots, updatedAt: new Date() } });
      updatedDocs += 1;
    }
  }

  if (updatedDocs > 0) {
    await invalidateExploreMapCache();
  }

  return { updated: updatedDocs, rolledForward };
};

/** Dev/ops — roll stale public fixed slots forward (all members). */
export const refreshPublicAvailabilityFixedSchedules = async (): Promise<{
  updated: number;
  rolledForward: number;
}> => refreshAvailabilityFixedSlots();

/** After seed upserts demo fixed slots, roll dates forward so `GET /explore/map` stays populated. */
export const refreshSeedAvailabilityFixedSchedules = async (): Promise<{ updated: number }> => {
  const db = getMongoClient()!.db();
  const result = await refreshAvailabilityFixedSlots({
    slotIdFilter: new Set(SEED_FIXED_AVAILABILITY_SLOT_IDS),
  });

  await db.collection(COLLECTIONS.ACTIVITIES).updateMany(
    {
      activityMode: 'seeking',
      participantIntentId: { $in: [...SEED_FIXED_AVAILABILITY_SLOT_IDS] },
      status: { $ne: ActivityStatus.CANCELLED },
    },
    { $set: { status: ActivityStatus.CANCELLED, updatedAt: new Date() } }
  );

  return { updated: result.updated };
};