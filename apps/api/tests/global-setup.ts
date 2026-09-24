import { MongoClient } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  assertTestDatabaseName,
  DEFAULT_TEST_MONGODB_URI,
  resolveTestMongoUri,
} from './helpers/test-db.js';

const TEST_DB_NAME = 'uaetrail_test';

let memoryServer: MongoMemoryServer | null = null;

const canConnect = async (uri: string, timeoutMs: number): Promise<boolean> => {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: timeoutMs, connectTimeoutMS: timeoutMs });
  try {
    await client.connect();
    await client.db('admin').command({ ping: 1 });
    return true;
  } catch {
    return false;
  } finally {
    await client.close().catch(() => undefined);
  }
};

const applyTestMongoUri = (uri: string): void => {
  assertTestDatabaseName(uri);
  process.env.TEST_MONGODB_URI = uri;
  process.env.MONGODB_URI = uri;
};

export default async function globalSetup(): Promise<() => Promise<void>> {
  process.env.NODE_ENV = 'test';

  const explicit = process.env.TEST_MONGODB_URI?.trim();
  if (explicit) {
    applyTestMongoUri(explicit);
    return async () => undefined;
  }

  if (process.env.API_TEST_USE_LOCAL_MONGO === '1') {
    applyTestMongoUri(resolveTestMongoUri());
    return async () => undefined;
  }

  if (await canConnect(DEFAULT_TEST_MONGODB_URI, 2_500)) {
    applyTestMongoUri(DEFAULT_TEST_MONGODB_URI);
    return async () => undefined;
  }

  memoryServer = await MongoMemoryServer.create();
  const baseUri = memoryServer.getUri();
  const uri = baseUri.endsWith('/') ? `${baseUri}${TEST_DB_NAME}` : `${baseUri}/${TEST_DB_NAME}`;
  applyTestMongoUri(uri);
  console.log('[test] Using in-memory MongoDB for API integration tests');

  return async () => {
    await memoryServer?.stop();
    memoryServer = null;
  };
}
