/**
 * Stale bookmark path segments — rewrite via `canonicalizeNotificationBookmarkPath` (shared-types)
 * and client `inferNotificationPath`; stale console prefixes: `INBOUND_STALE_CONSOLE_PREFIXES` in shared-types.
 * No SPA `<Navigate>` shims (GW-7). Do not link these in product UI.
 */

export const INBOUND_BECOME_HOST_PATH = '/become-host' as const;
export const INBOUND_BECOME_ORGANIZER_PATH = '/become-organizer' as const;

/** Must match `INBOUND_STALE_CONSOLE_PREFIXES` in `packages/shared-types` (GW7-02). */
export const INBOUND_STALE_CONSOLE_PREFIXES = [
  '/publishing',
  '/host',
  '/organizer',
  '/hosting',
] as const;

