import { bootstrapApp } from './app.js';
import { env, validateOptionalIntegrations } from './config/env.js';
import { logger } from './lib/logger.js';
import { disconnectRedis } from './lib/redis.js';
import { getRedisClient } from './lib/redis.js';
import { connectMongo, disconnectMongo } from './lib/mongo.js';
import { initChatStreamPubSub, closeChatStreamPubSub } from './services/chat-stream.js';
import { registerRateLimiters } from './middleware/rate-limit-instances.js';
import { createRateLimiters } from './middleware/rate-limit.js';
import { probeS3 } from './lib/s3.js';
import { resolveEmailConfig } from './lib/email-config.js';

const STARTUP_RETRY_DELAY_MS = 5000;

const terminateOnFatal = (type: 'uncaughtException' | 'unhandledRejection', error: unknown) => {
  logger.fatal({ err: error, type }, 'process fatal error');
  process.exit(1);
};

process.on('uncaughtException', (error) => {
  terminateOnFatal('uncaughtException', error);
});

process.on('unhandledRejection', (reason) => {
  terminateOnFatal('unhandledRejection', reason);
});

const start = async () => {
  validateOptionalIntegrations();
  const emailConfig = resolveEmailConfig();
  if (emailConfig.configured) {
    logger.info({ runEnv: emailConfig.runEnv, from: emailConfig.emailFrom }, 'email delivery configured');
  } else if (env.NODE_ENV !== 'production') {
    logger.warn(
      { runEnv: emailConfig.runEnv },
      'email not configured — verification links are logged to the console in development'
    );
  }
  await probeS3();
  if (process.env.REDIS_URL) {
    await getRedisClient();
  }
  await connectMongo();
  if (env.NODE_ENV !== 'production') {
    try {
      const { ensureDemoExploreActivities } = await import('../scripts/seed-demo-scheduled-activities.js');
      await ensureDemoExploreActivities();
    } catch (err) {
      logger.warn({ err }, 'demo explore activity ensure skipped on startup');
    }
  }
  await initChatStreamPubSub();
  registerRateLimiters(await createRateLimiters());
  const app = await bootstrapApp();

  const server = await new Promise<ReturnType<typeof app.listen>>((resolve, reject) => {
    const instance = app.listen(env.PORT, () => {
      logger.info({ port: env.PORT }, 'api server listening');
      resolve(instance);
    });
    instance.on('error', reject);
  });

  const shutdown = async () => {
    logger.info('shutdown signal received');
    server.close();
    await closeChatStreamPubSub();
    await disconnectMongo();
    await disconnectRedis();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};

const startWithRetry = async () => {
  for (;;) {
    try {
      await start();
      return;
    } catch (error) {
      if (env.NODE_ENV === 'production') {
        logger.fatal({ err: error }, 'api failed to start');
        process.exit(1);
      }

      const message = error instanceof Error ? error.message : String(error);
      const mongoHint = /querySrv/i.test(message)
        ? ' — Atlas SRV DNS failed. Use public DNS (1.1.1.1), set MONGODB_DNS_SERVERS, or a standard mongodb:// URI from Atlas.'
        : /EADDRINUSE/i.test(message)
          ? ` — Port ${env.PORT} is in use. Stop Docker api container or other process on that port, or set PORT/API_BASE_URL in .env.`
          : /mongo|27017|server selection|ETIMEDOUT|ENOTFOUND/i.test(message)
            ? ' — MongoDB unreachable. Allow your IP in Atlas Network Access, or run local Mongo: docker compose --profile local-mongo up -d mongo'
            : '';

      logger.error(
        { err: error, retryInMs: STARTUP_RETRY_DELAY_MS },
        `api startup failed in development; retrying${mongoHint}`
      );
      await new Promise((resolve) => setTimeout(resolve, STARTUP_RETRY_DELAY_MS));
    }
  }
};

startWithRetry().catch((error) => {
  logger.fatal({ err: error }, 'api failed to start');
  process.exit(1);
});
