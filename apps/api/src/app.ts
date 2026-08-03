import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';
import { connectMongo, getMongoClient } from './lib/mongo.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { createRateLimiters } from './middleware/rate-limit.js';
import { getGlobalLimiter } from './middleware/rate-limit-instances.js';
import { requestTimeout } from './middleware/request-timeout.js';
import { traceIdMiddleware } from './middleware/trace-id.js';
import { openApiSpec } from './openapi.js';
import { apiRouter } from './routes/index.js';
import { stripeWebhookHandler } from './routes/stripe-webhook.js';

export const createApp = async (): Promise<Express> => {
  const app = express();
  if (env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }
  const globalLimiter = getGlobalLimiter() ?? (await createRateLimiters()).globalLimiter;

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
  app.use(helmet());
  app.use(globalLimiter);
  app.use(requestTimeout());
  app.use(traceIdMiddleware);
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
    } catch {
      res.status(503).json({ status: 'not_ready', service: 'uaetrail-api' });
    }
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
