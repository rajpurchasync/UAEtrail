/**
 * In-memory web-vitals buffer (plan §15.6).
 * Never writes one Mongo document per vital — flush at most once per minute per instance.
 */
export type WebVitalSample = {
  n: string;
  v: number;
  path?: string;
  d?: string;
  conn?: string;
  at: number;
};

const MAX_BUFFER = 400;
const FLUSH_MS = 60_000;

let buffer: WebVitalSample[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let lastFlushAt = 0;

export const webVitalsBufferSize = (): number => buffer.length;

export const resetWebVitalsBufferForTests = (): void => {
  buffer = [];
  lastFlushAt = 0;
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
};

const takeBatch = (): WebVitalSample[] => {
  const batch = buffer;
  buffer = [];
  lastFlushAt = Date.now();
  return batch;
};

export const flushWebVitalsBatchToMongo = async (
  batch: WebVitalSample[]
): Promise<void> => {
  const { randomUUID } = await import('node:crypto');
  const { getMongoClient } = await import('./mongo.js');
  const { COLLECTIONS } = await import('./collections.js');
  const { logError } = await import('./logger.js');
  try {
    await getMongoClient()
      .db()
      .collection<{ _id: string; at: Date; count: number; samples: WebVitalSample[] }>(
        COLLECTIONS.WEB_VITALS_BATCHES
      )
      .insertOne({
        _id: randomUUID(),
        at: new Date(),
        count: batch.length,
        samples: batch,
      });
  } catch (error) {
    logError('web vitals batch dropped to log', error, { count: batch.length });
  }
};

export const enqueueWebVital = (
  sample: Omit<WebVitalSample, 'at'> & { at?: number },
  flush: (batch: WebVitalSample[]) => Promise<void> | void
): void => {
  if (buffer.length >= MAX_BUFFER) buffer.shift();
  buffer.push({
    n: sample.n.slice(0, 32),
    v: Number(sample.v),
    path: sample.path?.slice(0, 200),
    d: sample.d?.slice(0, 32),
    conn: sample.conn?.slice(0, 32),
    at: sample.at ?? Date.now(),
  });
  if (flushTimer) return;
  const wait = Math.max(0, FLUSH_MS - (Date.now() - lastFlushAt));
  flushTimer = setTimeout(() => {
    flushTimer = null;
    const batch = takeBatch();
    if (batch.length === 0) return;
    void Promise.resolve(flush(batch)).catch(() => {
      /* drop batch — never block requests or retry-storm Mongo */
    });
  }, wait);
};
