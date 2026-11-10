export type UserGenderWire = 'male' | 'female' | 'prefer_not_to_say';

/** Matches organizer wizard line `Women only` stored on activity.requirements. */
export const isWomenOnlyActivityRequirements = (
  requirements: string[] | null | undefined
): boolean => (requirements ?? []).some((line) => /^Women only$/i.test(line.trim()));

export type WomenOnlyJoinEligibility = 'eligible' | 'ineligible_gender' | 'profile_gender_required';

export const resolveWomenOnlyJoinEligibility = (
  requirements: string[] | null | undefined,
  gender: UserGenderWire | null | undefined
): WomenOnlyJoinEligibility => {
  if (!isWomenOnlyActivityRequirements(requirements)) return 'eligible';
  if (gender === 'female') return 'eligible';
  if (gender === 'male') return 'ineligible_gender';
  return 'profile_gender_required';
};

export const womenOnlyJoinBlockMessage = (eligibility: WomenOnlyJoinEligibility): string | null => {
  switch (eligibility) {
    case 'eligible':
      return null;
    case 'ineligible_gender':
      return 'This outing is for women only.';
    case 'profile_gender_required':
      return 'This outing is for women only. Set your gender to female in App settings or Edit profile to join.';
    default:
      return 'This outing is for women only.';
  }
};
