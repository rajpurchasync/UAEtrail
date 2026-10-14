import { splitChatMessageLinks, type SplitChatMessageLinksOptions } from './chatMessageLinks';

const EXPLORE_ACTIVITY_PIN_RE = /^activity:(.+)$/i;

/** Parse `/activity/:id` or explore `?pin=activity:id` paths. */
export const parseActivityIdFromAppPath = (path: string): string | null => {
  const trimmed = path.trim();
  if (!trimmed) return null;

  const activityMatch = trimmed.match(/^\/activity\/([^/?#]+)/i);
  if (activityMatch?.[1]) {
    return decodeURIComponent(activityMatch[1]);
  }

  try {
    const url = new URL(trimmed.startsWith('/') ? `https://local.test${trimmed}` : trimmed);
    const pin = url.searchParams.get('pin');
    if (pin) {
      const decoded = decodeURIComponent(pin);
      const pinMatch = decoded.match(EXPLORE_ACTIVITY_PIN_RE);
      if (pinMatch?.[1]) return pinMatch[1];
    }
  } catch {
    return null;
  }

  return null;
};

/** Unique activity ids linked in chat message text (same-app URLs only). */
export const extractActivityIdsFromChatText = (
  text: string,
  options: SplitChatMessageLinksOptions = {}
): string[] => {
  const ids = new Set<string>();
  for (const segment of splitChatMessageLinks(text, options)) {
    if (segment.kind !== 'url' || !segment.to) continue;
    const id = parseActivityIdFromAppPath(segment.to);
    if (id) ids.add(id);
  }
  return [...ids];
};
