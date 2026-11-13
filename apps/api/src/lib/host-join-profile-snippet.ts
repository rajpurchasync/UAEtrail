import {
  hostJoinProfileSnippetFromProfile,
  resolveJoinHostProfileDisclosureNeeds,
  type HostJoinProfileSnippetDTO,
  type JoinHostProfileDisclosureNeeds,
} from '@uaetrail/shared-types';
import type { UserGenderWire } from '@uaetrail/shared-types';

export { resolveJoinHostProfileDisclosureNeeds, type JoinHostProfileDisclosureNeeds };

type JoinDisclosureProfile = {
  dateOfBirth?: string | null;
  gender?: UserGenderWire | null;
} | null | undefined;

export const hostJoinProfileSnippetForActivity = (
  profile: JoinDisclosureProfile,
  activity: {
    requirements?: string[] | null;
    audience?: { minAge?: number | null; womenOnly?: boolean } | null;
  }
): HostJoinProfileSnippetDTO | null => {
  const needs = resolveJoinHostProfileDisclosureNeeds(activity.requirements, activity.audience);
  return hostJoinProfileSnippetFromProfile(
  {
    dateOfBirth: profile?.dateOfBirth ?? null,
    gender: profile?.gender ?? null,
  },
    needs
  );
};
