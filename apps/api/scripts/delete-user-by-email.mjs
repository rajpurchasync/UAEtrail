import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(scriptDir, '../../../.env') });
dotenv.config();

const email = (process.argv[2] ?? '').trim().toLowerCase();
if (!email) {
  console.error('Usage: node scripts/delete-user-by-email.mjs <email>');
  process.exit(1);
}

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI is not set.');
  process.exit(1);
}

const client = new MongoClient(uri);
await client.connect();
const db = client.db();

const users = await db
  .collection('auth_users')
  .find({ email: { $regex: `^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } })
  .toArray();

if (users.length === 0) {
  console.log('NOT_FOUND');
  await client.close();
  process.exit(0);
}

for (const user of users) {
  const userId = String(user._id);
  await Promise.all([
    db.collection('auth_refresh_tokens').deleteMany({ userId }),
    db.collection('auth_email_verification_tokens').deleteMany({ userId }),
    db.collection('auth_password_reset_tokens').deleteMany({ userId })
  ]);
  const result = await db.collection('auth_users').deleteOne({ _id: user._id });
  console.log(
    JSON.stringify({
      deleted: result.deletedCount === 1,
      email: user.email,
      userId,
      emailVerified: Boolean(user.emailVerifiedAt)
    })
  );
}

await client.close();
