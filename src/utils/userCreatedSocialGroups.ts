import type { SocialGroupView } from '../api/types';
import { isMemberGroupTeamRow, resolveMemberGroupShape } from '@uaetrail/shared-types';

/** Member-created family/friends teams — not auto activity crew chats. */
export const userCreatedSocialGroups = (groups: SocialGroupView[]): SocialGroupView[] =>
  groups.filter((group) => {
    if (!isMemberGroupTeamRow(group)) return false;
    const label = resolveMemberGroupShape(group).teamLabel;
    return label === 'family' || label === 'friends';
  });