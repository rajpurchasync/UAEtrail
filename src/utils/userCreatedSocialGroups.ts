import type { SocialGroupView } from '../api/types';

/** Member-created family/friends groups — not auto activity crew chats. */
export const userCreatedSocialGroups = (groups: SocialGroupView[]): SocialGroupView[] =>
  groups.filter((group) => group.type === 'family' || group.type === 'friends');
