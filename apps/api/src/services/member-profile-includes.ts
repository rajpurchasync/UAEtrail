export type MemberProfilePageIncludes = {
  socialGraph: boolean;
  upcoming: boolean;
  past: boolean;
};

const INCLUDE_TOKENS = ['socialGraph', 'upcoming', 'past'] as const;
type IncludeToken = (typeof INCLUDE_TOKENS)[number];

const isIncludeToken = (value: string): value is IncludeToken =>
  (INCLUDE_TOKENS as readonly string[]).includes(value);

/** `?include=socialGraph,upcoming,past` (+ legacy `?socialGraph=1`). */
export const parseMemberProfilePageIncludes = (query: {
  include?: unknown;
  socialGraph?: unknown;
}): MemberProfilePageIncludes => {
  const inboundSocialGraphQuery =
    query.socialGraph === '1' || query.socialGraph === 'true' || query.socialGraph === true;

  if (typeof query.include !== 'string' || !query.include.trim()) {
    return {
      socialGraph: inboundSocialGraphQuery,
      upcoming: false,
      past: false,
    };
  }

  const tokens = new Set(
    query.include
      .split(',')
      .map((part) => part.trim())
      .filter(isIncludeToken)
  );

  return {
    socialGraph: inboundSocialGraphQuery || tokens.has('socialGraph'),
    upcoming: tokens.has('upcoming'),
    past: tokens.has('past'),
  };
};
