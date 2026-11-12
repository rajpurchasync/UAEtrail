/** Who may discover this member on Find Crew (Looking / Free / Everyone / map seeking). */
export const FIND_CREW_VISIBILITY_LEVELS = ['friends', 'friends_of_friends', 'none'] as const;
export type FindCrewVisibility = (typeof FIND_CREW_VISIBILITY_LEVELS)[number];

/** Network-aware default — not fully public to strangers. */
export const DEFAULT_FIND_CREW_VISIBILITY: FindCrewVisibility = 'friends_of_friends';

export const mergeFindCrewVisibility = (
  stored: FindCrewVisibility | null | undefined
): FindCrewVisibility => {
  if (stored && (FIND_CREW_VISIBILITY_LEVELS as readonly string[]).includes(stored)) {
    return stored;
  }
  return DEFAULT_FIND_CREW_VISIBILITY;
};

export type FindCrewViewerRelation = 'self' | 'friend' | 'friend_of_friend' | 'stranger';

/** Whether the viewer may see the subject on Find Crew surfaces. */
export const viewerMaySeeInFindCrew = (input: {
  visibility: FindCrewVisibility;
  relation: FindCrewViewerRelation;
}): boolean => {
  if (input.relation === 'self') return true;
  if (input.visibility === 'none') return false;
  if (input.visibility === 'friends') return input.relation === 'friend';
  return input.relation === 'friend' || input.relation === 'friend_of_friend';
};

/**
 * Whether the subject's home / start area may be shown or used for area matching
 * (city label, availability region/areaId).
 */
export const viewerMaySeeMemberLocation = (input: {
  cityAudience: 'hidden' | 'friends' | 'friends_of_friends' | 'public';
  exposure: 'full' | 'public' | 'none';
  isSelf: boolean;
  /** Required for friends_of_friends city audience. */
  relation?: FindCrewViewerRelation | null;
}): boolean => {
  if (input.isSelf || input.relation === 'self') return true;
  if (input.cityAudience === 'hidden') return false;
  if (input.cityAudience === 'friends') {
    return input.exposure === 'full' || input.relation === 'friend';
  }
  if (input.cityAudience === 'friends_of_friends') {
    return (
      input.exposure === 'full' ||
      input.relation === 'friend' ||
      input.relation === 'friend_of_friend'
    );
  }
  return input.exposure === 'public' || input.exposure === 'full';
};
