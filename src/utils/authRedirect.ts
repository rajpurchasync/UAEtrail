/** Resolve post-auth redirect from router state or ?redirect= query param. */
export const resolveAuthRedirect = (
  stateFrom: string | undefined | null,
  searchRedirect: string | null
): string | undefined => {
  const candidate = stateFrom ?? searchRedirect ?? undefined;
  if (!candidate || candidate === '/' || candidate === '/signin' || candidate === '/signup') {
    return undefined;
  }
  if (!candidate.startsWith('/') || candidate.startsWith('//')) {
    return undefined;
  }
  return candidate;
};
