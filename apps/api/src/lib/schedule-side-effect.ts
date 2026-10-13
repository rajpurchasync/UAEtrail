import { logger } from './logger.js';

/** Fire-and-forget async work — logs failures instead of swallowing errors. */
export const scheduleSideEffect = (work: Promise<unknown>, logContext: string): void => {
  void work.catch((err) => {
    logger.warn({ err, logContext }, 'async side effect failed');
  });
};
