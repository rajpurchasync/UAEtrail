import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

/**
 * @see MIG-PLATFORM-COMPOSE-OPERATOR-2026 · scripts/refactor-program.json
 * Guards program registration + UPL spine so docs/guards do not drift back to stale compose wire.
 */
describe('migPlatformComposeOperatorProgramGuard (compose + operator program)', () => {
  it('PCO-01: migration registered in progress on P4b', () => {
    const program = JSON.parse(read('scripts/refactor-program.json')) as {
      migrations?: Array<{ id: string; status: string; phase?: string }>;
    };
    const row = program.migrations?.find((m) => m.id === 'MIG-PLATFORM-COMPOSE-OPERATOR-2026');
    expect(row).toBeDefined();
    expect(row?.status).toBe('in_progress');
    expect(row?.phase).toBe('P4b');
  });

  it('PCO-02: Tier-1 documents migration target wire (not seek as canonical emit)', () => {
    const create = read('docs/CREATE_FLOW.md');
    expect(create).toMatch(/MIG-PLATFORM-COMPOSE-OPERATOR-2026/);
    expect(create).toMatch(/activity:\*|place:\*|intent:/);
    const domain = read('docs/DOMAIN_CANONICALS.md');
    expect(domain).toMatch(/MIG-PLATFORM-COMPOSE-OPERATOR-2026/);
    expect(domain).toMatch(/intent:/);
  });

  it('PCO-03: UPL compose kind constants + intent action label', () => {
    const upl = read('src/content/upl-glossary.ts');
    expect(upl).toMatch(/UPL_COMPOSE_KIND_ACTIVITY/);
    expect(upl).toMatch(/UPL_COMPOSE_KIND_PLACE/);
    expect(upl).toMatch(/UPL_COMPOSE_KIND_INTENT/);
    expect(upl).toMatch(/UPL_DISCOVER_CREWS/);
    expect(upl).toMatch(/UPL_MY_CREWS/);
    expect(upl).toMatch(/UPL_OPERATOR_DASHBOARD/);
    expect(upl).toMatch(/UPL_INTENT_OPEN_ACTION/);
  });

  it('PCO-04: SocialHubNav retired — SocialHubIndex canonical', () => {
    expect(existsSync(join(ROOT, 'src/components/social/SocialHubIndex.tsx'))).toBe(true);
    expect(existsSync(join(ROOT, 'src/components/social/SocialHubNav.tsx'))).toBe(false);
    const buddies = read('src/pages/Buddies.tsx');
    expect(buddies).toMatch(/from '\.\.\/components\/social\/SocialHubIndex'/);
  });

  it('PCO-05: verify-compose-spine runs program guard', () => {
    const script = read('scripts/verify-compose-spine.mjs');
    expect(script).toMatch(/migPlatformComposeOperatorProgramGuard/);
  });

  it('PCO-06: SYSTEM_COHERENCE references program id', () => {
    const coherence = read('docs/SYSTEM_COHERENCE.md');
    expect(coherence).toMatch(/MIG-PLATFORM-COMPOSE-OPERATOR-2026/);
  });

  it('PCO-08: FE compose spine — CreateKindSheet + no legacy compose aliases', () => {
    expect(existsSync(join(ROOT, 'src/explore/ui/CreateKindSheet.tsx'))).toBe(true);
    expect(existsSync(join(ROOT, 'src/explore/ui/CreateIntentSheet.tsx'))).toBe(false);
    expect(existsSync(join(ROOT, 'src/explore/ui/IntentOpenComposeSheet.tsx'))).toBe(true);
    expect(existsSync(join(ROOT, 'src/explore/ui/MarkAvailabilityComposeSheet.tsx'))).toBe(false);
    const compose = read('src/explore/compose.ts');
    expect(compose).toMatch(/activityCompose/);
    expect(compose).not.toMatch(/FabTopLevel/);
    expect(compose).not.toMatch(/export const hostCompose/);
  });

  it('PCO-09: compose flow catalog ids use activity/intent/place prefixes', () => {
    const catalog = read('src/explore/composeFlowCatalog.ts');
    expect(catalog).toMatch(/'activity\.hiking'/);
    expect(catalog).toMatch(/'intent\.fixed\.hiking'/);
    expect(catalog).toMatch(/'place\.facility'/);
    expect(catalog).not.toMatch(/'host\.hiking'/);
    expect(catalog).not.toMatch(/'seek\.fixed\./);
    expect(catalog).not.toMatch(/'add\.place\./);
    const ids = read('src/explore/composeFlowIds.ts');
    expect(ids).toMatch(/normalizeComposeFlowId/);
  });

  it('PCO-10: wishlist saves use POST /me/wishlist facade (not compose)', () => {
    expect(existsSync(join(ROOT, 'src/wishlist/saveWishlistTarget.ts'))).toBe(true);
    const facade = read('src/wishlist/saveWishlistTarget.ts');
    expect(facade).toMatch(/addWishlistTarget/);
    expect(read('packages/shared-types/src/compose-route.ts')).not.toMatch(/wishlist:/);
    expect(read('src/explore/ui/useExploreWishlistSave.ts')).toMatch(/saveWishlistFromResolvedTarget/);
    expect(read('src/components/plan/PlanWishlistPickSheet.tsx')).toMatch(/saveWishlistTarget/);
  });

  it('PCO-07: shared-types emits activity|place|intent wire (legacy inbound only)', () => {
    const wire = read('packages/shared-types/src/compose-route.ts');
    expect(wire).toMatch(/migrateLegacyComposeWire/);
    expect(wire).toMatch(/activity:\$\{route\.kind\}/);
    expect(wire).toMatch(/intent:open/);
    expect(wire).not.toMatch(/return `host:/);
    expect(read('scripts/authority-matrix.json')).toMatch(/compose.emit_activity/);
  });
});