/**
 * Dev audit: locations/facilities where geoRef.names.venue equals leaf name
 * (destination hub conflated with spot title).
 *
 * Usage: node apps/api/scripts/audit-geo-ref-leaf.mjs
 */
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/uaetrail';

const auditCollection = async (db, name) => {
  const rows = await db
    .collection(name)
    .find({ geoRef: { $exists: true, $ne: null } }, { projection: { name: 1, geoRef: 1 } })
    .limit(5000)
    .toArray();
  const issues = [];
  for (const row of rows) {
    const leaf = String(row.name ?? '').trim().toLowerCase();
    const venue = String(row.geoRef?.names?.venue ?? '').trim().toLowerCase();
    if (!leaf || !venue) continue;
    if (leaf === venue) {
      issues.push({ id: String(row._id), name: row.name, venueName: row.geoRef.names.venue });
    }
  }
  return issues;
};

const main = async () => {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();
  const locationIssues = await auditCollection(db, 'locations');
  const facilityIssues = await auditCollection(db, 'facilities');
  await client.close();
  const all = [...locationIssues, ...facilityIssues];
  if (all.length === 0) {
    console.log('geoRef leaf audit: OK (no venue-name collisions in sample)');
    return;
  }
  console.log(`geoRef leaf audit: ${all.length} issue(s)`);
  for (const row of all.slice(0, 50)) {
    console.log(`- ${row.id} "${row.name}" venue="${row.venueName}"`);
  }
  if (all.length > 50) console.log(`… and ${all.length - 50} more`);
  process.exitCode = 1;
};

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});