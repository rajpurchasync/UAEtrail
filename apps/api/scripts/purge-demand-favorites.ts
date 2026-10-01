/**
 * Remove legacy user_favorites rows that bookmarked demand (participant_intents).
 * Wishlist is private intent only — demand is public participation on Explore.
 *
 * Usage:
 *   npm --workspace @uaetrail/api run purge-demand-favorites
 *   DRY_RUN=1 npm --workspace @uaetrail/api run purge-demand-favorites
 */
import { COLLECTIONS } from '../src/lib/collections.js';
import { connectMongo, disconnectMongo, getMongoClient } from '../src/lib/mongo.js';

const dryRun = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true';

const purgeDemandBookmarkFavorites = async () => {
  await connectMongo();
  const favorites = getMongoClient()!.db().collection(COLLECTIONS.USER_FAVORITES);
  const filter = { participantIntentId: { $exists: true, $nin: [null, ''] } };
  const count = await favorites.countDocuments(filter);

  if (count === 0) {
    console.log('No demand bookmark favorites to remove.');
    return;
  }

  if (dryRun) {
    console.log(`DRY_RUN: would delete ${count} user_favorites row(s) with participantIntentId.`);
    const sample = await favorites.find(filter, { projection: { _id: 1, userId: 1, participantIntentId: 1 } }).limit(10).toArray();
    for (const row of sample) {
      console.log(`  ${row._id} user=${row.userId} intent=${row.participantIntentId}`);
    }
    if (count > sample.length) console.log(`  … and ${count - sample.length} more`);
    return;
  }

  const result = await favorites.deleteMany(filter);
  console.log(`Deleted ${result.deletedCount} demand bookmark favorite(s).`);
};

purgeDemandBookmarkFavorites()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectMongo();
  });
