export const ACTIVITY_INVITE_FRIENDS_CTA = 'Invite Friends';
/** Compact sticky footer — same action as {@link ACTIVITY_INVITE_FRIENDS_CTA}. */
export const ACTIVITY_INVITE_FRIENDS_CTA_SHORT = 'Invite';
export const ACTIVITY_INVITE_TAB_FRIENDS = 'Friends';
export const ACTIVITY_INVITE_TAB_GROUPS = 'Groups';
export const ACTIVITY_INVITE_SEARCH_PLACEHOLDER = 'Search by name';
export const ACTIVITY_INVITE_GROUPS_SEARCH_PLACEHOLDER = 'Search groups';
export const ACTIVITY_INVITE_NO_SEARCH_RESULTS = 'No friends match your search.';
export const ACTIVITY_INVITE_GROUPS_NO_SEARCH_RESULTS = 'No groups match your search.';
export const ACTIVITY_INVITE_SELECT_ALL = 'Select all';
export const ACTIVITY_INVITE_CLEAR_SELECTION = 'Clear';
export const ACTIVITY_INVITE_SEND_LABEL = (count: number): string =>
  count > 0 ? `Send (${count})` : 'Send';
export const ACTIVITY_INVITE_GROUPS_SEND_LABEL = (count: number): string =>
  count > 0 ? `Post (${count})` : 'Post to groups';
export const ACTIVITY_INVITE_NO_GROUPS = 'Create a team to share with your crew.';
export const ACTIVITY_INVITE_GROUPS_POSTED_TOAST = (count: number): string =>
  count === 1 ? 'Posted to your group.' : `Posted to ${count} groups.`;
export const ACTIVITY_INVITE_NO_FRIENDS = 'Add friends from Social or member profiles first.';
export const ACTIVITY_INVITE_SENT_TOAST = (sent: number): string =>
  sent === 1 ? 'Invite sent.' : `Invites sent to ${sent} friends.`;
export const ACTIVITY_INVITE_SENT_SUCCESS_HEADLINE = 'Invitation sent!';
export const activityInviteSentSuccessLine = (sent: number): string =>
  sent === 1 ? 'Your friend will get a notification to join.' : `${sent} friends will get a notification to join.`;
export const ACTIVITY_INVITE_GROUPS_SENT_SUCCESS_HEADLINE = 'Posted to your crew';
