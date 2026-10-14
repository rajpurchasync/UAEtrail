import { NextFunction, Request, Response } from 'express';
import { z, ZodSchema } from 'zod';
import { ApiError } from '../lib/api-error.js';

type ValidationShape = {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
};

/** Express 5 exposes `query` (and sometimes `params`) as read-only getters — redefine to attach parsed values. */
const setRequestField = <K extends 'body' | 'params' | 'query'>(
  req: Request,
  key: K,
  value: Request[K],
): void => {
  try {
    req[key] = value;
  } catch {
    Object.defineProperty(req, key, {
      value,
      writable: true,
      configurable: true,
      enumerable: true,
    });
  }
};

export const validate =
  (shape: ValidationShape) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (shape.body) {
        setRequestField(req, 'body', shape.body.parse(req.body ?? {}));
      }
      if (shape.params) {
        setRequestField(req, 'params', shape.params.parse(req.params) as Request['params']);
      }
      if (shape.query) {
        setRequestField(req, 'query', shape.query.parse(req.query) as Request['query']);
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
