import { UPL_MESSAGE_HOST } from './upl-glossary';

/** Participant lifecycle — map peek + activity detail + Plan chips (not host manage). */
export const ACTIVITY_STATUS_HOSTED = 'Hosted';
export const ACTIVITY_STATUS_JOIN_REQUESTED = 'Pending';
export const ACTIVITY_STATUS_JOINED = 'Joined';
export const ACTIVITY_CTA_PENDING_APPROVAL = 'Pending approval';
export const ACTIVITY_PEEK_MANAGE_LABEL = 'Manage';
export const ACTIVITY_CTA_OPEN_CHAT = 'Open chat';
/** Compact sticky footer — same action as {@link ACTIVITY_CTA_OPEN_CHAT}. */
export const ACTIVITY_CTA_CHAT_SHORT = 'Chat';
export const ACTIVITY_CTA_OPEN_GROUP_CHAT = 'Open group chat';
export const ACTIVITY_CTA_MESSAGE_HOST = UPL_MESSAGE_HOST;
export const ACTIVITY_PEEK_ALREADY_JOINED = 'Already joined';
export const ACTIVITY_PEEK_INVITATION = 'Invitation';
