import rateLimit, { ipKeyGenerator, type RateLimitRequestHandler } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { getRedisClient, isRedisConfigured } from '../lib/redis.js';

export interface RateLimiters {
  globalLimiter: RateLimitRequestHandler;
  authLimiter: RateLimitRequestHandler;
  viewLimiter: RateLimitRequestHandler;
  sensitiveDataLimiter: RateLimitRequestHandler;
  clientErrorLimiter: RateLimitRequestHandler;
}

const redisStore = (prefix: string) => {
  return new RedisStore({
    prefix: `rl:${prefix}:`,
    sendCommand: async (...args: string[]) => {
      const redis = await getRedisClient();
      if (!redis) throw new Error('Redis not connected');
      return redis.sendCommand(args);
    }
  });
};

export const createRateLimiters = async (): Promise<RateLimiters> => {
  let redisAvailable = false;
  if (isRedisConfigured()) {
    redisAvailable = Boolean(await getRedisClient());
  }

  const store = (prefix: string) => (redisAvailable ? redisStore(prefix) : undefined);

  return {
    globalLimiter: rateLimit({
      windowMs: 60_000,
      max: 500,
      standardHeaders: true,
      legacyHeaders: false,
      store: store('global'),
      skip: (req) => req.path.includes('/chat/stream'),
      message: {
        error: { code: 'rate_limit_exceeded', message: 'Too many requests. Please try again later.' }
      }
    }),
    authLimiter: rateLimit({
      windowMs: 60_000,
      max: 10,
      standardHeaders: true,
      legacyHeaders: false,
      store: store('auth'),
      message: {
        error: {
          code: 'rate_limit_exceeded',
          message: 'Too many authentication attempts. Please try again later.'
        }
      }
    }),
    viewLimiter: rateLimit({
      windowMs: 60_000,
      max: 5,
      standardHeaders: true,
      legacyHeaders: false,
      store: store('view'),
      keyGenerator: (req) => `${ipKeyGenerator(req.ip ?? 'unknown')}-${req.params?.id ?? 'unknown'}`,
      message: {
        error: { code: 'rate_limit_exceeded', message: 'Too many view requests. Please try again later.' }
      }
    }),
    sensitiveDataLimiter: rateLimit({
      windowMs: 60 * 60_000,
      max: 5,
      standardHeaders: true,
      legacyHeaders: false,
      store: store('sensitive'),
      keyGenerator: (req) => req.auth?.userId ?? ipKeyGenerator(req.ip ?? 'unknown'),
      message: {
        error: {
          code: 'rate_limit_exceeded',
          message: 'Too many sensitive account requests. Please try again later.'
        }
      }
    }),
    clientErrorLimiter: rateLimit({
      windowMs: 60_000,
      max: 30,
      standardHeaders: true,
      legacyHeaders: false,
      store: store('client-error'),
      message: {
        error: { code: 'rate_limit_exceeded', message: 'Too many error reports. Please try again later.' }
      }
    })
  };
};
