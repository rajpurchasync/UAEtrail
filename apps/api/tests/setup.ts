process.env.NODE_ENV = 'test';
process.env.PORT = '4001';
const testMongoUri =
  process.env.MONGODB_URI_TEST;
process.env.MONGODB_URI =
  process.env.MONGODB_URI ?? testMongoUri ?? 'mongodb://127.0.0.1:27017/test';
process.env.JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET ?? 'test-access-secret-test-access-secret';
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ?? 'test-refresh-secret-test-refresh-secret';
process.env.APP_BASE_URL = process.env.APP_BASE_URL ?? 'http://localhost:5173';
process.env.API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:4000';
delete process.env.REDIS_URL;
