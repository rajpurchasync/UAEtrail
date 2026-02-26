import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { traceIdMiddleware } from './middleware/trace-id.js';
import { openApiSpec } from './openapi.js';
import { apiRouter } from './routes/index.js';

export const app = express();

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
    return env.NODE_ENV !== 'production' && (url.hostname === 'localhost' || url.hostname === '127.0.0.1');
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
    credentials: true
  })
);
app.use(helmet());
app.use(traceIdMiddleware);
app.use(morgan('dev'));
app.use(express.json({ limit: '5mb' }));
app.use(cookieParser());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'uaetrail-api', timestamp: new Date().toISOString() });
});

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
app.get('/api/openapi.json', (_req, res) => res.json(openApiSpec));
app.use('/api/v1', apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);
