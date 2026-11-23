import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const ROUTE_REGISTRY_FILES = [
  'src/App.tsx',
  'src/routing/AppRoutes.tsx',
  'src/routing/appLazyPages.tsx',
];

const repoRoot = join(__dirname, '..', '..');

/** Route paths and lazy page imports (App shell + routing modules). */
export const readAppRouteRegistry = () =>
  ROUTE_REGISTRY_FILES.map((rel) => readFileSync(join(repoRoot, rel), 'utf8')).join('\n');
