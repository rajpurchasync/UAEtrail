import {
  mergeFindCrewVisibility,
  mergeProfileFieldPrivacy,
  viewerMaySeeInFindCrew,
  viewerMaySeeMemberLocation,
  type FindCrewVisibility,
  type FindCrewViewerRelation,
  type ProfileFieldAudience,
} from '@uaetrail/shared-types';
import type { AuthUserRecord } from '../lib/auth-users-store.js';
import { areAcceptedFriends, listFriendIdsForUser } from '../lib/friend-store.js';

export const readFindCrewVisibility = (
  profile: AuthUserRecord['profile'] | null | undefined
): FindCrewVisibility => mergeFindCrewVisibility(profile?.findCrewVisibility);

export const readCityAudience = (
  profile: AuthUserRecord['profile'] | null | undefined
): ProfileFieldAudience => mergeProfileFieldPrivacy(profile?.fieldPrivacy).city;

/** Friend / FoF / stranger relative to viewer (self when ids match). */
export const resolveFindCrewViewerRelation = async (
  viewerUserId: string | null,
  subjectUserId: string,
  opts?: {
    viewerFriendIds?: ReadonlySet<string>;
    subjectFriendIds?: ReadonlySet<string>;
  }
): Promise<FindCrewViewerRelation> => {
  if (!viewerUserId) return 'stranger';
  if (viewerUserId === subjectUserId) return 'self';

  const viewerFriendIds =
    opts?.viewerFriendIds ?? new Set(await listFriendIdsForUser(viewerUserId));
  if (viewerFriendIds.has(subjectUserId)) return 'friend';

  const subjectFriendIds =
    opts?.subjectFriendIds ?? new Set(await listFriendIdsForUser(subjectUserId));
  for (const friendId of viewerFriendIds) {
    if (friendId !== subjectUserId && subjectFriendIds.has(friendId)) {
      return 'friend_of_friend';
    }
  }
  return 'stranger';
};

export const mayAppearInFindCrew = async (
  subject: Pick<AuthUserRecord, '_id' | 'profile'>,
  viewerUserId: string | null,
  opts?: {
    viewerFriendIds?: ReadonlySet<string>;
    subjectFriendIds?: ReadonlySet<string>;
  }
): Promise<boolean> => {
  const visibility = readFindCrewVisibility(subject.profile);
  const relation = await resolveFindCrewViewerRelation(viewerUserId, subject._id, opts);
  return viewerMaySeeInFindCrew({ visibility, relation });
};

/**
 * Batch gate for Find Crew surfaces. Preloads viewer friend ids and subject friend ids
 * only when a subject uses friends_of_friends and is not a direct friend.
 */
export const filterSubjectsVisibleInFindCrew = async (
  subjects: Array<Pick<AuthUserRecord, '_id' | 'profile'>>,
  viewerUserId: string | null
): Promise<Set<string>> => {
  const visible = new Set<string>();
  if (subjects.length === 0) return visible;

  const maybeGraph: Array<Pick<AuthUserRecord, '_id' | 'profile'>> = [];
  for (const subject of subjects) {
    if (viewerUserId && subject._id === viewerUserId) {
      visible.add(subject._id);
      continue;
    }
    const visibility = readFindCrewVisibility(subject.profile);
    if (visibility === 'none') continue;
    if (!viewerUserId) continue;
    maybeGraph.push(subject);
  }

  if (maybeGraph.length === 0 || !viewerUserId) return visible;

  const viewerFriendIds = new Set(await listFriendIdsForUser(viewerUserId));
  const needsSubjectBuddies: string[] = [];
  for (const subject of maybeGraph) {
    if (viewerFriendIds.has(subject._id)) {
      visible.add(subject._id);
      continue;
    }
    if (readFindCrewVisibility(subject.profile) === 'friends') continue;
    needsSubjectBuddies.push(subject._id);
  }

  if (needsSubjectBuddies.length === 0) return visible;

  const subjectFriendLists = await Promise.all(
    needsSubjectBuddies.map(async (id) => [id, new Set(await listFriendIdsForUser(id))] as const)
  );
  const subjectFriendMap = new Map(subjectFriendLists);

  for (const subjectId of needsSubjectBuddies) {
    const subjectFriendIds = subjectFriendMap.get(subjectId) ?? new Set<string>();
    let isFof = false;
    for (const friendId of viewerFriendIds) {
      if (friendId !== subjectId && subjectFriendIds.has(friendId)) {
        isFof = true;
        break;
      }
    }
    if (isFof) visible.add(subjectId);
  }

  return visible;
};

