/**
 * Bump every activity startAt (and endAt when present) to ~2 months from now, staggered by 2 days.
 * Usage: npm --workspace @uaetrail/api run bump-activity-dates
 */
import { connectMongo, disconnectMongo, getMongoClient } from '../src/lib/mongo.js';
import { invalidateExploreMapCache } from '../src/lib/explore-map-cache.js';

const bumpActivityDates = async () => {
  await connectMongo();
  const collection = getMongoClient()!.db().collection('activities');
  const docs = await collection.find({}).sort({ startAt: 1 }).toArray();

  if (docs.length === 0) {
    console.log('No activities found.');
    return;
  }

  const anchor = new Date();
  anchor.setMonth(anchor.getMonth() + 2);
  anchor.setHours(9, 0, 0, 0);

  let updated = 0;
  for (let index = 0; index < docs.length; index += 1) {
    const doc = docs[index];
    const startAt = new Date(anchor);
    startAt.setDate(startAt.getDate() + index * 2);

    const patch: Record<string, unknown> = {
      startAt,
      updatedAt: new Date()
    };

    if (doc.endAt instanceof Date) {
      const durationMs = Math.max(doc.endAt.getTime() - (doc.startAt?.getTime?.() ?? startAt.getTime()), 2 * 60 * 60 * 1000);
      patch.endAt = new Date(startAt.getTime() + durationMs);
    }

    await collection.updateOne({ _id: doc._id }, { $set: patch });
    updated += 1;
    console.log(`  ${String(doc._id)} → ${startAt.toISOString()} (${doc.title ?? 'untitled'})`);
  }

  console.log(`Updated ${updated} activit${updated === 1 ? 'y' : 'ies'} to future dates.`);
  await invalidateExploreMapCache();
};

bumpActivityDates()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectMongo();
  });
