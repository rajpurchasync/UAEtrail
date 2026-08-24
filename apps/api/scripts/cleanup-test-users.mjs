import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MongoClient } from 'mongodb';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(scriptDir, '../../../.env') });
dotenv.config();

/** Synthetic users created by vitest — never real registrations. */
const TEST_USER_EMAIL_FILTER = {
  $or: [
    { email: { $regex: /@example\.com$/i } },
    { email: { $regex: /@test\.local$/i } },
    { email: { $regex: /@deleted\.uaetrail\.internal$/i } }
  ]
};

const DEFAULT_URIS = [
  'mongodb://127.0.0.1:27017/test',
  'mongodb://127.0.0.1:27017/uaetrail_test',
  process.env.MONGODB_URI
].filter(Boolean);

const uris = [...new Set((process.argv.slice(2).length > 0 ? process.argv.slice(2) : DEFAULT_URIS))];

const cleanupDatabase = async (uri) => {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();

  const users = await db.collection('auth_users').find(TEST_USER_EMAIL_FILTER, { projection: { _id: 1, email: 1 } }).toArray();
  if (users.length === 0) {
    console.log(`[${extractDbName(uri)}] No synthetic test users found.`);
    await client.close();
    return;
  }

  const userIds = users.map((user) => String(user._id));

  await Promise.all([
    db.collection('auth_refresh_tokens').deleteMany({ userId: { $in: userIds } }),
    db.collection('auth_email_verification_tokens').deleteMany({ userId: { $in: userIds } }),
    db.collection('auth_password_reset_tokens').deleteMany({ userId: { $in: userIds } })
  ]);

  const result = await db.collection('auth_users').deleteMany({ _id: { $in: userIds } });

  console.log(`[${extractDbName(uri)}] Removed ${result.deletedCount} synthetic test user(s):`);
  for (const user of users) {
    console.log(`  - ${user.email}`);
  }

  await client.close();
};

const extractDbName = (uri) => {
  const match = uri.match(/mongodb(?:\+srv)?:\/\/[^/]+\/([^?]+)/);
  return match?.[1] ?? uri;
};

for (const uri of uris) {
  try {
    await cleanupDatabase(uri);
  } catch (error) {
    console.error(`[${extractDbName(uri)}] Cleanup failed:`, error instanceof Error ? error.message : error);
  }
}
