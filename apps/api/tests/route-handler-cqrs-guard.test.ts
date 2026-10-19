import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(process.cwd(), '..', '..');
const ROUTES_ROOT = join(ROOT, 'apps/api/src/routes');

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

const ROUTE_HANDLER_SKIP = new Set([
  'index.ts',
  'schemas.ts',
  'publishing-route-schemas.ts',
]);

const walkRouteHandlerFiles = (dir: string, acc: string[] = []): string[] => {
  for (const ent of readdirSync(dir)) {
    const p = join(dir, ent);
    if (statSync(p).isDirectory()) {
      walkRouteHandlerFiles(p, acc);
    } else if (ent.endsWith('.ts') && !ROUTE_HANDLER_SKIP.has(ent)) {
      acc.push(p);
    }
  }
  return acc;
};

const walkRegistrarFiles = (dir: string, acc: string[] = []): string[] => {
  for (const ent of readdirSync(dir)) {
    const p = join(dir, ent);
    if (statSync(p).isDirectory()) {
      walkRegistrarFiles(p, acc);
    } else if (/register[A-Z].*Routes\.ts$/.test(ent)) {
      acc.push(p);
    }
  }
  return acc;
};

const toRepoRel = (abs: string) =>
  abs.replace(/\\/g, '/').replace(`${ROOT.replace(/\\/g, '/')}/`, '');

/**
 * P4 CQRS-light — route registrars stay thin (no direct Mongo writes).
 * @see docs/SYSTEM_COHERENCE.md §5 · §8.6 P4 · MIG-CQRS-ROUTES
 */
