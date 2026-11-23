/**
 * Communication / Chat feature — single import surface for app code.
 *
 * | Concern | Use |
 * |---------|-----|
 * | Routes (stable URL) | `MESSAGES_PATH`, `messagesToUserPath`, `messagesGroupPath` |
 * | UI label | "Chat" (not "Messages") |
 * | Inbox, DM, stream ticket, crew wall | `messagingApi` |
 * | Group metadata / members (non-thread CRUD) | `groupsApi` |
 * | Thread UI | `@/chat` (`src/components/chat`) |
 *
 * See `docs/COMMUNICATION.md` § Frontend architecture.
 */
export { messagingApi } from '../api/domains/messaging';
export { groupsApi } from '../api/domains/groups';
export {
  MESSAGES_PATH,
  messagesGroupPath,
  messagesToUserPath,
} from '../config/routingCatalog';