/**
 * Whether subject's home/start area may be shown or used for area matching for this viewer.
 * Uses city field privacy + friend relationship as a stand-in for profile exposure.
 */
export const maySeeMemberLocationForViewer = async (
  subject: Pick<AuthUserRecord, '_id' | 'profile'>,
  viewerUserId: string | null,
  opts?: { isFriend?: boolean }
): Promise<boolean> => {
  const cityAudience = readCityAudience(subject.profile);
  if (!viewerUserId) {
    return viewerMaySeeMemberLocation({
      cityAudience,
      exposure: 'none',
      isSelf: false,
      relation: 'stranger',
    });
  }
  if (viewerUserId === subject._id) return true;
  const isFriend =
    opts?.isFriend ?? (await areAcceptedFriends(viewerUserId, subject._id));
  const relation = isFriend
    ? ('friend' as const)
    : cityAudience === 'friends_of_friends'
      ? await resolveFindCrewViewerRelation(viewerUserId, subject._id)
      : ('stranger' as const);
  return viewerMaySeeMemberLocation({
    cityAudience,
    exposure: isFriend ? 'full' : 'public',
    isSelf: false,
    relation,
  });
};

/** City / emirate label for directory rows — null when location privacy blocks the viewer. */
export const resolveCityLabelForViewer = async (
  subject: Pick<AuthUserRecord, '_id' | 'profile'>,
  viewerUserId: string | null,
  cityLabel: string | null,
  opts?: { isFriend?: boolean }
): Promise<string | null> => {
  if (!cityLabel) return null;
  const maySee = await maySeeMemberLocationForViewer(subject, viewerUserId, opts);
  return maySee ? cityLabel : null;
};

/**
 * Batch city labels for directory/followed rows.
 * Preloads viewer friend ids once and subject friend lists only for FoF city audience.
 */
export const resolveCityLabelsForViewerBatch = async (
  rows: Array<{
    subject: Pick<AuthUserRecord, '_id' | 'profile'>;
    cityLabel: string | null;
  }>,
  viewerUserId: string | null,
  opts?: { viewerFriendIds?: ReadonlySet<string> }
): Promise<Map<string, string | null>> => {
  const out = new Map<string, string | null>();
  if (rows.length === 0) return out;

  const viewerFriendIds =
    opts?.viewerFriendIds ??
    (viewerUserId ? new Set(await listFriendIdsForUser(viewerUserId)) : new Set<string>());

  const needsFof: Array<Pick<AuthUserRecord, '_id' | 'profile'>> = [];
  for (const row of rows) {
    const { subject, cityLabel } = row;
    if (!cityLabel) {
      out.set(subject._id, null);
      continue;
    }
    if (!viewerUserId) {
      out.set(subject._id, null);
      continue;
    }
    if (viewerUserId === subject._id) {
      out.set(subject._id, cityLabel);
      continue;
    }
    const cityAudience = readCityAudience(subject.profile);
    if (cityAudience === 'hidden') {
      out.set(subject._id, null);
      continue;
    }
    const isFriend = viewerFriendIds.has(subject._id);
    if (cityAudience === 'friends') {
      out.set(subject._id, isFriend ? cityLabel : null);
      continue;
    }
    if (cityAudience === 'public') {
      out.set(subject._id, cityLabel);
      continue;
    }
    // friends_of_friends
    if (isFriend) {
      out.set(subject._id, cityLabel);
      continue;
    }
    needsFof.push(subject);
  }

  if (needsFof.length === 0 || !viewerUserId) return out;

  const subjectFriendLists = await Promise.all(
    needsFof.map(async (subject) => [subject._id, new Set(await listFriendIdsForUser(subject._id))] as const)
  );
  const subjectFriendMap = new Map(subjectFriendLists);

  for (const subject of needsFof) {
    const subjectFriendIds = subjectFriendMap.get(subject._id) ?? new Set<string>();
    let isFof = false;
    for (const friendId of viewerFriendIds) {
      if (friendId !== subject._id && subjectFriendIds.has(friendId)) {
        isFof = true;
        break;
      }
    }
    const row = rows.find((r) => r.subject._id === subject._id);
    out.set(subject._id, isFof ? row?.cityLabel ?? null : null);
  }

  return out;
};
