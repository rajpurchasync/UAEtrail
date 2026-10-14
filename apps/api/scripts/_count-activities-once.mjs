import { connectMongo, disconnectMongo, getMongoClient } from '../src/lib/mongo.js';

await connectMongo();
const c = getMongoClient().db().collection('activities');
const now = new Date();
const total = await c.countDocuments({});
const pub = await c.countDocuments({ status: 'published' });
const future = await c.countDocuments({ status: 'published', startAt: { $gte: now } });
console.log(JSON.stringify({ total, pub, future }, null, 2));
const sample = await c
  .find({})
  .project({ title: 1, status: 1, startAt: 1 })
  .sort({ startAt: 1 })
  .limit(8)
  .toArray();
console.log('sample', sample);
await disconnectMongo();
