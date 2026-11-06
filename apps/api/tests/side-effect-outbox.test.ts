import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { NotificationType } from '../src/domain/enums.js';
import { COLLECTIONS } from '../src/lib/collections.js';
import { getMongoClient } from '../src/lib/mongo.js';
import {
  SideEffectOutboxStatus,
  enqueueNotificationOutbox,
  enqueueExploreMapCacheInvalidateOutbox
} from '../src/lib/side-effect-outbox-store.js';
import { dispatchNotification, scheduleNotification } from '../src/services/notifications.js';
import {
  drainSideEffectOutbox,
  processSideEffectOutboxEntry
} from '../src/services/side-effect-outbox-processor.js';
import {
  readExploreMapMemoryCache,
  writeExploreMapMemoryCache
} from '../src/lib/explore-map-cache.js';
import { configureTestEnv } from './helpers/bootstrap.js';
import { configureTestMongoUri } from './helpers/test-db.js';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

import { isSideEffectOutboxEnabled } from '../src/lib/side-effect-outbox.js';

describe('side-effect outbox enablement', () => {
  it('is on in production unless explicitly disabled', () => {
    const prevNode = process.env.NODE_ENV;
    const prevFlag = process.env.SIDE_EFFECT_OUTBOX;
    process.env.NODE_ENV = 'production';
    delete process.env.SIDE_EFFECT_OUTBOX;
    expect(isSideEffectOutboxEnabled()).toBe(true);
    process.env.SIDE_EFFECT_OUTBOX = '0';
    expect(isSideEffectOutboxEnabled()).toBe(false);
    process.env.NODE_ENV = prevNode;
    if (prevFlag === undefined) delete process.env.SIDE_EFFECT_OUTBOX;
    else process.env.SIDE_EFFECT_OUTBOX = prevFlag;
  });
});

describe('side-effect notification outbox (SIDE_EFFECT_OUTBOX)', () => {
  beforeAll(async () => {
    configureTestEnv();
    configureTestMongoUri();
    const { connectMongo } = await import('../src/lib/mongo.js');
    await connectMongo();
    process.env.SIDE_EFFECT_OUTBOX = '1';
  });

  afterAll(async () => {
    delete process.env.SIDE_EFFECT_OUTBOX;
    const client = getMongoClient();
    if (client) {
      await client.db().collection(COLLECTIONS.SIDE_EFFECT_OUTBOX).deleteMany({});
      await client.db().collection(COLLECTIONS.NOTIFICATIONS).deleteMany({
        title: 'outbox-test'
      });
    }
  });

  it('processes enqueued notification into notifications collection', async () => {
    const userId = 'outbox-user-1';
    const outboxId = await enqueueNotificationOutbox(
      {
        userId,
        title: 'outbox-test',
        body: 'hello',
        type: NotificationType.SYSTEM
      },
      'test.outbox_enqueue'
    );

    await processSideEffectOutboxEntry(outboxId);

    const row = await getMongoClient()!
      .db()
      .collection(COLLECTIONS.NOTIFICATIONS)
      .findOne({ userId, title: 'outbox-test' });
    expect(row).toBeTruthy();

    const outbox = await getMongoClient()!
      .db()
      .collection(COLLECTIONS.SIDE_EFFECT_OUTBOX)
      .findOne({ _id: outboxId });
    expect(outbox?.status).toBe(SideEffectOutboxStatus.DONE);
  });

  it('scheduleNotification uses outbox when flag is on', async () => {
    const userId = 'outbox-user-2';
    scheduleNotification(
      {
        userId,
        title: 'outbox-test',
        body: 'scheduled',
        type: NotificationType.SYSTEM
      },
      'test.schedule'
    );

    await sleep(400);

    const row = await getMongoClient()!
      .db()
      .collection(COLLECTIONS.NOTIFICATIONS)
      .findOne({ userId, body: 'scheduled' });
    expect(row).toBeTruthy();
  });

  it('drain processes pending notification rows', async () => {
    const userId = 'outbox-user-drain';
    await enqueueNotificationOutbox(
      {
        userId,
        title: 'outbox-test',
        body: 'drain-me',
        type: NotificationType.SYSTEM
      },
      'test.drain'
    );

    const processed = await drainSideEffectOutbox();
    expect(processed).toBeGreaterThanOrEqual(1);

    const row = await getMongoClient()!
      .db()
      .collection(COLLECTIONS.NOTIFICATIONS)
      .findOne({ userId, body: 'drain-me' });
    expect(row).toBeTruthy();
  });

  it('processes explore map cache invalidate outbox kind', async () => {
    writeExploreMapMemoryCache({ items: [] });
    expect(readExploreMapMemoryCache()).toBeTruthy();

    const outboxId = await enqueueExploreMapCacheInvalidateOutbox('test.map_invalidate');
    await processSideEffectOutboxEntry(outboxId);

    expect(readExploreMapMemoryCache()).toBeNull();
  });

  it('dispatchNotification still works when outbox flag is off', async () => {
    delete process.env.SIDE_EFFECT_OUTBOX;
    const userId = 'outbox-user-3';
    await dispatchNotification({
      userId,
      title: 'outbox-test',
      body: 'direct',
      type: NotificationType.SYSTEM
    });
    process.env.SIDE_EFFECT_OUTBOX = '1';

    const row = await getMongoClient()!
      .db()
      .collection(COLLECTIONS.NOTIFICATIONS)
      .findOne({ userId, body: 'direct' });
    expect(row).toBeTruthy();
  });
});
