import { SITE_ORIGIN } from '../config/seo';

export type ChatMessageTextSegment = { kind: 'text'; value: string };
export type ChatMessageUrlSegment = {
  kind: 'url';
  value: string;
  href: string;
  /** Same-app path for in-app navigation; null for external URLs. */
  to: string | null;
};
export type ChatMessageLinkSegment = ChatMessageTextSegment | ChatMessageUrlSegment;

export type SplitChatMessageLinksOptions = {
  siteOrigin?: string;
  currentOrigin?: string;
};

const CHAT_URL_RE = /\b(?:https?:\/\/|www\.)[^\s<>"'`]+/gi;

const hostnameKey = (host: string): string => host.replace(/^www\./i, '').toLowerCase();

const originHostname = (origin: string | undefined): string | null => {
  if (!origin) return null;
  try {
    return hostnameKey(new URL(origin).hostname);
  } catch {
    return null;
  }
};

const peelTrailingPunctuation = (raw: string): { core: string; trailing: string } => {
  let core = raw;
  let trailing = '';
  while (core.length > 0) {
    const last = core[core.length - 1];
    if (/[.,;:!?']/.test(last) || last === '"') {
      trailing = `${last}${trailing}`;
      core = core.slice(0, -1);
      continue;
    }
    if (last === ')' && (core.match(/\(/g)?.length ?? 0) < (core.match(/\)/g)?.length ?? 0)) {
      trailing = `${last}${trailing}`;
      core = core.slice(0, -1);
      continue;
    }
    if (last === ']' && (core.match(/\[/g)?.length ?? 0) < (core.match(/\]/g)?.length ?? 0)) {
      trailing = `${last}${trailing}`;
      core = core.slice(0, -1);
      continue;
    }
    break;
  }
  return { core, trailing };
};

const toHttpHref = (core: string): string | null => {
  const candidate = /^https?:\/\//i.test(core) ? core : `https://${core}`;
  try {
    const url = new URL(candidate);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    if (!url.hostname) return null;
    return candidate;
  } catch {
    return null;
  }
};

export const appPathFromChatHref = (
  href: string,
  options: SplitChatMessageLinksOptions = {}
): string | null => {
  try {
    const url = new URL(href);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    const host = hostnameKey(url.hostname);
    const appHosts = new Set<string>(['uaetrail.com']);
    const siteHost = originHostname(options.siteOrigin ?? SITE_ORIGIN);
    const currentHost = originHostname(
      options.currentOrigin ?? (typeof window !== 'undefined' ? window.location.origin : undefined)
    );
    if (siteHost) appHosts.add(siteHost);
    if (currentHost) appHosts.add(currentHost);
    if (!appHosts.has(host)) return null;
    return `${url.pathname}${url.search}${url.hash}` || '/';
  } catch {
    return null;
  }
};

/** Split chat text so http(s)/www URLs can render as real links. */
export const splitChatMessageLinks = (
  text: string,
  options: SplitChatMessageLinksOptions = {}
): ChatMessageLinkSegment[] => {
  if (!text) return [{ kind: 'text', value: text }];

  const segments: ChatMessageLinkSegment[] = [];
  const re = new RegExp(CHAT_URL_RE.source, CHAT_URL_RE.flags);
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) !== null) {
    const { core, trailing } = peelTrailingPunctuation(match[0]);
    const href = toHttpHref(core);
    if (!href) continue;

    if (match.index > cursor) {
      segments.push({ kind: 'text', value: text.slice(cursor, match.index) });
    }
    segments.push({
      kind: 'url',
      value: core,
      href,
      to: appPathFromChatHref(href, options),
    });
    const end = match.index + core.length;
    if (trailing) {
      segments.push({ kind: 'text', value: trailing });
    }
    cursor = end + trailing.length;
  }

  if (cursor < text.length) {
    segments.push({ kind: 'text', value: text.slice(cursor) });
  }

  return segments.length > 0 ? segments : [{ kind: 'text', value: text }];
};
