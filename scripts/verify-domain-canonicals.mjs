#!/usr/bin/env node
/**
 * Domain / routing canonical docs and entry module present.
 * @see docs/DOMAIN_CANONICALS.md
 */
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const required = [
  'docs/DOMAIN_CANONICALS.md',
  'src/config/routingCatalog.ts',
  'packages/shared-types/src/entity-path.ts',
];

let failed = false;

for (const rel of required) {
  if (!existsSync(join(root, rel))) {
    console.error(`[verify:domain] missing ${rel}`);
    failed = true;
  }
}

const canon = readFileSync(join(root, 'docs/DOMAIN_CANONICALS.md'), 'utf8');
for (const needle of ['EntityRef', 'routingCatalog', 'participant-intents', 'TRIPS_PATH']) {
  if (!canon.includes(needle)) {
    console.error(`[verify:domain] DOMAIN_CANONICALS.md missing "${needle}"`);
    failed = true;
  }
}

if (failed) {
  console.error('\n[verify:domain] FAILED');
  process.exit(1);
}

console.log('[verify:domain] docs + catalog OK');

execSync(
  'npx vitest run src/list/routing.test.ts src/config/routingHygiene.test.ts src/config/routingCatalogAdoption.test.ts src/config/systemCoherenceGuard.test.ts src/config/boundedContextAlignment.test.ts src/config/mapNavigationGuard.test.ts src/member/hostMemberGuard.test.ts src/member/organisationNamingGuard.test.ts src/wishlist/wishlistNamingGuard.test.ts src/member/archivedDocsGuard.test.ts src/api/apiLegacyGuard.test.ts src/api/services.domain-aliases.test.ts src/messaging/clientGuard.test.ts src/utils/notificationRouting.test.ts src/utils/notificationCategories.test.ts src/utils/notificationTopics.test.ts src/utils/notificationSearch.test.ts src/utils/mapLinks.test.ts src/utils/preferredNavigationApp.test.ts',
  { cwd: root, stdio: 'inherit' }
);

execSync(
  'npm --workspace @uaetrail/api run test -- --run tests/naming-coherence.test.ts tests/wishlist-naming-guard.test.ts tests/entity-follow-contract.test.ts tests/data-export-contract.test.ts tests/bounded-context-alignment.test.ts tests/member-routes-alignment.test.ts tests/admin-route-registrars.test.ts tests/platform-master-admin.test.ts tests/user-route-shell.test.ts tests/host-route-shell.test.ts tests/notification-actor-label.test.ts tests/social-people-contract.test.ts tests/social-review-contract.test.ts tests/participant-roster-dto.test.ts',
  { cwd: root, stdio: 'inherit' }
);

console.log('[verify:domain] guards OK');
