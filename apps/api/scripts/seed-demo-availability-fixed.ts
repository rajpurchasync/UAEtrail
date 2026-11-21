import type { AvailabilityKind, MemberAvailabilitySlotDTO } from '@uaetrail/shared-types';
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
] as const;

const DEFAULT_COUNTRY = 'AE';

const rollForwardDaysFromNow = (daysAhead: number): string =>
  new Date(Date.now() + daysAhead * 86400000).toISOString().slice(0, 10);

export const upsertSeedAvailabilityFixedPin = async (input: {
  slotId: string;
  userId: string;
  areaId: string;
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
  };

  await mergeMemberAvailabilityFixedSlotsMigration(input.userId, {
    kinds: [input.kind],
    visibility: 'public',
    areaId: input.areaId,
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

/** After seed upserts demo fixed slots, roll dates forward so `GET /explore/map` stays populated. */
export const refreshSeedAvailabilityFixedSchedules = async (): Promise<{ updated: number }> => {
  const db = getMongoClient()!.db();
  const col = db.collection(COLLECTIONS.MEMBER_AVAILABILITY);
  const seedSlotIds = new Set<string>(SEED_FIXED_AVAILABILITY_SLOT_IDS);
  let updatedDocs = 0;

  const docs = await col.find({ visibility: 'public' }).toArray();
  for (const doc of docs) {
    let docChanged = false;
    const slots = (doc.slots ?? []).map((raw) => {
      const slot = raw as MemberAvailabilitySlotDTO;
      if (slot.scheduleKind !== 'fixed' || !slot.slotId || !seedSlotIds.has(slot.slotId)) {
        return slot;
      }
      const { slot: next, rolled } = slotRollForward(slot, 5);
      if (rolled) docChanged = true;
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

  await db.collection(COLLECTIONS.ACTIVITIES).updateMany(
    {
      activityMode: 'seeking',
      participantIntentId: { $in: [...SEED_FIXED_AVAILABILITY_SLOT_IDS] },
      status: { $ne: ActivityStatus.CANCELLED },
    },
    { $set: { status: ActivityStatus.CANCELLED, updatedAt: new Date() } }
  );

  return { updated: updatedDocs };
};