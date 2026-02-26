import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';

export const traceIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  req.traceId = randomUUID();
  res.setHeader('x-trace-id', req.traceId);
  next();
};
