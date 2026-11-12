import type {
  AvailabilityKind,
  AvailabilityVisibility,
  ExploreAvailabilityClusterDTO,
  ExploreAvailablePersonDTO,
  MemberAvailabilityDTO,
  MemberAvailabilityPublicDTO,
  MemberAvailabilitySlotDTO,
  UpsertMemberAvailabilityInput,
} from '@uaetrail/shared-types';
import {
  AVAILABILITY_KINDS,
  availabilitySlotOverlapsRange,
  normalizeMemberAvailabilitySlotsForStorage,
  prunePastAvailabilitySlots,
} from '@uaetrail/shared-types';
import { ApiError } from './api-error.js';
import { COLLECTIONS } from './collections.js';
import { getMongoClient } from './mongo.js';
import { findAuthUsersByIds } from './auth-users-store.js';
import { findAreaBySlug, findPublishedAreaById } from './areas-store.js';
import { areAcceptedBuddies } from './buddy-store.js';
import {
  filterSubjectsVisibleInFindCrew,
  maySeeMemberLocationForViewer,
  readCityAudience,
} from './find-crew-visibility-gate.js';

type MongoMemberAvailability = {
  _id: string;
  userId: string;
  kinds: AvailabilityKind[];
  visibility: AvailabilityVisibility;
  region: string | null;
  areaId: string | null;
  note: string | null;
  slots: MemberAvailabilitySlotDTO[];
  updatedAt: Date;
};

const collection = () =>
  getMongoClient()!.db().collection<MongoMemberAvailability>(COLLECTIONS.MEMBER_AVAILABILITY);

const todayIsoUtc = (): string => new Date().toISOString().slice(0, 10);

const sanitizeKinds = (kinds: AvailabilityKind[]): AvailabilityKind[] => {
  const allowed = new Set(AVAILABILITY_KINDS);
  return [...new Set(kinds.filter((k) => allowed.has(k)))];
};

const sanitizeSlots = (slots: MemberAvailabilitySlotDTO[]): MemberAvailabilitySlotDTO[] => {
  const today = todayIsoUtc();
  return prunePastAvailabilitySlots(normalizeMemberAvailabilitySlotsForStorage(slots), today);
};

const mapDto = (doc: MongoMemberAvailability): MemberAvailabilityDTO => ({
  userId: doc.userId,
  kinds: doc.kinds,
  visibility: doc.visibility,
  region: doc.region,
  areaId: doc.areaId,
  note: doc.note,
  slots: doc.slots,
  updatedAt: doc.updatedAt.toISOString(),
});

export const getMemberAvailability = async (userId: string): Promise<MemberAvailabilityDTO> => {
  const doc = await collection().findOne({ _id: userId });
  if (!doc) {
    return {
      userId,
      kinds: [],
      visibility: 'hidden',
      region: null,
      areaId: null,
      note: null,
      slots: [],
      updatedAt: new Date(0).toISOString(),
    };
  }
  const pruned = sanitizeSlots(doc.slots);
  if (pruned.length !== doc.slots.length) {
    await collection().updateOne({ _id: userId }, { $set: { slots: pruned, updatedAt: new Date() } });
  }
  return mapDto({ ...doc, slots: pruned });
};

export const upsertMemberAvailability = async (
  userId: string,
  input: UpsertMemberAvailabilityInput
): Promise<MemberAvailabilityDTO> => {
  const kinds = sanitizeKinds(input.kinds);
  const slots = sanitizeSlots(input.slots ?? []);
  if (input.visibility !== 'hidden' && slots.length === 0) {
    throw new ApiError(
      400,
      'availability_slots_required',
      'Add at least one future available day or set visibility to hidden.'
    );
  }
  const now = new Date();
  const doc: MongoMemberAvailability = {
    _id: userId,
    userId,
    kinds,
    visibility: input.visibility,
    region: input.region?.trim() || null,
    areaId: input.areaId?.trim() || null,
    note: input.note?.trim() || null,
    slots,
    updatedAt: now,
  };
  await collection().updateOne({ _id: userId }, { $set: doc }, { upsert: true });
  return mapDto(doc);
};

const viewerMaySeeAvailability = async (
  doc: MongoMemberAvailability,
  viewerUserId: string | null
): Promise<boolean> => {
  if (doc.visibility === 'hidden' || doc.slots.length === 0) return false;
  if (doc.visibility === 'public') return true;
  if (!viewerUserId) return false;
  if (doc.userId === viewerUserId) return true;
  return areAcceptedBuddies(doc.userId, viewerUserId);
};

