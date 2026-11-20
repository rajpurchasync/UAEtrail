/** Private team display name — create + rename (`social_groups` non-activity rows). */
export const SOCIAL_GROUP_NAME_MIN_LENGTH = 2;
export const SOCIAL_GROUP_NAME_MAX_LENGTH = 30;

/** UI label on create — Family, Friends, Colleagues (not a separate product entity). */
export const SOCIAL_TEAM_LABEL_TYPES = ['family', 'friends', 'colleagues'] as const;
export type SocialTeamLabelType = (typeof SOCIAL_TEAM_LABEL_TYPES)[number];

export const isSocialTeamLabelType = (value: string): value is SocialTeamLabelType =>
  (SOCIAL_TEAM_LABEL_TYPES as readonly string[]).includes(value);

/** Roster children must be under this age (years). */
export const SOCIAL_TEAM_KID_ROSTER_MAX_AGE_YEARS = 12;