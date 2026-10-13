import type { RequestHandler } from 'express';

/** Rewrites legacy member status URLs to `GET /me/status` (one handler — no parallel v1/v2 routes). */
export const legacyMemberStatusPathRewrite: RequestHandler = (req, _res, next) => {
  const pathOnly = (req.url ?? '').split('?')[0] ?? '';
  if (pathOnly === '/me/host-status' || pathOnly === '/me/operator-status') {
    const query = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
    req.url = `/me/status${query}`;
  }
  next();
};
