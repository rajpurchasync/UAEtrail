/**
 * One-time Mongo backfill: copy legacy `areaLabel` → `placeHubLabel` on locations + facilities.
 * Run: node apps/api/scripts/backfill-place-hub-label.mjs (with MONGODB_URI)
 */
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI required');
  process.exit(1);
}

const client = new MongoClient(uri);

const backfillCollection = async (db, name) => {
  const col = db.collection(name);
  const cursor = col.find({
    areaLabel: { $type: 'string', $ne: '' },
    $or: [{ placeHubLabel: { $exists: false } }, { placeHubLabel: null }, { placeHubLabel: '' }],
  });
  let n = 0;
  for await (const doc of cursor) {
    const label = String(doc.areaLabel).trim();
    if (!label) continue;
    await col.updateOne(
      { _id: doc._id },
      { $set: { placeHubLabel: label }, $unset: { areaLabel: '' } }
    );
    n += 1;
  }
  return n;
};

try {
  await client.connect();
  const db = client.db();
  const locations = await backfillCollection(db, 'locations');
  const facilities = await backfillCollection(db, 'facilities');
  console.log(`Backfill complete — locations: ${locations}, facilities: ${facilities}`);
} finally {
  await client.close();
}