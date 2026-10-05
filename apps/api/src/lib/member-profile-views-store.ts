import type { Collection } from 'mongodb';
import { getMongoClient } from './mongo.js';
import { COLLECTIONS } from './collections.js';

export type MemberProfileViewSource = 'discover' | 'organic';

type MemberProfileViewDoc = {
  _id: string;
  profileUserId: string;
  viewerUserId: string;
  /** UTC date key for at-most-once counting per viewer per day. */
  viewedOn: string;
  viewedAt: Date;
  source?: MemberProfileViewSource;
};

const collection = (): Collection<MemberProfileViewDoc> =>
  getMongoClient()!.db().collection<MemberProfileViewDoc>(COLLECTIONS.MEMBER_PROFILE_VIEWS);

const utcDateKey = (date: Date): string => date.toISOString().slice(0, 10);

/** Record a profile view (deduped per viewer per calendar day). */
export const recordMemberProfileView = async (input: {
  profileUserId: string;
  viewerUserId: string;
  viewedAt?: Date;
  source?: MemberProfileViewSource;
}): Promise<void> => {
  if (input.profileUserId === input.viewerUserId) return;

  const viewedAt = input.viewedAt ?? new Date();
  const viewedOn = utcDateKey(viewedAt);
  const source = input.source ?? 'organic';
  const id =
    source === 'discover'
      ? `discover:${input.viewerUserId}:${input.profileUserId}:${viewedOn}`
      : `${input.profileUserId}:${input.viewerUserId}:${viewedOn}`;

  await collection().updateOne(
    { _id: id },
    {
      $setOnInsert: {
        _id: id,
        profileUserId: input.profileUserId,
        viewerUserId: input.viewerUserId,
        viewedOn,
        viewedAt,
        source,
      },
    },
    { upsert: true }
  );
};

/** Distinct public profiles opened from Discover in the window (quota). */
export const countMemberDiscoveryProfilesOpenedSince = async (
  viewerUserId: string,
  since: Date
): Promise<number> => {
  const rows = await collection()
    .aggregate<{ count: number }>([
      {
        $match: {
          viewerUserId,
          source: 'discover',
          viewedAt: { $gte: since },
        },
      },
      { $group: { _id: '$profileUserId' } },
      { $count: 'count' },
    ])
    .toArray();
  return rows[0]?.count ?? 0;
};

export const hasMemberDiscoveryOpenInWindow = async (
  viewerUserId: string,
  profileUserId: string,
  since: Date
): Promise<boolean> => {
  const doc = await collection().findOne({
    viewerUserId,
    profileUserId,
    source: 'discover',
    viewedAt: { $gte: since },
  });
  return Boolean(doc);
};

export const countMemberProfileViewsSince = async (
  profileUserId: string,
  since: Date
): Promise<number> =>
  collection().countDocuments({
    profileUserId,
    viewedAt: { $gte: since },
  });

export const countUniqueMemberProfileViewersSince = async (
  profileUserId: string,
  since: Date
): Promise<number> => {
  const rows = await collection()
    .aggregate<{ count: number }>([
      { $match: { profileUserId, viewedAt: { $gte: since } } },
      { $group: { _id: '$viewerUserId' } },
      { $count: 'count' },
    ])
    .toArray();
  return rows[0]?.count ?? 0;
};

export const purgeMemberProfileViewsForUser = async (userId: string): Promise<void> => {
  await collection().deleteMany({
    $or: [{ profileUserId: userId }, { viewerUserId: userId }],
  });
};
