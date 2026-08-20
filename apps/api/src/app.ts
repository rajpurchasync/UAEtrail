import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { z } from 'zod';
import { env } from './config/env.js';
import { connectMongo, getMongoClient } from './lib/mongo.js';
import { createRequestLogger, logError } from './lib/logger.js';
import { apiErrorsTotal, httpRequestDurationSeconds, httpRequestsTotal, metricsContentType, metricsText } from './lib/metrics.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { requireMetricsAuth } from './middleware/metrics-auth.js';
import { createRateLimiters } from './middleware/rate-limit.js';
import { getClientErrorLimiter, getGlobalLimiter } from './middleware/rate-limit-instances.js';
import { requestTimeout } from './middleware/request-timeout.js';
import { traceIdMiddleware } from './middleware/trace-id.js';
import { openApiSpec } from './openapi.js';
import { apiRouter } from './routes/index.js';
import { stripeWebhookHandler } from './routes/stripe-webhook.js';

const clientErrorBodySchema = z
  .object({
    message: z.string().max(2000).optional(),
    stack: z.string().max(8000).optional(),
    componentStack: z.string().max(8000).optional(),
    url: z.string().max(2000).optional(),
    userAgent: z.string().max(500).optional()
  })
  .strict();
export const createApp = async (): Promise<Express> => {
  const app = express();
  const observabilityPaths = new Set(['/health', '/health/ready', '/metrics']);
  if (env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }
  const registeredGlobal = getGlobalLimiter();
  const registeredClient = getClientErrorLimiter();
  const fallbackLimiters = registeredGlobal && registeredClient ? null : await createRateLimiters();
  const globalLimiter = registeredGlobal ?? fallbackLimiters!.globalLimiter;
  const clientErrorLimiter = registeredClient ?? fallbackLimiters!.clientErrorLimiter;

  const configuredOrigins = [
    env.APP_BASE_URL,
    ...(env.APP_BASE_URLS
      ? env.APP_BASE_URLS.split(',')
          .map((item) => item.trim())
          .filter(Boolean)
      : [])
  ];

  const isDevLocalOrigin = (origin: string): boolean => {
    try {
      const url = new URL(origin);
      if (env.NODE_ENV === 'production') return false;
      if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return true;
      // Allow phone/tablet testing on the same Wi‑Fi (private LAN IPs).
      if (/^192\.168\./.test(url.hostname)) return true;
      if (/^10\./.test(url.hostname)) return true;
      if (/^172\.(1[6-9]|2\d|3[01])\./.test(url.hostname)) return true;
      return false;
    } catch {
      return false;
    }
  };

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || configuredOrigins.includes(origin) || isDevLocalOrigin(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error(`CORS blocked origin: ${origin}`));
      },
      credentials: true,
      maxAge: 86400
    })
  );
  app.use(
    helmet(
      env.NODE_ENV === 'production'
        ? undefined
        : {
            contentSecurityPolicy: {
              directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'", 'https://accounts.google.com'],
                styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
                fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
                imgSrc: [
                  "'self'",
                  'data:',
                  'blob:',
                  'https:',
                  'http://localhost:9000',
                  'http://127.0.0.1:9000',
                  'http://*:9000'
                ],
                connectSrc: [
                  "'self'",
                  'https://accounts.google.com',
                  'https://*.stripe.com',
                  'wss:',
                  'ws:',
                  'http://localhost:5175',
                  'http://*:5175',
                  'http://localhost:9000',
                  'http://127.0.0.1:9000',
                  'http://*:9000'
                ],
                frameSrc: [
                  'https://accounts.google.com',
                  'https://js.stripe.com',
                  'https://hooks.stripe.com',
                  'https://www.openstreetmap.org',
                  'https://openstreetmap.org',
                  'http://localhost:3000',
                  'http://*:3000',
                  'http://localhost:9090',
                  'http://*:9090'
                ],
                workerSrc: ["'self'"],
                manifestSrc: ["'self'"]
              }
            }
          }
    )
  );
  app.use(globalLimiter);
  app.use(requestTimeout());
  app.use(traceIdMiddleware);
  app.use((req, res, next) => {
    const requestLogger = createRequestLogger(req);
    const start = Date.now();

    res.on('finish', () => {
      const durationMs = Date.now() - start;
      const route = (req.route?.path || req.path || 'unknown').toString();
      const statusCode = res.statusCode;

      if (!observabilityPaths.has(route)) {
        httpRequestsTotal.labels(req.method, route, String(statusCode)).inc();
        httpRequestDurationSeconds.labels(req.method, route, String(statusCode)).observe(durationMs / 1000);
      }

      if (statusCode >= 500) {
        requestLogger.error({ statusCode, durationMs }, 'request completed');
      } else if (statusCode >= 400) {
        requestLogger.warn({ statusCode, durationMs }, 'request completed');
      } else {
        requestLogger.info({ statusCode, durationMs }, 'request completed');
      }
    });

    req.log = requestLogger;
    next();
  });
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  app.post('/api/v1/shop/webhook/stripe', express.raw({ type: 'application/json' }), stripeWebhookHandler);

  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'uaetrail-api', timestamp: new Date().toISOString() });
  });

  app.get('/health/ready', async (_req, res) => {
    try {
      await connectMongo();
      await getMongoClient().db('admin').command({ ping: 1 });
      res.json({ status: 'ready', service: 'uaetrail-api', database: 'mongodb', timestamp: new Date().toISOString() });
    } catch (error) {
      logError('health readiness check failed', error, { service: 'uaetrail-api' });
      apiErrorsTotal.labels('readiness').inc();
      res.status(503).json({ status: 'not_ready', service: 'uaetrail-api' });
    }
  });

  app.get('/metrics', requireMetricsAuth, async (_req, res) => {
    res.set('Content-Type', metricsContentType);
    res.end(await metricsText());
  });

  app.post('/api/v1/logs/client-error', clientErrorLimiter, (req, res) => {
    const parsed = clientErrorBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: { code: 'invalid_payload', message: 'Invalid client error payload.' }
      });
      return;
    }

    logError('client-side error reported', parsed.data, { route: '/api/v1/logs/client-error' });
    apiErrorsTotal.labels('client_error').inc();
    res.status(202).json({ status: 'accepted' });
  });
  if (env.NODE_ENV !== 'production') {
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
    app.get('/api/openapi.json', (_req, res) => res.json(openApiSpec));
  }
  app.use('/api/v1', apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

/** @deprecated Use createApp() — kept for tests that import synchronously after bootstrap */
export let app: Express;

export const bootstrapApp = async (): Promise<Express> => {
  app = await createApp();
  return app;
};
