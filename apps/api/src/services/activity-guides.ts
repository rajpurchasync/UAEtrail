import {
  activityGuideConsentRequired,
  resolvePublishingProfileKind,
  type ActivityGuideHostDTO,
  type PublishingProfileKind,
} from '@uaetrail/shared-types';
import type { ActivityGuideRecord } from '../domain/types.js';
import { ApiError } from '../lib/api-error.js';
import { findAuthUsersByIds } from '../lib/auth-users-store.js';
import { findActivityDocInMongo } from '../lib/entity-sync.js';
import { readActivityGuides, writeActivityGuides } from '../lib/activity-guides-store.js';
import { findTenantById, resolveOwnedProfileType } from '../lib/tenant-store.js';
import { inferTenantPublishingPurpose } from '../domain/tenant-publishing.js';
import { notifyActivityGuideInvite } from './activity-guide-notifications.js';

const uniqueIds = (ids: readonly string[]): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids) {
    const trimmed = id.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
  }
  return out;
};

const snapshotUsers = async (
  userIds: string[]
): Promise<Map<string, { displayName: string; avatarUrl: string | null }>> => {
  const users = await findAuthUsersByIds(userIds);
  return new Map(
    users.map((user) => [
      user._id,
      {
        displayName: user.profile.displayName?.trim() || 'Host',
        avatarUrl: user.profile.avatarUrl ?? null,
      },
    ])
  );
};

const resolveKind = async (
  tenantId: string,
  fallback?: PublishingProfileKind | null
): Promise<PublishingProfileKind> => {
  if (fallback) return fallback;
  const tenant = await findTenantById(tenantId);
  if (!tenant) return 'community';
  return resolvePublishingProfileKind({
    ownedType: resolveOwnedProfileType(tenant),
    publishingTier: inferTenantPublishingPurpose(tenant),
  });
};

const toHostDto = (row: ActivityGuideRecord): ActivityGuideHostDTO => ({
  userId: row.userId,
  displayName: row.displayName,
  avatarUrl: row.avatarUrl,
  status: row.status,
});

export const listActivityGuidesForHost = async (activityId: string): Promise<ActivityGuideHostDTO[]> => {
  const rows = await readActivityGuides(activityId);
  return rows.map(toHostDto);
};

export const syncActivityGuides = async (input: {
  activityId: string;
  actorUserId: string;
  guideUserIds: readonly string[];
  publishingProfileKind?: PublishingProfileKind | null;
}): Promise<ActivityGuideHostDTO[]> => {
  const doc = await findActivityDocInMongo(input.activityId);
  if (!doc) {
    throw new ApiError(404, 'activity_not_found', 'Activity not found.');
  }

  const kind = await resolveKind(doc.tenantId, input.publishingProfileKind);
  const consent = activityGuideConsentRequired(kind);
  const hostUserId = doc.hostId ?? doc.createdById;
  const requested = uniqueIds([hostUserId, doc.createdById, ...input.guideUserIds]);
  const existing = new Map((doc.guides ?? []).map((row) => [row.userId, row]));
  const snapshots = await snapshotUsers(requested);
  const now = new Date();
  const next: ActivityGuideRecord[] = [];
  const newlyPending: ActivityGuideRecord[] = [];

  for (const userId of requested) {
    const prev = existing.get(userId);
    const snap = snapshots.get(userId);
    const displayName = snap?.displayName ?? prev?.displayName ?? 'Host';
    const avatarUrl = snap?.avatarUrl ?? prev?.avatarUrl ?? null;
    const isLead = userId === hostUserId || userId === doc.createdById;
    if (prev?.status === 'accepted' || isLead || !consent) {
      next.push({
        userId,
        displayName,
        avatarUrl,
        status: 'accepted',
        assignedByUserId: prev?.assignedByUserId ?? input.actorUserId,
        assignedAt: prev?.assignedAt ?? now,
        respondedAt: prev?.respondedAt ?? now,
      });
      continue;
    }
    const pending: ActivityGuideRecord = {
      userId,
      displayName,
      avatarUrl,
      status: 'pending',
      assignedByUserId: input.actorUserId,
      assignedAt: prev?.assignedAt ?? now,
      respondedAt: null,
    };
    next.push(pending);
    if (!prev) newlyPending.push(pending);
  }

  await writeActivityGuides(input.activityId, next);
  for (const row of newlyPending) {
    notifyActivityGuideInvite({
      inviteeUserId: row.userId,
      actorUserId: input.actorUserId,
      activityId: input.activityId,
      activityTitle: doc.title,
    });
  }
  return next.map(toHostDto);
};

export const respondToActivityGuideInvite = async (input: {
  activityId: string;
  userId: string;
  accept: boolean;
}): Promise<{ status: 'accepted' | 'declined' }> => {
  const doc = await findActivityDocInMongo(input.activityId);
  if (!doc) {
    throw new ApiError(404, 'activity_not_found', 'Activity not found.');
  }
  const current = doc.guides ?? [];
  const row = current.find((guide) => guide.userId === input.userId);
  if (!row || row.status !== 'pending') {
    throw new ApiError(404, 'guide_invite_not_found', 'No pending guide invite for this outing.');
  }
  const next = input.accept
    ? current.map((guide) =>
        guide.userId === input.userId
          ? { ...guide, status: 'accepted' as const, respondedAt: new Date() }
          : guide
      )
    : current.filter((guide) => guide.userId !== input.userId);
  await writeActivityGuides(input.activityId, next);
  return { status: input.accept ? 'accepted' : 'declined' };
};

export const viewerGuideInviteStatus = (
  guides: ActivityGuideRecord[] | undefined,
  viewerUserId: string | null
): { status: 'pending' } | null => {
  if (!viewerUserId) return null;
  const row = (guides ?? []).find((guide) => guide.userId === viewerUserId);
  return row?.status === 'pending' ? { status: 'pending' } : null;
};

export const activityHasAcceptedGuide = (
  activity: { hostId?: string | null; createdById?: string; guides?: ActivityGuideRecord[] },
  userId: string
): boolean => {
  if (activity.hostId === userId || activity.createdById === userId) return true;
  return (activity.guides ?? []).some((guide) => guide.userId === userId && guide.status === 'accepted');
};
