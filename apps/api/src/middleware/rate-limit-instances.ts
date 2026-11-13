import type { RequestHandler } from 'express';
import type { RateLimitRequestHandler } from 'express-rate-limit';
import type { RateLimiters } from './rate-limit.js';

let globalLimiterInstance: RateLimitRequestHandler | null = null;
let authLimiterInstance: RateLimitRequestHandler | null = null;
let viewLimiterInstance: RateLimitRequestHandler | null = null;
let weatherLimiterInstance: RateLimitRequestHandler | null = null;
let referralClickLimiterInstance: RateLimitRequestHandler | null = null;
let sensitiveDataLimiterInstance: RateLimitRequestHandler | null = null;
let clientErrorLimiterInstance: RateLimitRequestHandler | null = null;

export const registerRateLimiters = (limiters: RateLimiters): void => {
  globalLimiterInstance = limiters.globalLimiter;
  authLimiterInstance = limiters.authLimiter;
  viewLimiterInstance = limiters.viewLimiter;
  weatherLimiterInstance = limiters.weatherLimiter;
  referralClickLimiterInstance = limiters.referralClickLimiter;
  sensitiveDataLimiterInstance = limiters.sensitiveDataLimiter;
  clientErrorLimiterInstance = limiters.clientErrorLimiter;
};

export const getGlobalLimiter = (): RateLimitRequestHandler | null => globalLimiterInstance;
export const getClientErrorLimiter = (): RateLimitRequestHandler | null => clientErrorLimiterInstance;

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

export const weatherLimiter: RequestHandler = (req, res, next) => {
  if (!weatherLimiterInstance) {
    next();
    return;
  }
  weatherLimiterInstance(req, res, next);
};

export const referralClickLimiter: RequestHandler = (req, res, next) => {
  if (!referralClickLimiterInstance) {
    next();
    return;
  }
  referralClickLimiterInstance(req, res, next);
};

export const sensitiveDataLimiter: RequestHandler = (req, res, next) => {
  if (!sensitiveDataLimiterInstance) {
    next();
    return;
  }
  sensitiveDataLimiterInstance(req, res, next);
};
