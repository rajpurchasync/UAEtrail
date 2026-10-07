import type { SocialPeopleSegment } from '@uaetrail/shared-types';
import { useMemberPeople } from './useMemberPeople';

type UseSocialPeopleArgs = {
  enabled: boolean;
  segment: SocialPeopleSegment;
};

/** @deprecated Use `useMemberPeople` — browse network roster, not chat. */
export const useSocialPeople = (args: UseSocialPeopleArgs) => useMemberPeople(args);
