import type { RequestHandler } from 'express';
import type { RateLimitRequestHandler } from 'express-rate-limit';
import type { RateLimiters } from './rate-limit.js';

let globalLimiterInstance: RateLimitRequestHandler | null = null;
let authLimiterInstance: RateLimitRequestHandler | null = null;
let viewLimiterInstance: RateLimitRequestHandler | null = null;

export const registerRateLimiters = (limiters: RateLimiters): void => {
  globalLimiterInstance = limiters.globalLimiter;
  authLimiterInstance = limiters.authLimiter;
  viewLimiterInstance = limiters.viewLimiter;
};

export const getGlobalLimiter = (): RateLimitRequestHandler | null => globalLimiterInstance;

/** Proxy until bootstrap registers Redis/memory limiters. */
export const authLimiter: RequestHandler = (req, res, next) => {
  if (!authLimiterInstance) {
    next();
    return;
  }
  authLimiterInstance(req, res, next);
};

export const viewLimiter: RequestHandler = (req, res, next) => {
  if (!viewLimiterInstance) {
    next();
    return;
  }
  viewLimiterInstance(req, res, next);
};
