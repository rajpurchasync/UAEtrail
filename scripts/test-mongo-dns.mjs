import dns from 'node:dns';
import { readFileSync, existsSync } from 'node:fs';
import { MongoClient } from 'mongodb';

dns.setServers(['1.1.1.1', '8.8.8.8']);

const envPath = new URL('../.env', import.meta.url);
if (!existsSync(envPath)) {
  console.error('No .env file');
  process.exit(1);
}

const env = {};
for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eq = trimmed.indexOf('=');
  if (eq === -1) continue;
  const key = trimmed.slice(0, eq).trim();
  let value = trimmed.slice(eq + 1).trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  env[key] = value;
}

const uri = env.MONGODB_URI || env.MONGODB_URI_TEST;
if (!uri) {
  console.error('Set MONGODB_URI or MONGODB_URI_TEST in .env');
  process.exit(1);
}

const masked = uri.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:***@');
console.log('Connecting with public DNS:', masked);

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 20_000 });
try {
  await client.connect();
  await client.db('admin').command({ ping: 1 });
  console.log('OK: MongoDB reachable');
} catch (err) {
  console.error('FAIL:', err instanceof Error ? err.message : err);
  process.exit(1);
} finally {
  await client.close().catch(() => {});
}
