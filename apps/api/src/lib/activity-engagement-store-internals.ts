import type { Collection } from 'mongodb';
import { resolveActivityPartyHeadcount, resolveHostNote } from '@uaetrail/shared-types';
import { ActivityStatus, type MembershipRole, RequestStatus } from '../domain/enums.js';
import type { ActivityParticipant, ActivityRequest } from '../domain/types.js';
import { ApiError } from './api-error.js';
import { findActivityDocInMongo, releaseActivityParticipantSlots } from './entity-sync.js';
import { getMongoClient } from './mongo.js';
import { resolveParticipationMode } from '../domain/activity-participation-mode.js';

export const ACTIVE_STATUSES: RequestStatus[] = ['PENDING', 'APPROVED', 'WAITLISTED'];

/** Capacity uses party headcount (adults + kids), not household rows. */
export const isActivityFull = (capacity: number, slotsUsed: number): boolean => slotsUsed >= capacity;

export const releaseSlotsForRequest = async (activityId: string, requestId: string): Promise<void> => {
  const row = await activityRequestsCollection().findOne({ _id: requestId });
  const headcount = resolveActivityPartyHeadcount(row?.adults, row?.kids);
  await releaseActivityParticipantSlots(activityId, headcount);
};

export type MongoPartyMember = {
  membershipId: string;
  groupId: string;
  memberType: 'adult' | 'kid';
  userId: string | null;
  displayName: string;
  status: 'family_invited' | 'accepted' | 'declined' | 'host_pending' | 'confirmed';
};

