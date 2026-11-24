/** My crew list hub — main tab + sub-pills (orthogonal to Find crew surface). */
export const MY_CREW_TAB_PARAM = 'myCrewTab';
export const MY_CREW_PEOPLE_PILL_PARAM = 'myCrewPeoplePill';
export const MY_CREW_GROUP_PILL_PARAM = 'myCrewGroupPill';

/** @deprecated Legacy param — parsed into tab + pill */
export const MY_CREW_PILL_PARAM = 'myCrewPill';

export type MyCrewMainTab = 'people' | 'groups';
export type MyCrewPeoplePill = 'friends' | 'following';
export type MyCrewGroupPill = 'community' | 'group' | 'team';

export const MY_CREW_PEOPLE_PILL_ORDER: MyCrewPeoplePill[] = ['friends', 'following'];
export const MY_CREW_GROUP_PILL_ORDER: MyCrewGroupPill[] = ['community', 'group', 'team'];

const MAIN_TABS = new Set<string>(['people', 'groups']);
const PEOPLE_PILLS = new Set<string>(MY_CREW_PEOPLE_PILL_ORDER);
const GROUP_PILLS = new Set<string>(MY_CREW_GROUP_PILL_ORDER);

export const parseMyCrewMainTab = (raw: string | null, legacyPill: string | null): MyCrewMainTab => {
  if (raw && MAIN_TABS.has(raw)) return raw as MyCrewMainTab;
  if (legacyPill === 'communities' || legacyPill === 'teams') return 'groups';
  return 'people';
};

export const parseMyCrewPeoplePill = (raw: string | null, legacyPill: string | null): MyCrewPeoplePill => {
  if (raw === 'following' || legacyPill === 'following') return 'following';
  return 'friends';
};

export const parseMyCrewGroupPill = (raw: string | null, legacyPill: string | null): MyCrewGroupPill => {
  if (raw && GROUP_PILLS.has(raw)) return raw as MyCrewGroupPill;
  if (legacyPill === 'teams') return 'team';
  if (legacyPill === 'communities') return 'community';
  return 'community';
};

export const serializeMyCrewMainTab = (tab: MyCrewMainTab): string | null =>
  tab === 'people' ? null : tab;

export const serializeMyCrewPeoplePill = (pill: MyCrewPeoplePill): string | null =>
  pill === 'friends' ? null : pill;

export const serializeMyCrewGroupPill = (pill: MyCrewGroupPill): string | null =>
  pill === 'community' ? null : pill;