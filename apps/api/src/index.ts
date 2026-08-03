import { bootstrapApp } from './app.js';
import { env, validateOptionalIntegrations } from './config/env.js';
import { disconnectRedis } from './lib/redis.js';
import { getRedisClient } from './lib/redis.js';
import { connectMongo, disconnectMongo } from './lib/mongo.js';
import { initChatStreamPubSub, closeChatStreamPubSub } from './services/chat-stream.js';
import { registerRateLimiters } from './middleware/rate-limit-instances.js';
import { createRateLimiters } from './middleware/rate-limit.js';
import { probeS3 } from './lib/s3.js';

const start = async () => {
  validateOptionalIntegrations();
  await probeS3();
  if (process.env.REDIS_URL) {
    await getRedisClient();
  }
  await connectMongo();
  await initChatStreamPubSub();
  registerRateLimiters(await createRateLimiters());
  const app = await bootstrapApp();

  const server = app.listen(env.PORT, () => {
    console.log(`UAE Trails API listening on http://localhost:${env.PORT}`);
  });

  const shutdown = async () => {
    server.close();
    await closeChatStreamPubSub();
    await disconnectMongo();
    await disconnectRedis();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};

start();
