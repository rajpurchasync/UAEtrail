/**
 * Deactivate broken member activity-anchor rows (no name).
 * Run: npm --workspace @uaetrail/api run cleanup:orphan-locations
 */
import { getMongoClient } from '../src/lib/mongo.js';
import { COLLECTIONS } from '../src/lib/collections.js';
import { LocationStatus } from '../src/domain/enums.js';

export const deactivateOrphanActiveLocations = async (): Promise<number> => {
  const col = getMongoClient()!.db().collection(COLLECTIONS.LOCATIONS);

  const orphans = await col
    .find({
      status: LocationStatus.ACTIVE,
      $or: [{ name: null }, { name: '' }, { name: { $exists: false } }],
    })
    .project({ _id: 1 })
    .toArray();

  for (const doc of orphans) {
    await col.updateOne(
      { _id: doc._id },
      { $set: { status: LocationStatus.INACTIVE, updatedAt: new Date() } }
    );
    console.log(`Deactivated orphan location ${String(doc._id)}`);
  }

  return orphans.length;
};
