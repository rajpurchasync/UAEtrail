import type { MemberGroupKind } from '@uaetrail/shared-types';
import {
  isOutingCrewMemberGroup as sharedIsOutingCrewMemberGroup,
  teamAllowsKidRoster,
} from '@uaetrail/shared-types';

export type MemberGroupIdentity = {
  kind: MemberGroupKind;
  teamLabel: import('@uaetrail/shared-types').SocialTeamLabelType | null;
};

export const isTeamMemberGroup = (group: MemberGroupIdentity): boolean => group.kind === 'team';

export const isOutingCrewMemberGroup = (group: MemberGroupIdentity): boolean =>
  sharedIsOutingCrewMemberGroup(group);

/** @deprecated Use {@link isOutingCrewMemberGroup}. */
export const isActivityCrewMemberGroup = isOutingCrewMemberGroup;

export const memberTeamAllowsKidRoster = (group: MemberGroupIdentity): boolean =>
  teamAllowsKidRoster(group);