import { NextFunction, Request, Response } from 'express';
import { z, ZodSchema } from 'zod';
import { ApiError } from '../lib/api-error.js';

type ValidationShape = {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
};

export const validate =
  (shape: ValidationShape) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (shape.body) {
        req.body = shape.body.parse(req.body);
      }
      if (shape.params) {
        req.params = shape.params.parse(req.params);
      }
      if (shape.query) {
        req.query = shape.query.parse(req.query) as Request['query'];
      }
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(
          new ApiError(400, 'validation_error', 'Request validation failed.', {
            issues: error.issues
          })
        );
        return;
      }
      next(error);
    }
  };
