import { ActivityStatus } from '../src/domain/enums.js';
import { listPublishedActivitiesForExploreMapFromMongo } from '../src/lib/activity-read-assembler.js';
import { buildExploreMapBasePayload } from '../src/lib/explore-map.js';
import { getMongoClient } from '../src/lib/mongo.js';
import { ensureDemoExploreActivities } from './seed-demo-scheduled-activities.js';
import { resolveCliScriptName, runCliScript } from './cli-script-runner.js';

runCliScript(resolveCliScriptName(import.meta.url), async () => {
  const db = getMongoClient()!.db();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const mongoCount = await db.collection('activities').countDocuments({
    status: ActivityStatus.PUBLISHED,
    startAt: { $gte: startOfToday },
    joinMode: { $ne: 'private' },
  });

  console.log('[debug] published upcoming (mongo query):', mongoCount);

  await ensureDemoExploreActivities();

  const afterCount = await db.collection('activities').countDocuments({
    status: ActivityStatus.PUBLISHED,
    startAt: { $gte: startOfToday },
    joinMode: { $ne: 'private' },
  });
  console.log('[debug] after ensure:', afterCount);

  const events = await listPublishedActivitiesForExploreMapFromMongo(250);
  console.log('[debug] listPublishedActivitiesForExploreMap:', events.length);
  for (const e of events) {
    console.log(' -', e.id, e.activityType, e.startAt?.toISOString?.()?.slice(0, 10));
  }

  const payload = await buildExploreMapBasePayload();
  const acts = payload.items.filter((i) => i.source === 'activity');
  console.log('[debug] explore map payload activities:', acts.length);
  for (const a of acts) {
    console.log(' -', a.id, a.kind, a.latitude, a.longitude);
  }
});
