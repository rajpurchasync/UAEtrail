import type { Collection } from 'mongodb';
import { newEntityId } from './entity-builders.js';
import { getMongoClient } from './mongo.js';
import { COLLECTIONS } from './collections.js';
import { randomBytes } from 'node:crypto';

export type ActivityFamilyInviteStatus = 'pending' | 'accepted' | 'declined' | 'cancelled';

export type ActivityFamilyInviteRecord = {
  id: string;
  activityId: string;
  requestId: string;
  membershipId: string;
  groupId: string;
  inviteeUserId: string;
  invitedByUserId: string;
  token: string;
  status: ActivityFamilyInviteStatus;
  createdAt: Date;
  updatedAt: Date;
  respondedAt: Date | null;
};

type MongoActivityFamilyInvite = {
  _id: string;
  activityId: string;
  requestId: string;
  membershipId: string;
  groupId: string;
  inviteeUserId: string;
  invitedByUserId: string;
  token: string;
  status: ActivityFamilyInviteStatus;
  createdAt: Date;
  updatedAt: Date;
  respondedAt: Date | null;
};

const PENDING_INVITE_LIST_LIMIT = 50;

const collection = (): Collection<MongoActivityFamilyInvite> =>
  getMongoClient()!.db().collection<MongoActivityFamilyInvite>(COLLECTIONS.ACTIVITY_FAMILY_INVITES);

const mapInvite = (row: MongoActivityFamilyInvite): ActivityFamilyInviteRecord => ({
  id: row._id,
  activityId: row.activityId,
  requestId: row.requestId,
  membershipId: row.membershipId,
  groupId: row.groupId,
  inviteeUserId: row.inviteeUserId,
  invitedByUserId: row.invitedByUserId,
  token: row.token,
  status: row.status,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
  respondedAt: row.respondedAt,
});

export const createActivityFamilyInvite = async (input: {
  activityId: string;
  requestId: string;
  membershipId: string;
  groupId: string;
  inviteeUserId: string;
  invitedByUserId: string;
}): Promise<ActivityFamilyInviteRecord> => {
  const [created] = await createActivityFamilyInvitesBatch([input]);
  if (!created) {
    throw new Error('Failed to create family outing invite.');
  }
  return created;
};

/** Cancel superseded pending invites then insertMany in two round-trips. */
export const createActivityFamilyInvitesBatch = async (
  inputs: Array<{
    activityId: string;
    requestId: string;
    membershipId: string;
    groupId: string;
    inviteeUserId: string;
    invitedByUserId: string;
  }>
): Promise<ActivityFamilyInviteRecord[]> => {
  if (inputs.length === 0) return [];
  const now = new Date();
  const membershipIds = [...new Set(inputs.map((row) => row.membershipId))];
  const activityId = inputs[0]!.activityId;
  const requestId = inputs[0]!.requestId;

  await collection().updateMany(
    {
      activityId,
      requestId,
      membershipId: { $in: membershipIds },
      status: 'pending',
    },
    { $set: { status: 'cancelled', updatedAt: now } }
  );

  const docs: MongoActivityFamilyInvite[] = inputs.map((input) => ({
    _id: newEntityId(),
    activityId: input.activityId,
    requestId: input.requestId,
    membershipId: input.membershipId,
    groupId: input.groupId,
    inviteeUserId: input.inviteeUserId,
    invitedByUserId: input.invitedByUserId,
    token: randomBytes(24).toString('hex'),
    status: 'pending',
    createdAt: now,
    updatedAt: now,
    respondedAt: null,
  }));
  await collection().insertMany(docs);
  return docs.map(mapInvite);
};

export const findActivityFamilyInviteByToken = async (
  token: string
): Promise<ActivityFamilyInviteRecord | null> => {
  const row = await collection().findOne({ token, status: 'pending' });
  return row ? mapInvite(row) : null;
};

export const findPendingActivityFamilyInviteForUser = async (
  activityId: string,
  inviteeUserId: string
): Promise<ActivityFamilyInviteRecord | null> => {
  const row = await collection().findOne({
    activityId,
    inviteeUserId,
    status: 'pending',
  });
  return row ? mapInvite(row) : null;
};

export const markActivityFamilyInviteResponded = async (
  inviteId: string,
  status: 'accepted' | 'declined'
): Promise<ActivityFamilyInviteRecord | null> => {
  const now = new Date();
  const result = await collection().findOneAndUpdate(
    { _id: inviteId, status: 'pending' },
    { $set: { status, updatedAt: now, respondedAt: now } },
    { returnDocument: 'after' }
  );
  return result ? mapInvite(result) : null;
};

export const listPendingActivityFamilyInvitesForUser = async (
  inviteeUserId: string
): Promise<ActivityFamilyInviteRecord[]> => {
  const rows = await collection()
    .find({ inviteeUserId, status: 'pending' })
    .sort({ createdAt: -1 })
    .limit(PENDING_INVITE_LIST_LIMIT)
    .toArray();
  return rows.map(mapInvite);
};
