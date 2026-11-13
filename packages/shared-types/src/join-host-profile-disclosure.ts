import { computeAgeFromIsoDateOfBirth } from './profile-date-of-birth-share.js';
import { isWomenOnlyActivityRequirements, type UserGenderWire } from './activity-audience-requirements.js';

export type JoinHostProfileDisclosureNeeds = {
  needsGender: boolean;
  needsAge: boolean;
};

export type HostJoinProfileSnippetDTO = {
  gender: UserGenderWire | null;
  age: number | null;
  birthYear: number | null;
  dateOfBirth: string | null;
};

const parseMinimumAgeFromRequirements = (requirements: string[] | null | undefined): number | null => {
  for (const raw of requirements ?? []) {
    const trimmed = raw.trim();
    const min = trimmed.match(/^Minimum age:\s*(\d+)/i);
    if (min) return Number.parseInt(min[1], 10);
    const range = trimmed.match(/^Age range:\s*(\d+)/i);
    if (range) return Number.parseInt(range[1], 10);
    const agesLine = trimmed.match(/^ages\s+(\d+)/i);
    if (agesLine) return Number.parseInt(agesLine[1], 10);
  }
  return null;
};

export const resolveJoinHostProfileDisclosureNeeds = (
  requirements: string[] | null | undefined,
  audience?: { minAge?: number | null; womenOnly?: boolean } | null
): JoinHostProfileDisclosureNeeds => {
  const womenOnly = Boolean(audience?.womenOnly) || isWomenOnlyActivityRequirements(requirements);
  const minAge = audience?.minAge ?? parseMinimumAgeFromRequirements(requirements);
  const needsAge = typeof minAge === 'number' && minAge > 0;
  return {
    needsGender: womenOnly,
    needsAge,
  };
};

export const hostJoinProfileSnippetFromProfile = (
  profile: {
    dateOfBirth?: string | null;
    gender?: UserGenderWire | null;
  } | null
  | undefined,
  needs: JoinHostProfileDisclosureNeeds
): HostJoinProfileSnippetDTO | null => {
  if (!needs.needsGender && !needs.needsAge) return null;
  const gender =
    profile?.gender === 'male' || profile?.gender === 'female' || profile?.gender === 'prefer_not_to_say'
      ? profile.gender
      : null;
  const dateOfBirth = profile?.dateOfBirth?.trim() ?? '';
  const validDob = /^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth) ? dateOfBirth : null;
  const age = validDob ? computeAgeFromIsoDateOfBirth(validDob) : null;
  const birthYear = validDob ? Number.parseInt(validDob.slice(0, 4), 10) : null;

  if (!needs.needsGender && !needs.needsAge) return null;

  return {
    gender: needs.needsGender ? gender : null,
    age: needs.needsAge ? age : null,
    birthYear: needs.needsAge ? birthYear : null,
    dateOfBirth: needs.needsAge ? validDob : null,
  };
};

export const joinHostProfileShareNotice = (needs: JoinHostProfileDisclosureNeeds): string | null => {
  if (!needs.needsGender && !needs.needsAge) return null;
  const parts: string[] = [];
  if (needs.needsGender) parts.push('gender');
  if (needs.needsAge) parts.push('date of birth and age');
  const joined =
    parts.length === 2 ? `${parts[0]} and ${parts[1]}` : (parts[0] ?? 'profile details');
  return `This outing has audience rules. When you join or request a spot, your host will see your ${joined} to review your request — even if your profile card keeps those details private.`;
};
