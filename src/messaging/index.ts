/**
 * Communication / Chat feature — single import surface for app code.
 *
 * | Concern | Use |
 * |---------|-----|
 * | Routes (stable URL) | `CHAT_PATH` / `MESSAGES_PATH`, `messagesToUserPath`, `messagesGroupPath` |
 * | UI label | "Chat" (not "Messages") |
 * | Inbox, DM, stream ticket, crew wall | `messagingApi` |
 * | Group metadata / members (non-thread CRUD) | `socialApi` |
 * | Thread UI | `@/chat` (`src/components/chat`) |
 *
 * See `docs/COMMUNICATION.md` § Frontend architecture.
 */
export { messagingApi } from '../api/domains/messaging';
export { socialApi } from '../api/domains/social';
export {
  CHAT_PATH,
  MESSAGES_PATH,
  messagesGroupPath,
  messagesToUserPath,
} from '../config/routingCatalog';
