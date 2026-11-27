import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('mongo migration runner guard', () => {
  it('records named steps (no monolithic version early-return)', () => {
    const migrations = read('src/lib/mongo-migrations.ts');
    expect(migrations).toMatch(/runMongoMigrationSteps/);
    expect(migrations).toMatch(/buildMongoMigrationSteps/);
    expect(migrations).toMatch(/MONGO_MIGRATION_VERSION = 2025112510/);
    expect(migrations).not.toMatch(
      /state\?\.version === 'number' && state\.version >= MONGO_MIGRATION_VERSION/
    );
    expect(migrations).not.toMatch(/if \(typeof state\?\.version === 'number' && state\.version >= MONGO_MIGRATION_VERSION\)/);
  });

  it('retired seeking purge is a named boot step', () => {
    const migrations = read('src/lib/mongo-migrations.ts');
    expect(migrations).toMatch(/MONGO_MIGRATION_SEEKING_PURGE_STEP_ID/);
    expect(migrations).toMatch(/id: MONGO_MIGRATION_SEEKING_PURGE_STEP_ID/);
    expect(migrations).toMatch(/purgeRetiredSeekingStorage/);
  });

  it('runner persists appliedSteps on schema_meta.migrations', () => {
    const runner = read('src/lib/mongo-migration-runner.ts');
    expect(runner).toMatch(/appliedSteps/);
    expect(runner).toMatch(/integer-only version/);
  });
});