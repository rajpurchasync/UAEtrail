/**
 * Access-token refresh via httpOnly cookie.
 * Only real auth rejection clears the session — network / 5xx during API restarts must not log users out.
 */

export type AuthSessionTokens = { accessToken: string };

export type TokenRefreshOutcome =
  | { status: 'ok'; session: AuthSessionTokens }
  | { status: 'unauthorized' }
  | { status: 'transient' };

export const isAuthRejectionStatus = (status: number): boolean =>
  status === 401 || status === 403;

/** Decide whether an HTTP status from `/auth/refresh` should wipe the session. */
export const refreshFailureShouldInvalidateSession = (status: number): boolean =>
  isAuthRejectionStatus(status);

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export type RefreshAttemptFn = () => Promise<TokenRefreshOutcome>;

/**
 * Retry transient refresh failures (API restart / proxy blip).
 * Invalidates only after an explicit unauthorized response from the server.
 */
export const runTokenRefreshWithRetry = async (
  attempt: RefreshAttemptFn,
  delaysMs: number[] = [0, 400, 1000, 2000]
): Promise<TokenRefreshOutcome> => {
  let sawTransient = false;
  for (let i = 0; i < delaysMs.length; i += 1) {
    const delay = delaysMs[i] ?? 0;
    if (delay > 0) await sleep(delay);
    const outcome = await attempt();
    if (outcome.status === 'ok' || outcome.status === 'unauthorized') {
      return outcome;
    }
    sawTransient = true;
  }
  return sawTransient ? { status: 'transient' } : { status: 'unauthorized' };
};
