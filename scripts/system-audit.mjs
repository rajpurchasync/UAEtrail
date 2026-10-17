#!/usr/bin/env node
/**
 * CTO whole-system audit baseline — routes, collections (read/write), integrations, FE/API shape.
 * @see scripts/cto-audit-pillars.json
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outPath = join(root, 'scripts/system-audit-baseline.json');
const routesOutPath = join(root, 'scripts/system-audit-routes.json');

const WRITE_OPS = [
  'insertOne',
  'insertMany',
  'updateOne',
  'updateMany',
  'deleteOne',
  'deleteMany',
  'replaceOne',
  'bulkWrite',
  'findOneAndUpdate',
  'findOneAndDelete',
  'findOneAndReplace',
];

const walkTs = (dir, acc = []) => {
  if (!existsSync(dir)) return acc;
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, ent.name);
    if (ent.isDirectory() && ent.name !== 'node_modules') walkTs(p, acc);
    else if (ent.isFile() && ent.name.endsWith('.ts') && !ent.name.endsWith('.d.ts')) acc.push(p);
  }
  return acc;
};

const layerFor = (rel) => {
  if (rel.includes('/routes/')) return 'route';
  if (rel.includes('/services/')) return 'service';
  if (rel.includes('/lib/') && rel.includes('-store')) return 'store';
  if (rel.includes('/lib/')) return 'lib';
  if (rel.includes('/domain/')) return 'domain';
  return 'other';
};

const registrarFiles = walkTs(join(root, 'apps/api/src/routes')).filter((f) =>
  /register[A-Z].*Routes\.ts$/.test(f)
);

const routeEndpoints = [];
const routePattern = /router\.(get|post|put|patch|delete)\(\s*['"`]([^'"`]+)['"`]/g;
const registrarServices = {};

for (const file of registrarFiles) {
  const rel = relative(root, file).replace(/\\/g, '/');
  const text = readFileSync(file, 'utf8');
  let m;
  while ((m = routePattern.exec(text)) !== null) {
    routeEndpoints.push({ method: m[1].toUpperCase(), path: m[2], registrar: rel });
  }
  const services = [
    ...text.matchAll(/from\s+['"](\.\.\/)+services\/([^'"]+)['"]/g),
  ].map((x) => x[2].replace(/\.js$/, ''));
  registrarServices[rel] = [...new Set(services)].sort();
}

const collectionsTs = readFileSync(join(root, 'apps/api/src/lib/collections.ts'), 'utf8');
const collectionKeys = [...collectionsTs.matchAll(/^\s+([A-Z_]+):\s+'([^']+)'/gm)].map((m) => ({
  key: m[1],
  name: m[2],
}));

const apiSrc = join(root, 'apps/api/src');
const apiFiles = walkTs(apiSrc);

const collectionUsage = {};
const collectionWriters = {};

for (const { key, name } of collectionKeys) {
  const needle = `COLLECTIONS.${key}`;
  const readers = [];
  const writers = [];

  for (const f of apiFiles) {
    const rel = relative(root, f).replace(/\\/g, '/');
    const t = readFileSync(f, 'utf8');
    if (!t.includes(needle)) continue;
    readers.push(rel);
    const writeOps = WRITE_OPS.filter((op) => t.includes(op));
    if (writeOps.length > 0) {
      writers.push({ file: rel, layer: layerFor(rel), ops: writeOps });
    }
  }

  collectionUsage[key] = {
    mongoName: name,
    referencingFiles: readers.length,
    writerFiles: writers.length,
    sampleFiles: readers.slice(0, 6),
  };
  collectionWriters[key] = {
    mongoName: name,
    writers,
    writerFileCount: writers.length,
  };
}

const orphanCollections = collectionKeys
  .filter(({ key }) => collectionUsage[key].referencingFiles === 0)
  .map(({ key, name }) => ({ key, mongoName: name }));

const multiWriterCollections = collectionKeys
  .filter(({ key }) => collectionWriters[key].writerFileCount > 4)
  .map(({ key }) => ({
    key,
    mongoName: collectionUsage[key].mongoName,
    writerFileCount: collectionWriters[key].writerFileCount,
  }))
  .sort((a, b) => b.writerFileCount - a.writerFileCount);

const routeLayerViolations = [];
for (const f of apiFiles) {
  const rel = relative(root, f).replace(/\\/g, '/');
  if (!rel.includes('/routes/') || !rel.includes('register')) continue;
  const t = readFileSync(f, 'utf8');
  if (WRITE_OPS.some((op) => t.includes(op)) && t.includes('COLLECTIONS.')) {
    routeLayerViolations.push(rel);
  }
}

const mounts = JSON.parse(
  readFileSync(join(root, 'scripts/bounded-context-manifest.json'), 'utf8')
).apiMounts;

const integrations = [
  { id: 'mongodb', type: 'database', env: ['MONGODB_URI', 'MONGODB_URI_TEST', 'MONGODB_URI_STAGING', 'MONGODB_URI_PROD'] },
  { id: 'redis', type: 'cache_rate_sse', env: ['REDIS_URL'], prodRequired: true },
  { id: 's3_minio', type: 'object_storage', env: ['S3_ENDPOINT', 'S3_BUCKET', 'S3_ACCESS_KEY_ID'] },
  {
    id: 'stripe',
    type: 'webhook',
    path: '/api/shop/webhook/stripe',
    env: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'],
    store: 'stripe_webhook_events',
  },
  { id: 'email', type: 'smtp', env: ['SMTP_URL_PROD', 'SENDGRID_API_KEY', 'SMTP_HOST'], prodRequired: true },
  { id: 'google_oauth', type: 'oauth', env: ['GOOGLE_CLIENT_ID'] },
  { id: 'web_push', type: 'push', env: ['VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY'] },
  { id: 'jwt', type: 'auth', env: ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'] },
];

const appTs = readFileSync(join(root, 'src/App.tsx'), 'utf8');
const spaRoutes = (appTs.match(/<Route\b/g) ?? []).length;

const feDomainFiles = readdirSync(join(root, 'src/api/domains')).filter(
  (f) => f.endsWith('.ts') && !f.endsWith('.test.ts') && f !== 'index.ts'
);

const pillars = JSON.parse(readFileSync(join(root, 'scripts/cto-audit-pillars.json'), 'utf8'));

const baseline = {
  generated: new Date().toISOString().slice(0, 10),
  description: 'CTO system audit baseline. Regenerate: npm run system:audit',
  summary: {
    apiRegistrarFiles: registrarFiles.length,
    apiRouteEndpointsParsed: routeEndpoints.length,
    mongoCollectionsDefined: collectionKeys.length,
    mongoCollectionsOrphanInApi: orphanCollections.length,
    mongoCollectionsMultiWriterOver4: multiWriterCollections.length,
    routeRegistrarsWithDirectWrites: routeLayerViolations.length,
    apiMounts: mounts.length,
    spaRouteElements: spaRoutes,
    feDomainModules: feDomainFiles.length,
    boundedContexts: JSON.parse(
      readFileSync(join(root, 'scripts/bounded-context-manifest.json'), 'utf8')
    ).contexts.length,
  },
  risks: {
    orphanCollections,
    multiWriterCollectionsTop: multiWriterCollections.slice(0, 12),
    routeLayerViolations,
  },
  apiMounts: mounts,
  integrations,
  collectionUsage,
  collectionWritersSummary: Object.fromEntries(
    collectionKeys.map(({ key }) => [key, collectionWriters[key].writerFileCount])
  ),
  registrarServicesSample: Object.fromEntries(
    Object.entries(registrarServices).slice(0, 8)
  ),
  auditPillars: pillars.pillars.map((p) => ({ id: p.id, name: p.name })),
  waves: {
    W0: 'system-audit baseline + verify:system-audit',
    W1: 'CPC-7 close + seeking:deploy-gate',
    W2: 'explore read model + outbox',
  },
};

writeFileSync(outPath, `${JSON.stringify(baseline, null, 2)}\n`, 'utf8');
writeFileSync(
  routesOutPath,
  `${JSON.stringify(
    {
      generated: baseline.generated,
      endpoints: routeEndpoints,
      registrarServices,
    },
    null,
    2
  )}\n`,
  'utf8'
);

console.log(`[system:audit] wrote ${outPath}`);
console.log(`[system:audit] wrote ${routesOutPath}`);
console.log(JSON.stringify(baseline.summary, null, 2));
if (routeLayerViolations.length > 0) {
  console.warn(
    `[system:audit] WARN ${routeLayerViolations.length} registrars touch COLLECTIONS + write ops (review for §5 thin routes)`
  );
}