type MongoActivityRequest = {
  _id: string;
  activityId: string;
  userId: string;
  status: RequestStatus;
  adults?: number;
  kids?: number;
  partyMembers?: MongoPartyMember[];
  partyApprovalPending?: boolean;
  sourceTeamId?: string | null;
  note: string | null;
  hostNote?: string | null;
  cancelReason: string | null;
  cancelMessage: string | null;
  cancelledAt: Date | null;
  selectedPackageIndex: number | null;
  reviewedAt: Date | null;
  reviewedById: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type MongoActivityParticipant = {
  _id: string;
  activityId: string;
  requestId: string;
  userId: string;
  approvedById: string;
  checkedInAt: Date | null;
  hostRatingScore?: number | null;
  hostRatingComment?: string | null;
  hostRatedAt?: Date | null;
  hostRatingRideshare?: {
    cleanliness: number;
    punctuality: number;
    behaviour: number;
    payment?: number | null;
  } | null;
  createdAt: Date;
};

export const activityRequestsCollection = (): Collection<MongoActivityRequest> =>
  getMongoClient()!.db().collection<MongoActivityRequest>('activity_requests');

export const activityParticipantsCollection = (): Collection<MongoActivityParticipant> =>
  getMongoClient()!.db().collection<MongoActivityParticipant>('activity_participants');

type TenantActivitySummary = {
  _id: string;
  tenantId: string;
  title: string;
  startAt: Date;
  locationId: string;
  activityType?: string;
};

export const activitiesCollection = (): Collection<TenantActivitySummary> =>
  getMongoClient()!.db().collection<TenantActivitySummary>('activities');

export const toActivityRequestRecord = (doc: MongoActivityRequest): ActivityRequest => ({
  id: doc._id,
  activityId: doc.activityId,
  userId: doc.userId,
  status: doc.status,
  adults: doc.adults,
  kids: doc.kids,
  partyMembers: doc.partyMembers,
  partyApprovalPending: Boolean(doc.partyApprovalPending),
  sourceTeamId: doc.sourceTeamId ?? null,
  note: doc.note,
  hostNote: resolveHostNote(doc),
  cancelReason: doc.cancelReason,
  cancelMessage: doc.cancelMessage,
  cancelledAt: doc.cancelledAt,
  selectedPackageIndex: doc.selectedPackageIndex,
  reviewedAt: doc.reviewedAt,
  reviewedById: doc.reviewedById,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt
});

export const toActivityParticipantRecord = (doc: MongoActivityParticipant): ActivityParticipant => ({
  id: doc._id,
  activityId: doc.activityId,
  requestId: doc.requestId,
  userId: doc.userId,
  approvedById: doc.approvedById,
  checkedInAt: doc.checkedInAt,
  hostRatingScore: doc.hostRatingScore ?? null,
  hostRatingComment: doc.hostRatingComment ?? null,
  hostRatedAt: doc.hostRatedAt ?? null,
  hostRatingRideshare: doc.hostRatingRideshare ?? null,
  createdAt: doc.createdAt
});

export const patchActivityRequestInMongo = async (
  id: string,
  patch: Partial<Omit<MongoActivityRequest, '_id'>>
): Promise<void> => {
  await activityRequestsCollection().updateOne(
    { _id: id },
    { $set: { ...patch, updatedAt: new Date() } }
  );
};

export const patchActivityParticipantInMongo = async (
  id: string,
  patch: Partial<Omit<MongoActivityParticipant, '_id'>>
): Promise<void> => {
  await activityParticipantsCollection().updateOne({ _id: id }, { $set: patch });
};

export const loadPublishedEventForJoin = async (activityId: string) => {
  const doc = await findActivityDocInMongo(activityId);
  if (!doc || doc.status !== ActivityStatus.PUBLISHED) return null;

  const participantCount = await activityParticipantsCollection().countDocuments({ activityId });
  const slotsUsed =
    typeof doc.participantSlotsUsed === 'number' ? doc.participantSlotsUsed : participantCount;
  return {
    id: doc._id,
    capacity: doc.capacity,
    pricePackages: doc.pricePackages,
    participationMode: resolveParticipationMode(doc.participationMode, doc.requirements),
    requirements: doc.requirements ?? [],
    audience: doc.audience ?? null,
    hostId: doc.hostId,
    createdById: doc.createdById,
    waitlist: doc.waitlist !== false,
    participantSlotsUsed: slotsUsed,
    participants: Array.from({ length: participantCount }, (_, index) => ({ id: String(index) })),
  };
};

export const persistJoinRequestRow = async (input: {
  requestId: string;
  activityId: string;
  userId: string;
  status: RequestStatus;
  note: string | null;
  adults?: number;
  kids?: number;
  partyMembers?: MongoPartyMember[];
  partyApprovalPending?: boolean;
  sourceTeamId?: string | null;
  existingCreatedAt?: Date;
  reviewedAt?: Date | null;
  reviewedById?: string | null;
}): Promise<ActivityRequest> => {
  const now = new Date();
  await activityRequestsCollection().updateOne(
    { _id: input.requestId },
    {
      $set: {
        activityId: input.activityId,
        userId: input.userId,
        status: input.status,
        note: input.note,
        adults: input.adults ?? 1,
        kids: input.kids ?? 0,
        ...(input.partyMembers !== undefined ? { partyMembers: input.partyMembers } : {}),
        ...(input.partyApprovalPending !== undefined
          ? { partyApprovalPending: input.partyApprovalPending }
          : {}),
        ...(input.sourceTeamId !== undefined ? { sourceTeamId: input.sourceTeamId } : {}),
        hostNote: null,
        cancelReason: null,
        cancelMessage: null,
        cancelledAt: null,
        selectedPackageIndex: null,
        reviewedAt: input.reviewedAt ?? null,
        reviewedById: input.reviewedById ?? null,
        updatedAt: now,
        createdAt: input.existingCreatedAt ?? now,
      },
    },
    { upsert: true }
  );
  const mongoRow = await activityRequestsCollection().findOne({ _id: input.requestId });
  if (!mongoRow) {
    throw new ApiError(500, 'request_persist_failed', 'Failed to persist join request.');
  }
  return toActivityRequestRecord(mongoRow);
};

export const isEventHost = async (
  event: { hostId?: string | null; createdById?: string; tenantId?: string },
  hostUserId: string,
  hostMembershipRoles: MembershipRole[]
): Promise<boolean> => {
  if (event.hostId === hostUserId || event.createdById === hostUserId) {
    return true;
  }
  if (!event.tenantId) return false;
  const membership = await getMongoClient()!
    .db()
    .collection('tenant_memberships')
    .findOne({ tenantId: event.tenantId, userId: hostUserId, role: { $in: hostMembershipRoles } });
  return Boolean(membership);
};

export const stripPartyLineFromNote = (note: string | null | undefined): string | null => {
  if (!note?.trim()) return null;
  const trimmed = note
    .split('\n')
    .filter(
      (line) =>
        !line.trimStart().startsWith('Party:') && !line.trimStart().startsWith('Group:')
    )
    .join('\n')
    .trim();
  return trimmed || null;
};

export const withPartyNote = (note: string | null | undefined, adults?: number, kids?: number): string | null => {
  if (adults == null && kids == null) return note ?? null;
  const a = adults ?? 1;
  const k = kids ?? 0;
  const line = `Group: ${a} adult${a === 1 ? '' : 's'}${k ? `, ${k} kid${k === 1 ? '' : 's'}` : ''}`;
  const base = stripPartyLineFromNote(note);
  return base ? `${base}\n${line}` : line;
};