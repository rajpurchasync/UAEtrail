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
import { areAcceptedBuddies, listBuddyIdsForUser } from '../lib/buddy-store.js';

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
    viewerBuddyIds?: ReadonlySet<string>;
    subjectBuddyIds?: ReadonlySet<string>;
  }
): Promise<FindCrewViewerRelation> => {
  if (!viewerUserId) return 'stranger';
  if (viewerUserId === subjectUserId) return 'self';

  const viewerBuddyIds =
    opts?.viewerBuddyIds ?? new Set(await listBuddyIdsForUser(viewerUserId));
  if (viewerBuddyIds.has(subjectUserId)) return 'friend';

  const subjectBuddyIds =
    opts?.subjectBuddyIds ?? new Set(await listBuddyIdsForUser(subjectUserId));
  for (const buddyId of viewerBuddyIds) {
    if (buddyId !== subjectUserId && subjectBuddyIds.has(buddyId)) {
      return 'friend_of_friend';
    }
  }
  return 'stranger';
};

export const mayAppearInFindCrew = async (
  subject: Pick<AuthUserRecord, '_id' | 'profile'>,
  viewerUserId: string | null,
  opts?: {
    viewerBuddyIds?: ReadonlySet<string>;
    subjectBuddyIds?: ReadonlySet<string>;
  }
): Promise<boolean> => {
  const visibility = readFindCrewVisibility(subject.profile);
  const relation = await resolveFindCrewViewerRelation(viewerUserId, subject._id, opts);
  return viewerMaySeeInFindCrew({ visibility, relation });
};

/**
 * Batch gate for Find Crew surfaces. Preloads viewer buddy ids and subject buddy ids
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

  const viewerBuddyIds = new Set(await listBuddyIdsForUser(viewerUserId));
  const needsSubjectBuddies: string[] = [];
  for (const subject of maybeGraph) {
    if (viewerBuddyIds.has(subject._id)) {
      visible.add(subject._id);
      continue;
    }
    if (readFindCrewVisibility(subject.profile) === 'friends') continue;
    needsSubjectBuddies.push(subject._id);
  }

  if (needsSubjectBuddies.length === 0) return visible;

  const subjectBuddyLists = await Promise.all(
    needsSubjectBuddies.map(async (id) => [id, new Set(await listBuddyIdsForUser(id))] as const)
  );
  const subjectBuddyMap = new Map(subjectBuddyLists);

  for (const subjectId of needsSubjectBuddies) {
    const subjectBuddyIds = subjectBuddyMap.get(subjectId) ?? new Set<string>();
    let isFof = false;
    for (const buddyId of viewerBuddyIds) {
      if (buddyId !== subjectId && subjectBuddyIds.has(buddyId)) {
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
 * Uses city field privacy + buddy relationship as a stand-in for profile exposure.
 */
export const maySeeMemberLocationForViewer = async (
  subject: Pick<AuthUserRecord, '_id' | 'profile'>,
  viewerUserId: string | null,
  opts?: { isBuddy?: boolean }
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
  const isBuddy =
    opts?.isBuddy ?? (await areAcceptedBuddies(viewerUserId, subject._id));
  const relation = isBuddy
    ? ('friend' as const)
    : cityAudience === 'friends_of_friends'
      ? await resolveFindCrewViewerRelation(viewerUserId, subject._id)
      : ('stranger' as const);
  return viewerMaySeeMemberLocation({
    cityAudience,
    exposure: isBuddy ? 'full' : 'public',
    isSelf: false,
    relation,
  });
};

/** City / emirate label for directory rows — null when location privacy blocks the viewer. */
export const resolveCityLabelForViewer = async (
  subject: Pick<AuthUserRecord, '_id' | 'profile'>,
  viewerUserId: string | null,
  cityLabel: string | null,
  opts?: { isBuddy?: boolean }
): Promise<string | null> => {
  if (!cityLabel) return null;
  const maySee = await maySeeMemberLocationForViewer(subject, viewerUserId, opts);
  return maySee ? cityLabel : null;
};

/**
 * Batch city labels for directory/followed rows.
 * Preloads viewer buddy ids once and subject buddy lists only for FoF city audience.
 */
export const resolveCityLabelsForViewerBatch = async (
  rows: Array<{
    subject: Pick<AuthUserRecord, '_id' | 'profile'>;
    cityLabel: string | null;
  }>,
  viewerUserId: string | null,
  opts?: { viewerBuddyIds?: ReadonlySet<string> }
): Promise<Map<string, string | null>> => {
  const out = new Map<string, string | null>();
  if (rows.length === 0) return out;

  const viewerBuddyIds =
    opts?.viewerBuddyIds ??
    (viewerUserId ? new Set(await listBuddyIdsForUser(viewerUserId)) : new Set<string>());

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
    const isBuddy = viewerBuddyIds.has(subject._id);
    if (cityAudience === 'friends') {
      out.set(subject._id, isBuddy ? cityLabel : null);
      continue;
    }
    if (cityAudience === 'public') {
      out.set(subject._id, cityLabel);
      continue;
    }
    // friends_of_friends
    if (isBuddy) {
      out.set(subject._id, cityLabel);
      continue;
    }
    needsFof.push(subject);
  }

  if (needsFof.length === 0 || !viewerUserId) return out;

  const subjectBuddyLists = await Promise.all(
    needsFof.map(async (subject) => [subject._id, new Set(await listBuddyIdsForUser(subject._id))] as const)
  );
  const subjectBuddyMap = new Map(subjectBuddyLists);

  for (const subject of needsFof) {
    const subjectBuddyIds = subjectBuddyMap.get(subject._id) ?? new Set<string>();
    let isFof = false;
    for (const buddyId of viewerBuddyIds) {
      if (buddyId !== subject._id && subjectBuddyIds.has(buddyId)) {
        isFof = true;
        break;
      }
    }
    const row = rows.find((r) => r.subject._id === subject._id);
    out.set(subject._id, isFof ? row?.cityLabel ?? null : null);
  }

  return out;
};
