import { createHash } from 'node:crypto';
import type { Request, Response } from 'express';

/** Stable weak validator for a JSON body. Changes only when the serialized value changes. */
export const weakEtagFromJson = (value: unknown): string => {
  const hash = createHash('sha1').update(JSON.stringify(value)).digest('hex');
  return `W/"${hash}"`;
};

export const ifNoneMatchSatisfied = (header: unknown, etag: string): boolean => {
  if (!etag || header == null) return false;
  const raw = Array.isArray(header) ? header.join(',') : String(header);
  return raw.split(',').some((part) => {
    const token = part.trim();
    return token === '*' || token === etag;
  });
};

/** Sets validators. Returns true when the response was ended as 304. */
export const sendNotModifiedIfMatch = (req: Request, res: Response, etag: string | null): boolean => {
  if (!etag) return false;
  res.setHeader('Cache-Control', 'private, no-cache');
  res.setHeader('ETag', etag);
  if (!ifNoneMatchSatisfied(req.headers['if-none-match'], etag)) return false;
  res.status(304).end();
  return true;
};
