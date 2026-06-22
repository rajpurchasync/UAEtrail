import { NextFunction, Request, Response } from 'express';

/**
 * Abort long-running requests after the specified timeout.
 * Default: 30 seconds.
 */
export const requestTimeout = (ms = 30_000) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.path.includes('/chat/stream')) {
      next();
      return;
    }

    const timer = setTimeout(() => {
      if (!res.headersSent) {
        res.status(503).json({
          error: {
            code: 'request_timeout',
            message: 'Request took too long to process.',
            traceId: req.traceId
          }
        });
      }
    }, ms);

    res.on('finish', () => clearTimeout(timer));
    res.on('close', () => clearTimeout(timer));
    next();
  };
};
