import type { Db } from 'mongodb';

export type MongoMigrationStep = {
  readonly id: string;
  readonly run: (db: Db) => Promise<void>;
};

export type SchemaMigrationState = {
  _id: 'migrations';
  version?: number;
  appliedAt?: Date;
  appliedSteps?: string[];
};

const migrationsMeta = (db: Db) => db.collection<SchemaMigrationState>('schema_meta');

/**
 * Run registered boot migrations once each — tracked by stable step id in `schema_meta.migrations.appliedSteps`.
 * Legacy deploys that only recorded `version` are backfilled without re-running steps.
 */
export const runMongoMigrationSteps = async (
  db: Db,
  steps: readonly MongoMigrationStep[],
  targetVersion: number
): Promise<void> => {
  const meta = migrationsMeta(db);
  const state = await meta.findOne({ _id: 'migrations' });
  const knownIds = steps.map((step) => step.id);
  const applied = new Set<string>(
    Array.isArray(state?.appliedSteps)
      ? state.appliedSteps.filter((id) => knownIds.includes(id))
      : []
  );

  const integerOnlyAlreadyAtTarget =
    applied.size === 0 &&
    typeof state?.version === 'number' &&
    state.version >= targetVersion;

  if (integerOnlyAlreadyAtTarget) {
    await meta.updateOne(
      { _id: 'migrations' },
      {
        $set: {
          version: targetVersion,
          appliedSteps: knownIds,
          appliedAt: state.appliedAt ?? new Date(),
        },
      },
      { upsert: true }
    );
    console.log(
      `[mongo] migrations: integer-only version ${state.version} — recorded ${knownIds.length} named steps (no replay)`
    );
    return;
  }

  if (applied.size === knownIds.length) {
    return;
  }

  for (const step of steps) {
    if (applied.has(step.id)) continue;
    console.log(`[mongo] migration step: ${step.id}`);
    await step.run(db);
    applied.add(step.id);
    await meta.updateOne(
      { _id: 'migrations' },
      {
        $set: {
          version: targetVersion,
          appliedAt: new Date(),
          appliedSteps: [...applied],
        },
      },
      { upsert: true }
    );
  }
};