export const getMemberAvailabilityPublicSnapshot = async (
  memberUserId: string,
  viewerUserId: string | null
): Promise<MemberAvailabilityPublicDTO | null> => {
  const doc = await collection().findOne({ _id: memberUserId });
  if (!doc) return null;
  const slots = sanitizeSlots(doc.slots);
  const visible = await viewerMaySeeAvailability({ ...doc, slots }, viewerUserId);
  if (!visible) return null;
  const users = await findAuthUsersByIds([memberUserId]);
  const user = users[0];
  const cityAudience = readCityAudience(user?.profile);
  const maySeeLocation =
    cityAudience === 'hidden'
      ? viewerUserId === memberUserId
      : await maySeeMemberLocationForViewer(
          user ?? { _id: memberUserId, profile: undefined },
          viewerUserId
        );
  return {
    kinds: doc.kinds,
    region: maySeeLocation ? doc.region : null,
    areaId: maySeeLocation ? doc.areaId : null,
    note: doc.note,
    slots,
  };
};

export type ExploreAvailabilityQuery = {
  viewerUserId: string | null;
  rangeStart: string;
  rangeEnd: string;
  kind?: AvailabilityKind | null;
  areaSlug?: string | null;
  buddiesOnly?: boolean;
};

export type ExploreAvailabilityIndex = {
  people: ExploreAvailablePersonDTO[];
  clusters: ExploreAvailabilityClusterDTO[];
};

export const loadExploreAvailabilityIndex = async (
  query: ExploreAvailabilityQuery
): Promise<ExploreAvailabilityIndex> => {
  const area =
    query.areaSlug?.trim()
      ? await findAreaBySlug(query.areaSlug.trim().toLowerCase())
      : null;
  const areaIdFilter = area?.status === 'published' ? area.id : null;

  const docs = await collection()
    .find({
      visibility: { $ne: 'hidden' },
      ...(query.kind ? { kinds: query.kind } : {}),
      ...(areaIdFilter ? { areaId: areaIdFilter } : {}),
    })
    .toArray();

  const people: ExploreAvailablePersonDTO[] = [];
  const clusterCounts = new Map<string, ExploreAvailabilityClusterDTO>();

  const candidateUserIds = [...new Set(docs.map((doc) => doc.userId))];
  const users = await findAuthUsersByIds(candidateUserIds);
  const userMap = new Map(users.map((u) => [u._id, u]));
  const findCrewVisible = await filterSubjectsVisibleInFindCrew(users, query.viewerUserId);

  for (const doc of docs) {
    const slots = sanitizeSlots(doc.slots).filter((slot) =>
      availabilitySlotOverlapsRange(slot, query.rangeStart, query.rangeEnd)
    );
    if (slots.length === 0) continue;
    if (query.kind && !doc.kinds.includes(query.kind)) continue;

    const maySee = await viewerMaySeeAvailability({ ...doc, slots }, query.viewerUserId);
    if (!maySee) continue;
    if (!findCrewVisible.has(doc.userId)) continue;

    const user = userMap.get(doc.userId);
    if (!user) continue;

    const isBuddy =
      query.viewerUserId != null && doc.userId !== query.viewerUserId
        ? await areAcceptedBuddies(doc.userId, query.viewerUserId)
        : false;
    if (query.buddiesOnly && !isBuddy) continue;

    const maySeeLocation = await maySeeMemberLocationForViewer(user, query.viewerUserId, {
      isBuddy,
    });
    // Area-filtered Find Crew must not match members who hide their start area.
    if (areaIdFilter && !maySeeLocation) continue;

    const region = maySeeLocation ? doc.region : null;
    const areaId = maySeeLocation ? doc.areaId : null;

    people.push({
      userId: doc.userId,
      displayName: user.profile?.displayName ?? 'Member',
      avatarUrl: user.profile?.avatarUrl ?? null,
      kinds: doc.kinds,
      region,
      areaId,
      slots,
      isBuddy,
    });

    for (const kind of doc.kinds) {
      if (query.kind && kind !== query.kind) continue;
      if (!maySeeLocation) continue;
      const clusterKey = `${areaId ?? region ?? 'any'}:${kind}`;
      const existing = clusterCounts.get(clusterKey);
      if (existing) {
        existing.count += 1;
      } else {
        let areaSlug: string | null = null;
        if (areaId) {
          const row = await findPublishedAreaById(areaId);
          areaSlug = row?.slug ?? null;
        }
        clusterCounts.set(clusterKey, {
          areaId,
          areaSlug,
          region,
          kind,
          count: 1,
          label: `${kind} · ${areaSlug ?? region ?? 'UAE'}`,
        });
      }
    }
  }

  for (const row of people) {
    if (row.areaId) {
      const a = await findPublishedAreaById(row.areaId);
      row.areaSlug = a?.slug ?? null;
    }
  }

  return {
    people,
    clusters: [...clusterCounts.values()].sort((a, b) => b.count - a.count),
  };
};