describe('route handler CQRS guard (MIG-CQRS-ROUTES)', () => {
  it('register*Routes files do not combine COLLECTIONS with Mongo write ops', () => {
    const violations: string[] = [];
    for (const file of walkRegistrarFiles(ROUTES_ROOT)) {
      const rel = file.replace(/\\/g, '/').replace(`${ROOT.replace(/\\/g, '/')}/`, '');
      const text = readFileSync(file, 'utf8');
      if (text.includes('COLLECTIONS.') && WRITE_OPS.some((op) => text.includes(op))) {
        violations.push(rel);
      }
    }
    expect(violations).toEqual([]);
  });

  const readRegistrar = (rel: string) =>
    readFileSync(join(ROOT, rel.replace(/^\//, '')), 'utf8');

  const STORE_IMPORT = /from\s+['"][^'"]*\/lib\/[^'"]*-store(?:\.js)?['"]/g;
  const ROUTE_DATA_IMPORT =
    /from\s+['"][^'"]*\/lib\/(?:auth-users|auth-tokens|chat-data|social-data)(?:\.js)?['"]/g;

  const listStoreImports = (rel: string): string[] => {
    const text = readRegistrar(rel);
    return [...text.matchAll(STORE_IMPORT)].map((m) => m[0]);
  };

  const listRouteDataImports = (rel: string): string[] => {
    const text = readRegistrar(rel);
    return [...text.matchAll(ROUTE_DATA_IMPORT)].map((m) => m[0]);
  };

  it('all route handler modules avoid direct *-store imports', () => {
    const violations: { file: string; imports: string[] }[] = [];
    for (const file of walkRouteHandlerFiles(ROUTES_ROOT)) {
      const rel = toRepoRel(file);
      const imports = listStoreImports(rel);
      if (imports.length > 0) {
        violations.push({ file: rel, imports });
      }
    }
    expect(violations).toEqual([]);
  });

  it('auth router delegates to auth command services', () => {
    const registrar = readRegistrar('apps/api/src/routes/auth.ts');
    expect(registrar).toMatch(/auth-route-http/);
    expect(registrar).toMatch(/auth-session-flow/);
    expect(registrar).toMatch(/auth-login-commands/);
    expect(registrar).toMatch(/auth-password-commands/);
    expect(registrar).toMatch(/auth-registration-commands/);
    expect(registrar).toMatch(/auth-google-commands/);
    expect(registrar).toMatch(/auth-demo-commands/);
    expect(registrar).not.toMatch(/member-identity-read/);
    expect(registrar).not.toMatch(/auth-users/);
    expect(registrar).not.toMatch(/verifyPassword/);
    expect(registrar).not.toMatch(/hashPassword/);
  });

  it('route handlers avoid direct auth-users / auth-tokens / chat-data / social-data imports', () => {
    const violations: { file: string; imports: string[] }[] = [];
    for (const file of walkRouteHandlerFiles(ROUTES_ROOT)) {
      const rel = toRepoRel(file);
      const imports = listRouteDataImports(rel);
      if (imports.length > 0) {
        violations.push({ file: rel, imports });
      }
    }
    expect(violations).toEqual([]);
  });

  it('thin registrars delegate to services (no *-store imports)', () => {
    const thinPublicRegistrars = [
      'apps/api/src/routes/user/registerPublicAreaRoutes.ts',
      'apps/api/src/routes/user/registerPublicFacilityRoutes.ts',
      'apps/api/src/routes/user/registerExploreAvailabilityRoutes.ts',
      'apps/api/src/routes/user/registerPublicMemberRoutes.ts',
      'apps/api/src/routes/user/registerBuddyRoutes.ts',
      'apps/api/src/routes/user/registerMeWishlistRoutes.ts',
      'apps/api/src/routes/user/registerReviewRoutes.ts',
      'apps/api/src/routes/user/registerEntityFollowRoutes.ts',
      'apps/api/src/routes/user/registerFollowRoutes.ts',
      'apps/api/src/routes/user/registerPublicPlaceRoutes.ts',
      'apps/api/src/routes/user/registerPublicTenantRoutes.ts',
      'apps/api/src/routes/user/registerNotificationRoutes.ts',
      'apps/api/src/routes/user/registerMemberDiscoveryRoutes.ts',
      'apps/api/src/routes/user/registerMeParticipantIntentRoutes.ts',
      'apps/api/src/routes/user/registerMeGoalsRoutes.ts',
      'apps/api/src/routes/user/registerMeAvailabilityRoutes.ts',
      'apps/api/src/routes/user/registerMeEngagementRoutes.ts',
      'apps/api/src/routes/user/registerHostApplicationRoutes.ts',
      'apps/api/src/routes/user/registerMeSubmittedPlaceRoutes.ts',
      'apps/api/src/routes/user/registerMeFacilityRoutes.ts',
      'apps/api/src/routes/user/registerMeMapPinsRoutes.ts',
      'apps/api/src/routes/user/registerMeDiscoverOverlayRoutes.ts',
      'apps/api/src/routes/user/registerGroupRoutes.ts',
      'apps/api/src/routes/publishing/registerPublishingActivityRequestRoutes.ts',
      'apps/api/src/routes/publishing/registerPublishingActivityParticipantRoutes.ts',
      'apps/api/src/routes/publishing/registerPublishingTeamRoutes.ts',
      'apps/api/src/routes/publishing/registerPublishingSubmittedLocationRoutes.ts',
      'apps/api/src/routes/publishing/registerPublishingActivityRoutes.ts',
      'apps/api/src/routes/admin/registerAdminAuditRoutes.ts',
      'apps/api/src/routes/admin/registerAdminMetricsRoutes.ts',
      'apps/api/src/routes/admin/registerAdminContentReportRoutes.ts',
      'apps/api/src/routes/admin/registerAdminAreaRoutes.ts',
      'apps/api/src/routes/admin/registerAdminHostApplicationRoutes.ts',
      'apps/api/src/routes/admin/registerAdminNotificationRoutes.ts',
      'apps/api/src/routes/admin/registerAdminFacilityRoutes.ts',
      'apps/api/src/routes/admin/registerAdminGroupRoutes.ts',
      'apps/api/src/routes/admin/registerAdminTenantRoutes.ts',
      'apps/api/src/routes/admin/registerAdminUserRoutes.ts',
      'apps/api/src/routes/admin/registerAdminActivityModerationRoutes.ts',
      'apps/api/src/routes/admin/registerAdminPlaceRoutes.ts',
    ];
    for (const rel of thinPublicRegistrars) {
      expect(listStoreImports(rel), rel).toEqual([]);
    }
  });

  it('public area registrar wires area-public-read', () => {
    const registrar = readRegistrar('apps/api/src/routes/user/registerPublicAreaRoutes.ts');
    expect(registrar).toMatch(/area-public-read/);
    expect(registrar).not.toMatch(/COLLECTIONS\./);
  });

  it('public facility registrar wires facility-public-read', () => {
    const registrar = readRegistrar('apps/api/src/routes/user/registerPublicFacilityRoutes.ts');
    expect(registrar).toMatch(/facility-public-read/);
  });

  it('public activity registrar delegates to read + command services (no *-store)', () => {
    const registrar = readRegistrar('apps/api/src/routes/user/registerPublicActivityRoutes.ts');
    expect(registrar).toMatch(/activity-public-read/);
    expect(registrar).toMatch(/activity-participation-commands/);
    expect(listStoreImports('apps/api/src/routes/user/registerPublicActivityRoutes.ts')).toEqual([]);
  });

  it('discover overlay registrar wires explore-map-overlay-read', () => {
    const registrar = readRegistrar('apps/api/src/routes/user/registerMeDiscoverOverlayRoutes.ts');
    expect(registrar).toMatch(/explore-map-overlay-read/);
    expect(listStoreImports('apps/api/src/routes/user/registerMeDiscoverOverlayRoutes.ts')).toEqual([]);
  });

  it('public member registrar wires member-public-read', () => {
    const registrar = readRegistrar('apps/api/src/routes/user/registerPublicMemberRoutes.ts');
    expect(registrar).toMatch(/member-public-read/);
  });

  it('public tenant registrar wires tenant-public-read', () => {
    const registrar = readRegistrar('apps/api/src/routes/user/registerPublicTenantRoutes.ts');
    expect(registrar).toMatch(/tenant-public-read/);
    expect(listStoreImports('apps/api/src/routes/user/registerPublicTenantRoutes.ts')).toEqual([]);
  });

  it('notification registrar delegates to me-notifications read + commands', () => {
    const registrar = readRegistrar('apps/api/src/routes/user/registerNotificationRoutes.ts');
    expect(registrar).toMatch(/me-notifications-read/);
    expect(registrar).toMatch(/me-notifications-commands/);
    expect(listStoreImports('apps/api/src/routes/user/registerNotificationRoutes.ts')).toEqual([]);
  });

  it('member discovery registrar wires member-discovery-me-read for browse + stats', () => {
    const registrar = readRegistrar('apps/api/src/routes/user/registerMemberDiscoveryRoutes.ts');
    expect(registrar).toMatch(/member-discovery-me-read/);
    expect(listStoreImports('apps/api/src/routes/user/registerMemberDiscoveryRoutes.ts')).toEqual([]);
  });

  it('participant intent registrar delegates to me read + command services', () => {
    const registrar = readRegistrar('apps/api/src/routes/user/registerMeParticipantIntentRoutes.ts');
    expect(registrar).toMatch(/participant-intent-me-read/);
    expect(registrar).toMatch(/participant-intent-me-commands/);
    expect(listStoreImports('apps/api/src/routes/user/registerMeParticipantIntentRoutes.ts')).toEqual([]);
  });

  it('me goals registrar wires me-goals read + commands', () => {
    const registrar = readRegistrar('apps/api/src/routes/user/registerMeGoalsRoutes.ts');
    expect(registrar).toMatch(/me-goals-read/);
    expect(registrar).toMatch(/me-goals-commands/);
    expect(listStoreImports('apps/api/src/routes/user/registerMeGoalsRoutes.ts')).toEqual([]);
  });

  it('me availability registrar wires me-availability read + commands', () => {
    const registrar = readRegistrar('apps/api/src/routes/user/registerMeAvailabilityRoutes.ts');
    expect(registrar).toMatch(/me-availability-read/);
    expect(registrar).toMatch(/me-availability-commands/);
    expect(listStoreImports('apps/api/src/routes/user/registerMeAvailabilityRoutes.ts')).toEqual([]);
  });

  it('me engagement registrar delegates participation + account session services', () => {
    const registrar = readRegistrar('apps/api/src/routes/user/registerMeEngagementRoutes.ts');
    expect(registrar).toMatch(/me-activity-participation-read/);
    expect(registrar).toMatch(/activity-group-chat-me-commands/);
    expect(registrar).toMatch(/me-account-session-read/);
    expect(registrar).toMatch(/me-account-session-commands/);
    expect(listStoreImports('apps/api/src/routes/user/registerMeEngagementRoutes.ts')).toEqual([]);
  });

  it('host application registrar wires host-application-me read + commands', () => {
    const registrar = readRegistrar('apps/api/src/routes/user/registerHostApplicationRoutes.ts');
    expect(registrar).toMatch(/host-application-me-read/);
    expect(registrar).toMatch(/host-application-me-commands/);
    expect(listStoreImports('apps/api/src/routes/user/registerHostApplicationRoutes.ts')).toEqual([]);
  });

  it('me submitted place registrar wires place submit read + commands', () => {
    const registrar = readRegistrar('apps/api/src/routes/user/registerMeSubmittedPlaceRoutes.ts');
    expect(registrar).toMatch(/me-place-submit-read/);
    expect(registrar).toMatch(/me-place-submit-commands/);
    expect(listStoreImports('apps/api/src/routes/user/registerMeSubmittedPlaceRoutes.ts')).toEqual([]);
  });

  it('me facility registrar wires me-facility-submit-commands', () => {
    const registrar = readRegistrar('apps/api/src/routes/user/registerMeFacilityRoutes.ts');
    expect(registrar).toMatch(/me-facility-submit-commands/);
    expect(listStoreImports('apps/api/src/routes/user/registerMeFacilityRoutes.ts')).toEqual([]);
  });

  it('me map pins registrar wires me-map-pins read + commands', () => {
    const registrar = readRegistrar('apps/api/src/routes/user/registerMeMapPinsRoutes.ts');
    expect(registrar).toMatch(/me-map-pins-read/);
    expect(registrar).toMatch(/me-map-pins-commands/);
    expect(listStoreImports('apps/api/src/routes/user/registerMeMapPinsRoutes.ts')).toEqual([]);
  });

  it('group registrar delegates to social-groups-me read + commands', () => {
    const registrar = readRegistrar('apps/api/src/routes/user/registerGroupRoutes.ts');
    expect(registrar).toMatch(/social-groups-me-read/);
    expect(registrar).toMatch(/social-groups-me-commands/);
    expect(listStoreImports('apps/api/src/routes/user/registerGroupRoutes.ts')).toEqual([]);
  });

  it('operator activity request registrar wires publishing-activity-request read + commands', () => {
    const registrar = readRegistrar('apps/api/src/routes/publishing/registerPublishingActivityRequestRoutes.ts');
    expect(registrar).toMatch(/publishing-activity-request-read/);
    expect(registrar).toMatch(/publishing-activity-request-commands/);
    expect(listStoreImports('apps/api/src/routes/publishing/registerPublishingActivityRequestRoutes.ts')).toEqual([]);
  });

  it('operator activity participant registrar wires operator participant services', () => {
    const registrar = readRegistrar(
      'apps/api/src/routes/publishing/registerPublishingActivityParticipantRoutes.ts'
    );
    expect(registrar).toMatch(/publishing-activity-participant-read/);
    expect(registrar).toMatch(/publishing-activity-participant-commands/);
    expect(listStoreImports('apps/api/src/routes/publishing/registerPublishingActivityParticipantRoutes.ts')).toEqual(
      []
    );
  });

  it('operator team registrar wires publishing-team read + commands', () => {
    const registrar = readRegistrar('apps/api/src/routes/publishing/registerPublishingTeamRoutes.ts');
    expect(registrar).toMatch(/publishing-team-read/);
    expect(registrar).toMatch(/publishing-team-commands/);
    expect(listStoreImports('apps/api/src/routes/publishing/registerPublishingTeamRoutes.ts')).toEqual([]);
  });

  it('operator activity registrar wires publishing-tenant-activity read and commands', () => {
    const registrar = readRegistrar('apps/api/src/routes/publishing/registerPublishingActivityRoutes.ts');
    expect(registrar).toMatch(/publishing-tenant-activity-read/);
    expect(registrar).toMatch(/publishing-tenant-activity-commands/);
    expect(listStoreImports('apps/api/src/routes/publishing/registerPublishingActivityRoutes.ts')).toEqual([]);
  });

  it('operator submitted location registrar wires operator location read + commands', () => {
    const registrar = readRegistrar(
      'apps/api/src/routes/publishing/registerPublishingSubmittedLocationRoutes.ts'
    );
    expect(registrar).toMatch(/publishing-submitted-location-read/);
    expect(registrar).toMatch(/publishing-submitted-location-commands/);
    expect(listStoreImports('apps/api/src/routes/publishing/registerPublishingSubmittedLocationRoutes.ts')).toEqual(
      []
    );
  });

  it('admin audit registrar wires admin-audit-read', () => {
    const registrar = readRegistrar('apps/api/src/routes/admin/registerAdminAuditRoutes.ts');
    expect(registrar).toMatch(/admin-audit-read/);
    expect(listStoreImports('apps/api/src/routes/admin/registerAdminAuditRoutes.ts')).toEqual([]);
  });

  it('admin metrics registrar wires admin-metrics-read', () => {
    const registrar = readRegistrar('apps/api/src/routes/admin/registerAdminMetricsRoutes.ts');
    expect(registrar).toMatch(/admin-metrics-read/);
    expect(listStoreImports('apps/api/src/routes/admin/registerAdminMetricsRoutes.ts')).toEqual([]);
  });

  it('admin content reports registrar wires admin-content-reports-read', () => {
    const registrar = readRegistrar('apps/api/src/routes/admin/registerAdminContentReportRoutes.ts');
    expect(registrar).toMatch(/admin-content-reports-read/);
    expect(listStoreImports('apps/api/src/routes/admin/registerAdminContentReportRoutes.ts')).toEqual([]);
  });

  it('admin area registrar wires admin-area read and commands', () => {
    const registrar = readRegistrar('apps/api/src/routes/admin/registerAdminAreaRoutes.ts');
    expect(registrar).toMatch(/admin-area-read/);
    expect(registrar).toMatch(/admin-area-commands/);
    expect(listStoreImports('apps/api/src/routes/admin/registerAdminAreaRoutes.ts')).toEqual([]);
  });

  it('admin host application registrar wires admin-host-application read and commands', () => {
    const registrar = readRegistrar('apps/api/src/routes/admin/registerAdminHostApplicationRoutes.ts');
    expect(registrar).toMatch(/admin-host-application-read/);
    expect(registrar).toMatch(/admin-host-application-commands/);
    expect(listStoreImports('apps/api/src/routes/admin/registerAdminHostApplicationRoutes.ts')).toEqual([]);
  });

  it('admin notification registrar wires admin-notification read and commands', () => {
    const registrar = readRegistrar('apps/api/src/routes/admin/registerAdminNotificationRoutes.ts');
    expect(registrar).toMatch(/admin-notification-read/);
    expect(registrar).toMatch(/admin-notification-commands/);
    expect(listStoreImports('apps/api/src/routes/admin/registerAdminNotificationRoutes.ts')).toEqual([]);
  });

  it('admin facility registrar wires admin-facility read and commands', () => {
    const registrar = readRegistrar('apps/api/src/routes/admin/registerAdminFacilityRoutes.ts');
    expect(registrar).toMatch(/admin-facility-read/);
    expect(registrar).toMatch(/admin-facility-commands/);
    expect(listStoreImports('apps/api/src/routes/admin/registerAdminFacilityRoutes.ts')).toEqual([]);
  });

  it('admin group registrar wires admin-group read and commands', () => {
    const registrar = readRegistrar('apps/api/src/routes/admin/registerAdminGroupRoutes.ts');
    expect(registrar).toMatch(/admin-group-read/);
    expect(registrar).toMatch(/admin-group-commands/);
    expect(listStoreImports('apps/api/src/routes/admin/registerAdminGroupRoutes.ts')).toEqual([]);
  });

  it('admin tenant registrar wires admin-tenant read and commands', () => {
    const registrar = readRegistrar('apps/api/src/routes/admin/registerAdminTenantRoutes.ts');
    expect(registrar).toMatch(/admin-tenant-read/);
    expect(registrar).toMatch(/admin-tenant-commands/);
    expect(listStoreImports('apps/api/src/routes/admin/registerAdminTenantRoutes.ts')).toEqual([]);
  });

  it('admin user registrar wires admin-user read and commands', () => {
    const registrar = readRegistrar('apps/api/src/routes/admin/registerAdminUserRoutes.ts');
    expect(registrar).toMatch(/admin-user-read/);
    expect(registrar).toMatch(/admin-user-commands/);
    expect(listStoreImports('apps/api/src/routes/admin/registerAdminUserRoutes.ts')).toEqual([]);
  });

  it('admin activity moderation registrar wires admin-activity-moderation read and commands', () => {
    const registrar = readRegistrar('apps/api/src/routes/admin/registerAdminActivityModerationRoutes.ts');
    expect(registrar).toMatch(/admin-activity-moderation-read/);
    expect(registrar).toMatch(/admin-activity-moderation-commands/);
    expect(listStoreImports('apps/api/src/routes/admin/registerAdminActivityModerationRoutes.ts')).toEqual([]);
  });

  it('admin place registrar wires admin-place read and commands', () => {
    const registrar = readRegistrar('apps/api/src/routes/admin/registerAdminPlaceRoutes.ts');
    expect(registrar).toMatch(/admin-place-read/);
    expect(registrar).toMatch(/admin-place-commands/);
    expect(listStoreImports('apps/api/src/routes/admin/registerAdminPlaceRoutes.ts')).toEqual([]);
  });
});
