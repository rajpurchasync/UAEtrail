import rateLimit from 'express-rate-limit';

/** Global: 500 requests per minute per IP */
export const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'rate_limit_exceeded',
      message: 'Too many requests. Please try again later.'
    }
  }
});

/** Auth endpoints: 10 requests per minute per IP (login/register brute force protection) */
export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'rate_limit_exceeded',
      message: 'Too many authentication attempts. Please try again later.'
    }
  }
});

/** View tracking: 5 per minute per IP to prevent bots inflating counts */
export const viewLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${req.ip}-${req.params?.id ?? 'unknown'}`,
  message: {
    error: {
      code: 'rate_limit_exceeded',
      message: 'Too many view requests. Please try again later.'
    }
  }
});
