import type { ExploreMapItemDTO, MemberAvailabilitySlotDTO } from '@uaetrail/shared-types';
import {
  BWL_EXPLORE_MAP_SOURCE,
  availabilityMapItemId,
  isFixedAvailabilitySlot,
  isScheduleModality,
  isValidAvailabilitySlot,
  memberProfilePath,
  primaryMapPinKindFromSlot,
} from '@uaetrail/shared-types';
import { randomUUID } from 'node:crypto';
import { profileDisplayNameFromAuthUser } from '../domain/person-name.js';
import {
  availabilitySlotOverlapsRange,
  prunePastAvailabilitySlots,
} from '@uaetrail/shared-types';
import { COLLECTIONS } from './collections.js';
import { getMongoClient } from './mongo.js';
import { findAuthUsersByIds } from './auth-users-store.js';
import { findPublishedAreaById } from './areas-store.js';

type MongoMemberAvailability = {
  userId: string;
  kinds: string[];
  visibility: string;
  areaId?: string | null;
  slots: MemberAvailabilitySlotDTO[];
};

const collection = () =>
  getMongoClient()!.db().collection<MongoMemberAvailability>(COLLECTIONS.MEMBER_AVAILABILITY);

const todayIsoUtc = (): string => new Date().toISOString().slice(0, 10);

const slotTitle = (slot: MemberAvailabilitySlotDTO): string => {
  if (slot.title?.trim()) return slot.title.trim();
  const label = slot.modalities?.find((m) => isScheduleModality(m)) ?? 'outdoors';
  const capacity = slot.capacity === 'guide' ? 'Guide · ' : '';
  return `${capacity}Available for ${label}`;
};

const formatDateTimeParts = (
  iso: string | null | undefined
): { date: string | null; time: string | null } => {
  if (!iso?.trim()) return { date: null, time: null };
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return { date: null, time: null };
  const d = new Date(ms);
  const date = d.toISOString().slice(0, 10);
  const time = d.toISOString().slice(11, 16);
  return { date, time };
};

/** Public fixed availability slots → activity-shaped explore map items. */
export const buildAvailabilityFixedMapItems = async (input: {
  areaSlugById: Map<string, string>;
  areaNameById: Map<string, string>;
}): Promise<ExploreMapItemDTO[]> => {
  const today = todayIsoUtc();
  const rangeEnd = '2099-12-31';
  const docs = await collection()
    .find({ visibility: 'public' })
    .limit(500)
    .toArray();

  const userIds = [...new Set(docs.map((d) => d.userId))];
  const users = await findAuthUsersByIds(userIds);
  const userMap = new Map(users.map((u) => [u._id, u]));

  const items: ExploreMapItemDTO[] = [];

  for (const doc of docs) {
    const slots = prunePastAvailabilitySlots(doc.slots ?? [], today).filter(
      (slot) =>
        isFixedAvailabilitySlot(slot) &&
        isValidAvailabilitySlot(slot) &&
        availabilitySlotOverlapsRange(slot, today, rangeEnd)
    );

    const authUser = userMap.get(doc.userId);
    const displayName = profileDisplayNameFromAuthUser(
      authUser ?? { email: `${doc.userId}@member.local`, profile: undefined }
    );

    for (const slot of slots) {
      const slotId = slot.slotId?.trim() || randomUUID();
      const lat = slot.latitude ?? null;
      const lng = slot.longitude ?? null;
      if (lat == null || lng == null) continue;

      const areaId = doc.areaId ?? null;
      const { date, time } = formatDateTimeParts(slot.startAt ?? `${slot.startDate}T12:00:00.000Z`);
      const endParts = formatDateTimeParts(slot.endAt);

      items.push({
        id: availabilityMapItemId(doc.userId, slotId),
        kind: primaryMapPinKindFromSlot(slot),
        source: BWL_EXPLORE_MAP_SOURCE.AVAILABILITY,
        title: slotTitle(slot),
        subtitle: displayName,
        latitude: lat,
        longitude: lng,
        path: memberProfilePath(doc.userId, { lens: 'available' }) ?? `/member/${doc.userId}`,
        featuredPerson: {
          userId: doc.userId,
          displayName,
          avatarUrl: authUser?.profile?.avatarUrl ?? null,
          role: 'host',
        },
        date,
        time,
        endDate: endParts.date,
        endTime: endParts.time,
        areaId,
        areaSlug: areaId ? input.areaSlugById.get(areaId) ?? null : null,
        areaName: areaId ? input.areaNameById.get(areaId) ?? null : null,
      });
    }
  }

  return items;
};
