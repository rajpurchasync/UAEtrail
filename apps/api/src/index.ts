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
  await initChatStreamPubSub();
  registerRateLimiters(await createRateLimiters());
  const app = await bootstrapApp();

  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, 'api server listening');
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

      logger.error(
        { err: error, retryInMs: STARTUP_RETRY_DELAY_MS },
        'api startup failed in development; retrying'
      );
      await new Promise((resolve) => setTimeout(resolve, STARTUP_RETRY_DELAY_MS));
    }
  }
};

startWithRetry().catch((error) => {
  logger.fatal({ err: error }, 'api failed to start');
  process.exit(1);
});
