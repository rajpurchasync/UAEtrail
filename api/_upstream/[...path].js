import { proxyToUpstream } from '../lib/upstream-proxy.js';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  const parts = req.query.path;
  const subpath = Array.isArray(parts) ? parts.join('/') : parts || '';
  await proxyToUpstream(req, res, `/${subpath}`);
}
