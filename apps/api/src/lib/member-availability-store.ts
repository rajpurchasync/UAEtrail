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
import { profileDisplayNameFromAuthUser } from '../domain/person-name.js';
import {
  AVAILABILITY_KINDS,
  availabilitySlotOverlapsRange,
  deriveModalitiesFromSlots,
  discoveryKindsFromSlots,
  hydrateMemberAvailabilitySlots,
  isFriendsOnlyAvailabilityVisibility,
  personMatchesAvailabilityKindQuery,
  normalizeAvailabilityVisibility,
  computeProfileDetailExposure,
  normalizeMemberAvailabilitySlotsForStorage,
  prunePastAvailabilitySlots,
  destinationRegionsOverlap,
} from '@uaetrail/shared-types';
import { ApiError } from './api-error.js';
import { COLLECTIONS } from './collections.js';
import { getMongoClient } from './mongo.js';
import { findAuthUsersByIds } from './auth-users-store.js';
import { findAreaBySlug, findPublishedAreaById } from './areas-store.js';
import { areAcceptedFriends } from './friend-store.js';
import {
  filterSubjectsVisibleInFindCrew,
  maySeeMemberLocationForViewer,
  readCityAudience,
} from './find-crew-visibility-gate.js';
import { batchResolveMemberProfileRoleLabelsForDirectory } from '../services/member-status.js';
import { resolveProfileViewerAccess } from '../services/profile-viewer-access.js';
import { normalizeProfileVisibility } from './media-access.js';
import { catalogDestinationIdUpdate } from '@uaetrail/shared-types';

