import { MongoClient, ServerApiVersion } from 'mongodb';
import dns from 'node:dns';
import { env } from '../config/env.js';
import { ensureMongoIndexes } from './mongo-indexes.js';
import { runMongoMigrations } from './mongo-migrations.js';

let client: MongoClient | null = null;
let connecting: Promise<MongoClient | null> | null = null;

const defaultSrvFallbackDnsServers = ['1.1.1.1', '8.8.8.8'];
const mongoConnectWatchdogMs = env.NODE_ENV === 'production' ? 12_000 : 20_000;
const mongoSelectionTimeoutMs = env.NODE_ENV === 'production' ? 5_000 : 12_000;

const shouldRetryMongoWithDnsFallback = (uri: string, message: string): boolean =>
  uri.startsWith('mongodb+srv://') &&
  (/querySrv\s+ETIMEOUT/i.test(message) ||
    /getaddrinfo\s+ENOTFOUND/i.test(message) ||
    /Server selection timed out/i.test(message) ||
    /MongoDB connection timed out/i.test(message));

const resolveSrvFallbackDnsServers = (): string[] => {
  const configured = (process.env.MONGODB_DNS_SERVERS || '').trim();
  if (!configured) {
    return defaultSrvFallbackDnsServers;
  }

  return configured
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

export const connectMongo = async (): Promise<MongoClient> => {
  if (client) return client;

  if (!connecting) {
    connecting = (async () => {
      const connectOnce = async (): Promise<MongoClient> => {
        const mongoClient = new MongoClient(env.MONGODB_URI, {
          serverSelectionTimeoutMS: mongoSelectionTimeoutMs,
          connectTimeoutMS: mongoSelectionTimeoutMs,
          serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true
          }
        });

        const watchdog = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error(`MongoDB connection timed out after ${mongoConnectWatchdogMs}ms`));
          }, mongoConnectWatchdogMs);
        });

        try {
          await Promise.race([
            (async () => {
              await mongoClient.connect();
              await mongoClient.db('admin').command({ ping: 1 });
              const db = mongoClient.db();
              await runMongoMigrations(db);
              await ensureMongoIndexes(db);
            })(),
            watchdog
          ]);
        } catch (error) {
          await mongoClient.close().catch(() => {});
          throw error;
        }

        client = mongoClient;
        console.log('[mongo] Connected to MongoDB.');
        return client;
      };

      try {
        return await connectOnce();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (shouldRetryMongoWithDnsFallback(env.MONGODB_URI, message)) {
          const fallbackDnsServers = resolveSrvFallbackDnsServers();
          if (fallbackDnsServers.length > 0) {
            dns.setServers(fallbackDnsServers);
            console.warn(
              `[mongo] Atlas DNS/connect issue detected. Retrying with DNS servers: ${fallbackDnsServers.join(', ')}`
            );
            return await connectOnce();
          }
        }

        throw new Error(
          `Failed to connect to MongoDB at ${env.MONGODB_URI}: ${message}`
        );
      } finally {
        connecting = null;
      }
    })();
  }

  const connected = await connecting;
  if (!connected) {
    throw new Error('MongoDB connection failed.');
  }
  return connected;
};

export const getMongoClient = (): MongoClient => {
  if (!client) {
    throw new Error('MongoDB is not connected — call connectMongo() first.');
  }
  return client;
};

export const disconnectMongo = async (): Promise<void> => {
  if (client) {
    await client.close();
  }
  client = null;
  connecting = null;
};