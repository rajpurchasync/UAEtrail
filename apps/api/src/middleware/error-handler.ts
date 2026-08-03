import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../lib/api-error.js';
import { isDuplicateKeyError } from '../lib/mongo-errors.js';
import { env } from '../config/env.js';

export const notFoundHandler = (_req: Request, _res: Response, next: NextFunction): void => {
  next(new ApiError(404, 'not_found', 'Resource not found.'));
};

export const errorHandler = (error: unknown, req: Request, res: Response, _next: NextFunction): void => {
  if (error instanceof ApiError) {
    res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        traceId: req.traceId
      }
    });
    return;
  }

  if (isDuplicateKeyError(error)) {
    res.status(409).json({
      error: {
        code: 'conflict',
        message: 'A record with these details already exists.',
        traceId: req.traceId
      }
    });
    return;
  }

  // Log the real error server-side
  console.error('[InternalError]', error instanceof Error ? error.stack : error);

  res.status(500).json({
    error: {
      code: 'internal_error',
      message: env.NODE_ENV === 'production' ? 'An unexpected error occurred.' : (error instanceof Error ? error.message : 'Unexpected error'),
      traceId: req.traceId
    }
  });
};
