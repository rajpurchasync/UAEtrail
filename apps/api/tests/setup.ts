import { configureTestMongoUri } from './helpers/test-db.js';

process.env.NODE_ENV = 'test';
process.env.PORT = '4001';
configureTestMongoUri();
process.env.JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET ?? 'test-access-secret-test-access-secret';
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ?? 'test-refresh-secret-test-refresh-secret';
process.env.APP_BASE_URL = process.env.APP_BASE_URL ?? 'http://localhost:5173';
process.env.API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:4000';
delete process.env.REDIS_URL;
