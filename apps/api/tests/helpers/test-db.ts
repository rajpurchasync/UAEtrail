/** Isolated MongoDB used only by automated API integration tests. */
export const DEFAULT_TEST_MONGODB_URI = 'mongodb://127.0.0.1:27017/uaetrail_test';

export const extractDatabaseName = (uri: string): string => {
  const match = uri.match(/mongodb(?:\+srv)?:\/\/[^/]+\/([^?]+)/);
  return match?.[1] ?? '';
};

/** Refuse to run vitest against dev/staging/prod database names. */
export const assertTestDatabaseName = (uri: string): void => {
  const dbName = extractDatabaseName(uri);
  if (!dbName) {
    throw new Error(
      'TEST_MONGODB_URI must include a database name (for example /uaetrail_test). Automated tests cannot use the default connection database.'
    );
  }

  const allowed =
    dbName === 'uaetrail_ci' || dbName.endsWith('_test') || dbName.endsWith('_ci');

  if (!allowed) {
    throw new Error(
      `Refusing to run API tests against database "${dbName}". ` +
        'Use an isolated database such as mongodb://127.0.0.1:27017/uaetrail_test'
    );
  }
};

export const resolveTestMongoUri = (): string =>
  process.env.TEST_MONGODB_URI?.trim() || DEFAULT_TEST_MONGODB_URI;

export const configureTestMongoUri = (): void => {
  const uri = resolveTestMongoUri();
  assertTestDatabaseName(uri);
  process.env.MONGODB_URI = uri;
};