type MongoMemberAvailability = {
  _id: string;
  userId: string;
  kinds: AvailabilityKind[];
  visibility: AvailabilityVisibility;
  destinationId?: string | null;
  region: string | null;
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

import { randomUUID } from 'node:crypto';

const ensureAvailabilitySlotIds = (slots: MemberAvailabilitySlotDTO[]): MemberAvailabilitySlotDTO[] =>
  slots.map((slot) => ({
    ...slot,
    slotId: slot.slotId?.trim() || randomUUID(),
  }));

const deriveKindsFromHydratedSlots = (slots: MemberAvailabilitySlotDTO[]): AvailabilityKind[] => {
  const kinds = [...deriveModalitiesFromSlots(slots)] as AvailabilityKind[];
  if (slots.some((slot) => slot.capacity === 'guide') && !kinds.includes('guide')) {
    kinds.push('guide');
  }
  return sanitizeKinds(kinds);
};

const sanitizeSlots = (
  slots: MemberAvailabilitySlotDTO[],
  docKindsHint?: AvailabilityKind[]
): MemberAvailabilitySlotDTO[] => {
  const today = todayIsoUtc();
  const normalized = normalizeMemberAvailabilitySlotsForStorage(slots);
  const hydrated = hydrateMemberAvailabilitySlots(
    normalized,
    docKindsHint
  ) as MemberAvailabilitySlotDTO[];
  return ensureAvailabilitySlotIds(prunePastAvailabilitySlots(hydrated, today));
};

const mapDto = (doc: MongoMemberAvailability): MemberAvailabilityDTO => {
  const docKindsHint = doc.kinds?.length ? sanitizeKinds(doc.kinds) : undefined;
  const slots = sanitizeSlots(doc.slots, docKindsHint);
  const kinds = deriveKindsFromHydratedSlots(slots);
  return {
    userId: doc.userId,
    kinds,
    visibility: normalizeAvailabilityVisibility(doc.visibility),
    region: doc.region,
    destinationId: doc.destinationId ?? null,
    note: doc.note,
    slots,
    updatedAt: doc.updatedAt.toISOString(),
  };
};

/** Future-dated fixed slots listed on the explore map (`scheduleKind: fixed`). */
export const countActiveFixedAvailabilityMapSlotsForUser = async (userId: string): Promise<number> => {
  const doc = await collection().findOne({ _id: userId });
  if (!doc || doc.visibility === 'hidden') return 0;
  const pruned = sanitizeSlots(doc.slots);
  return pruned.filter((slot) => slot.scheduleKind === 'fixed').length;
};

export const getMemberAvailability = async (userId: string): Promise<MemberAvailabilityDTO> => {
  const doc = await collection().findOne({ _id: userId });
  if (!doc) {
    return {
      userId,
      kinds: [],
      visibility: 'hidden',
      region: null,
      destinationId: null,
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

/**
 * MIG-DISCO-REG ops — merge fixed slots without past-date prune (map builder drops stale pins).
 * Not for member HTTP paths.
 */
export const mergeMemberAvailabilityFixedSlotsMigration = async (
  userId: string,
  input: {
    kinds: AvailabilityKind[];
    visibility?: AvailabilityVisibility;
    region?: string | null;
    destinationId?: string | null;
    note?: string | null;
    fixedSlots: MemberAvailabilitySlotDTO[];
  }
): Promise<MemberAvailabilityDTO> => {
  const docKindsHint = sanitizeKinds(input.kinds);
  const incoming = sanitizeSlots(input.fixedSlots, docKindsHint);
  if (incoming.length === 0) {
    throw new ApiError(400, 'availability_slots_required', 'No fixed slots to migrate.');
  }

  const existing = await collection().findOne({ _id: userId });
  const openAndOther = (existing?.slots ?? []).filter((s) => s.scheduleKind !== 'fixed');
  const incomingTitles = new Set(incoming.map((s) => s.title?.trim() ?? ''));
  const keptFixed = (existing?.slots ?? []).filter(
    (s) =>
      s.scheduleKind === 'fixed' && !incomingTitles.has((s.title?.trim() ?? ''))
  );
  const slots = [...openAndOther, ...keptFixed, ...incoming];
  const kinds = deriveKindsFromHydratedSlots(slots);
  const visibility = input.visibility ?? existing?.visibility ?? 'public';
  const now = new Date();
  const regionIds = catalogDestinationIdUpdate(
    input.destinationId?.trim() || existing?.destinationId?.trim() || null
  );
  const doc: MongoMemberAvailability = {
    _id: userId,
    userId,
    kinds,
    visibility,
    region: input.region?.trim() || existing?.region?.trim() || null,
    ...regionIds,
    note: input.note?.trim() || existing?.note?.trim() || null,
    slots,
    updatedAt: now,
  };
  await collection().updateOne({ _id: userId }, { $set: doc }, { upsert: true });
  return mapDto(doc);
};

export const upsertMemberAvailability = async (
  userId: string,
  input: UpsertMemberAvailabilityInput
): Promise<MemberAvailabilityDTO> => {
  const docKindsHint =
    input.kinds && input.kinds.length > 0 ? sanitizeKinds(input.kinds) : undefined;
  const slots = sanitizeSlots(input.slots ?? [], docKindsHint);
  const kinds = deriveKindsFromHydratedSlots(slots);
  if (input.visibility !== 'hidden' && slots.length === 0) {
    throw new ApiError(
      400,
      'availability_slots_required',
      'Add at least one future available day or set visibility to hidden.'
    );
  }
  const now = new Date();
  const visibility = normalizeAvailabilityVisibility(input.visibility);
  const regionIds = catalogDestinationIdUpdate(
    input.destinationId?.trim() || null
  );
  const doc: MongoMemberAvailability = {
    _id: userId,
    userId,
    kinds,
    visibility,
    region: input.region?.trim() || null,
    ...regionIds,
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
  const visibility = normalizeAvailabilityVisibility(doc.visibility);
  if (visibility === 'hidden' || doc.slots.length === 0) return false;
  if (visibility === 'public') return true;
  if (!viewerUserId) return false;
  if (doc.userId === viewerUserId) return true;
  if (isFriendsOnlyAvailabilityVisibility(visibility)) {
    return areAcceptedFriends(doc.userId, viewerUserId);
  }
  return false;
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
    kinds: deriveKindsFromHydratedSlots(slots),
    region: maySeeLocation ? doc.region : null,
    destinationId: maySeeLocation ? doc.destinationId ?? null : null,
    note: doc.note,
    slots,
  };
};

export type ExploreAvailabilityQuery = {
  viewerUserId: string | null;
  rangeStart: string;
  rangeEnd: string;
  kind?: AvailabilityKind | null;
  destinationSlug?: string | null;
  /** Emirate label — matches slot `destinationRegions` (OR). */
  region?: string | null;
  friendsOnly?: boolean;
};

export type ExploreAvailabilityIndex = {
  people: ExploreAvailablePersonDTO[];
  clusters: ExploreAvailabilityClusterDTO[];
};

export const loadExploreAvailabilityIndex = async (
  query: ExploreAvailabilityQuery
): Promise<ExploreAvailabilityIndex> => {
  const area =
    query.destinationSlug?.trim()
      ? await findAreaBySlug(query.destinationSlug.trim().toLowerCase())
      : null;
  const destinationIdFilter = area?.status === 'published' ? area.id : null;

  const docs = await collection()
    .find({
      visibility: { $ne: 'hidden' },
      ...(destinationIdFilter ? { destinationId: destinationIdFilter } : {}),
    })
    .toArray();

  const people: ExploreAvailablePersonDTO[] = [];
  const clusterCounts = new Map<string, ExploreAvailabilityClusterDTO>();

  const candidateUserIds = [...new Set(docs.map((doc) => doc.userId))];
  const users = await findAuthUsersByIds(candidateUserIds);
  const userMap = new Map(users.map((u) => [u._id, u]));
  const roleMap = await batchResolveMemberProfileRoleLabelsForDirectory(users);
  const findCrewVisible = await filterSubjectsVisibleInFindCrew(users, query.viewerUserId);

  for (const doc of docs) {
    const regionFilter = query.region?.trim() || null;
    const slots = sanitizeSlots(doc.slots)
      .filter((slot) => availabilitySlotOverlapsRange(slot, query.rangeStart, query.rangeEnd))
      .filter((slot) => destinationRegionsOverlap(slot.destinationRegions, regionFilter));
    if (slots.length === 0) continue;
    if (query.kind && !personMatchesAvailabilityKindQuery(slots, query.kind, query.rangeStart, query.rangeEnd)) {
      continue;
    }

    const maySee = await viewerMaySeeAvailability({ ...doc, slots }, query.viewerUserId);
    if (!maySee) continue;
    if (!findCrewVisible.has(doc.userId)) continue;

    const user = userMap.get(doc.userId);
    if (!user) continue;

    const isFriend =
      query.viewerUserId != null && doc.userId !== query.viewerUserId
        ? await areAcceptedFriends(doc.userId, query.viewerUserId)
        : false;
    if (query.friendsOnly && !isFriend) continue;

    const maySeeLocation = await maySeeMemberLocationForViewer(user, query.viewerUserId, {
      isFriend,
    });
    // Area-filtered Find Crew must not match members who hide their start area.
    if (destinationIdFilter && !maySeeLocation) continue;

    const region = maySeeLocation ? doc.region : null;
    const destinationId = maySeeLocation ? doc.destinationId ?? null : null;

    const projectedKinds = discoveryKindsFromSlots(slots, query.rangeStart, query.rangeEnd);

    const profileAccess = await resolveProfileViewerAccess({
      viewerUserId: query.viewerUserId,
      targetUserId: doc.userId,
      targetVisibility: user.profile?.profileVisibility,
    });
    const profileViewerAccess = computeProfileDetailExposure({
      profileVisibility: normalizeProfileVisibility(user.profile?.profileVisibility),
      level: profileAccess.level,
      viewerUserId: query.viewerUserId,
    });

    people.push({
      userId: doc.userId,
      displayName: profileDisplayNameFromAuthUser(user),
      avatarUrl: user.profile?.avatarUrl ?? null,
      kinds: projectedKinds,
      region,
      destinationId,
      slots,
      isFriend,
      profileRoleLabel: roleMap.get(doc.userId) ?? 'community_member',
      canOpenMemberProfile: profileViewerAccess.canOpenMemberProfile,
    });

    for (const kind of projectedKinds) {
      if (query.kind && kind !== query.kind) continue;
      if (!maySeeLocation) continue;
      const clusterKey = `${destinationId ?? region ?? 'any'}:${kind}`;
      const existing = clusterCounts.get(clusterKey);
      if (existing) {
        existing.count += 1;
      } else {
        let destinationSlug: string | null = null;
        if (destinationId) {
          const row = await findPublishedAreaById(destinationId);
          destinationSlug = row?.slug ?? null;
        }
        clusterCounts.set(clusterKey, {
          destinationId,
          destinationSlug,
          region,
          kind,
          count: 1,
          label: `${kind} · ${destinationSlug ?? region ?? 'UAE'}`,
        });
      }
    }
  }

  for (const row of people) {
    if (row.destinationId) {
      const a = await findPublishedAreaById(row.destinationId);
      row.destinationSlug = a?.slug ?? null;
    }
  }

  return {
    people,
    clusters: [...clusterCounts.values()].sort((a, b) => b.count - a.count),
  };
};
