import type { Db } from 'mongodb';
import { canonicalizeNotificationBookmarkPath } from '@uaetrail/shared-types';
import { COLLECTIONS } from './collections.js';

/** One-time: notification bookmarks → canonical SPA paths. */
export const migrateStaleNotificationBookmarkPaths = async (db: Db): Promise<void> => {
  const notifications = db.collection(COLLECTIONS.NOTIFICATIONS);
  const rows = await notifications
    .find({
      $or: [{ path: /^\// }, { 'meta.path': /^\// }],
    })
    .project({ _id: 1, path: 1, meta: 1 })
    .toArray();

  let rewritten = 0;
  for (const row of rows) {
    const set: Record<string, string> = {};

    if (typeof row.path === 'string') {
      const next = canonicalizeNotificationBookmarkPath(row.path);
      if (next !== row.path) set.path = next;
    }

    const meta =
      row.meta && typeof row.meta === 'object' ? (row.meta as { path?: unknown }) : null;
    const metaPath = typeof meta?.path === 'string' ? meta.path : null;
    if (metaPath) {
      const next = canonicalizeNotificationBookmarkPath(metaPath);
      if (next !== metaPath) set['meta.path'] = next;
    }

    if (Object.keys(set).length === 0) continue;
    await notifications.updateOne({ _id: row._id }, { $set: set });
    rewritten += 1;
  }

  if (rewritten > 0) {
    console.log(`[mongo] Stale notification bookmark path(s): ${rewritten}`);
  }
};