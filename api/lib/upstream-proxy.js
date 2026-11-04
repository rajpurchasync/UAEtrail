const STRIP_REQUEST_HEADERS = new Set(['host', 'connection', 'content-length', 'transfer-encoding']);

function upstreamOrigin() {
  return process.env.UAETRAIL_API_ORIGIN?.replace(/\/$/, '') ?? '';
}

function buildTargetUrl(upstreamPath, rawUrl) {
  const origin = upstreamOrigin();
  const path = upstreamPath.startsWith('/') ? upstreamPath : `/${upstreamPath}`;
  const queryIndex = rawUrl?.indexOf('?') ?? -1;
  const query = queryIndex >= 0 ? rawUrl.slice(queryIndex) : '';
  return `${origin}${path}${query}`;
}

function forwardRequestHeaders(req) {
  const headers = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (value == null) continue;
    if (STRIP_REQUEST_HEADERS.has(key.toLowerCase())) continue;
    headers[key] = Array.isArray(value) ? value.join(', ') : value;
  }
  return headers;
}

function forwardResponseHeaders(upstream, res) {
  upstream.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'transfer-encoding') return;
    res.setHeader(key, value);
  });
}

export async function proxyToUpstream(req, res, upstreamPath) {
  const origin = upstreamOrigin();
  if (!origin) {
    res.status(503).json({
      error: 'UAETRAIL_API_ORIGIN is not configured',
      hint: 'Set UAETRAIL_API_ORIGIN to your public API origin (e.g. https://app.example.com) in Vercel project settings.',
    });
    return;
  }

  const target = buildTargetUrl(upstreamPath, req.url);
  const method = req.method ?? 'GET';

  try {
    const upstream = await fetch(target, {
      method,
      headers: forwardRequestHeaders(req),
      body: method === 'GET' || method === 'HEAD' ? undefined : req,
      // @ts-expect-error Node fetch streaming
      duplex: 'half',
      redirect: 'manual',
    });

    res.status(upstream.status);
    forwardResponseHeaders(upstream, res);
    const body = Buffer.from(await upstream.arrayBuffer());
    res.send(body);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upstream request failed';
    res.status(502).json({ error: message, target });
  }
}
