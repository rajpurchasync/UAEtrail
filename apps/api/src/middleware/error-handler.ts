import { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ApiError } from '../lib/api-error.js';
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

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      res.status(409).json({
        error: {
          code: 'conflict',
          message: 'A record with these details already exists.',
          traceId: req.traceId
        }
      });
      return;
    }
    if (error.code === 'P2025') {
      res.status(404).json({
        error: {
          code: 'not_found',
          message: 'The requested record was not found.',
          traceId: req.traceId
        }
      });
      return;
    }
    res.status(400).json({
      error: {
        code: `prisma_${error.code}`,
        message: 'Database request failed.',
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
