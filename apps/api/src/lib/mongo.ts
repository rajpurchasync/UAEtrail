import { MongoClient, ServerApiVersion } from 'mongodb';
import { env } from '../config/env.js';
import { ensureMongoIndexes } from './mongo-indexes.js';

let client: MongoClient | null = null;
let connecting: Promise<MongoClient | null> | null = null;

export const connectMongo = async (): Promise<MongoClient> => {
  if (client) return client;

  if (!connecting) {
    connecting = (async () => {
      try {
        const mongoClient = new MongoClient(env.MONGODB_URI, {
          serverSelectionTimeoutMS: 5_000,
          connectTimeoutMS: 5_000,
          serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true
          }
        });

        await mongoClient.connect();
        await mongoClient.db('admin').command({ ping: 1 });
        await ensureMongoIndexes(mongoClient.db());
        client = mongoClient;
        console.log('[mongo] Connected to MongoDB.');
        return client;
      } catch (error) {
        throw new Error(
          `Failed to connect to MongoDB at ${env.MONGODB_URI}: ${error instanceof Error ? error.message : String(error)}`
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