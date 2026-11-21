import type { Request, Response } from 'express';
import { getRedisClient } from './redis.js';
import { sendNotModifiedIfMatch, weakEtagFromJson } from './http-etag.js';

/** Map catalog only — legacy `seeking` etag slot retired (MIG-DISCO-REG). */
export type CatalogEtagSlot = 'map';

const REDIS_KEY: Record<CatalogEtagSlot, string> = {
  map: 'explore:catalog-etag:map',
};

const RETIRED_SEEKING_ETAG_KEY = 'explore:catalog-etag:seeking';

const memory = new Map<CatalogEtagSlot, string>();
let payloadTag: string | null = null;
/** Serializes Redis writes so a delete cannot land after a newer validator. */
let redisChain: Promise<void> = Promise.resolve();

const enqueueRedis = (task: () => Promise<void>): Promise<void> => {
  redisChain = redisChain.then(task, task);
  return redisChain;
};

const deleteRedisEtags = async (): Promise<void> => {
  const redis = await getRedisClient();
  if (!redis) return;
  try {
    await redis.del([REDIS_KEY.map, RETIRED_SEEKING_ETAG_KEY]);
  } catch {
    /* non-fatal */
  }
};

const dropResponseEtags = (): void => {
  memory.clear();
  void enqueueRedis(deleteRedisEtags);
};

/** Drop response validators when the shared map payload actually changes. */
export const noteExplorePayloadTag = (tag: string): void => {
  if (payloadTag === tag) return;
  const hadPayload = payloadTag !== null;
  payloadTag = tag;
  if (!hadPayload) return;
  dropResponseEtags();
};

export const clearCatalogResponseEtags = (): Promise<void> => {
  payloadTag = null;
  memory.clear();
  return enqueueRedis(deleteRedisEtags);
};

export const readCatalogResponseEtag = async (slot: CatalogEtagSlot): Promise<string | null> => {
  await redisChain;
  const cached = memory.get(slot);
  if (cached) return cached;
  const redis = await getRedisClient();
  if (!redis) return null;
  try {
    const value = await redis.get(REDIS_KEY[slot]);
    if (!value) return null;
    memory.set(slot, value);
    return value;
  } catch {
    return null;
  }
};

export const rememberCatalogResponseEtag = (slot: CatalogEtagSlot, etag: string): Promise<void> => {
  memory.set(slot, etag);
  return enqueueRedis(async () => {
    if (memory.get(slot) !== etag) return;
    const redis = await getRedisClient();
    if (!redis) return;
    try {
      await redis.set(REDIS_KEY[slot], etag);
    } catch {
      /* non-fatal */
    }
  });
};

/**
 * 304 before the catalog is built when this process already knows the validator.
 * Otherwise hash `body`, remember it, and 304 if the client already has that body.
 * Returns true when the response has been ended.
 */
export const finishCatalogEtag = async (
  req: Request,
  res: Response,
  slot: CatalogEtagSlot,
  body: unknown
): Promise<boolean> => {
  const etag = weakEtagFromJson(body);
  await rememberCatalogResponseEtag(slot, etag);
  return sendNotModifiedIfMatch(req, res, etag);
};
