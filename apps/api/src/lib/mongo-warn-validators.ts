import type { Db } from 'mongodb';
import { COLLECTIONS } from './collections.js';
import { logger } from './logger.js';

/**
 * Plan §16.5 JSON Schema validators in warn mode.
 * Not attached to `activities` / `locations`: existing documents predate the plan
 * required fields and would flood logs. New collections only.
 * collMod can fail on Server API strict / standalone without validator support — skip then.
 */
export const ensureMongoWarnValidators = async (db: Db): Promise<void> => {
  const apply = async (name: string, validator: Record<string, unknown>) => {
    try {
      await db.command({
        collMod: name,
        validator,
        validationLevel: 'moderate',
        validationAction: 'warn',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (/ns does not exist|NamespaceNotFound/i.test(message)) {
        await db.createCollection(name).catch(() => undefined);
        try {
          await db.command({
            collMod: name,
            validator,
            validationLevel: 'moderate',
            validationAction: 'warn',
          });
        } catch (err2) {
          logger.warn({ err: err2, collection: name }, 'mongo warn validator skipped');
        }
        return;
      }
      logger.warn({ err, collection: name }, 'mongo warn validator skipped');
    }
  };

  await apply(COLLECTIONS.GEO_NODES, {
    $jsonSchema: {
      bsonType: 'object',
      required: ['level', 'kind', 'slug', 'path', 'names'],
      properties: {
        level: { enum: [1, 2, 3, 4] },
        kind: { enum: ['country', 'state', 'area', 'venue'] },
        status: { enum: ['active', 'hidden'] },
      },
    },
  });
  await apply(COLLECTIONS.SUBMISSIONS, {
    $jsonSchema: {
      bsonType: 'object',
      required: ['kind', 'status', 'dedupe', 'submittedBy'],
      properties: {
        status: { enum: ['pending', 'approved', 'rejected', 'merged', 'withdrawn'] },
        kind: { enum: ['area', 'venue', 'trail', 'camp_spot', 'facility', 'edit'] },
      },
    },
  });
};
