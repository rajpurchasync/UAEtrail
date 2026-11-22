import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = join(process.cwd(), 'src');

const EXCLUDE_DIRS = new Set(['node_modules', '.git', 'dist']);

const collectTs = (dir: string): string[] => {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (EXCLUDE_DIRS.has(entry)) continue;
      out.push(...collectTs(full));
    } else if ((entry.endsWith('.ts') || entry.endsWith('.tsx')) && !entry.endsWith('.d.ts')) {
      out.push(relative(process.cwd(), full).replace(/\\/g, '/'));
    }
  }
  return out;
};

const FORBIDDEN: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\btripLookingOnly\b/, label: 'tripLookingOnly (use tripAvailabilityOnly)' },
  { pattern: /listLookingCatalog/, label: 'listLookingCatalog (use listAvailabilityCatalog)' },
  { pattern: /filterListLookingCatalogItems/, label: 'filterListLookingCatalogItems' },
  { pattern: /mapItemMatchesLookingPill/, label: 'mapItemMatchesLookingPill' },
  { pattern: /\bdiscoveryCardIsFindCrewPin\b/, label: 'discoveryCardIsFindCrewPin' },
  { pattern: /BROWSE_TRIP_PLAN_TYPE_OPTIONS/, label: 'dead trip plan type dropdown' },
  { pattern: /listDemandCatalog/, label: 'listDemandCatalog shim' },
  { pattern: /counts\.seeking/, label: 'area detail counts.seeking wire' },
  { pattern: /kind: 'seeking'/, label: 'plan calendar seeking detail kind (use mapSlot)' },
  { pattern: /\bmarkers\.seeking\b/, label: 'plan calendar seeking marker (use mapSlot)' },
  { pattern: /m\.seeking\b/, label: 'plan calendar seeking marker assign (use mapSlot)' },
  { pattern: /\bseekFixedCompose\b/, label: 'seekFixedCompose (use intentFixedCompose)' },
  { pattern: /\bseekFlexibleCompose\b/, label: 'seekFlexibleCompose (use intentOpenCompose)' },
  { pattern: /\bavailabilityFlexibleCompose\b/, label: 'availabilityFlexibleCompose (use intentOpenCompose)' },
  { pattern: /\bavailabilityFixedCompose\b/, label: 'availabilityFixedCompose (use intentFixedCompose)' },
  { pattern: /\bavailabilityOpenCompose\b/, label: 'availabilityOpenCompose (use intentOpenCompose)' },
  { pattern: /\bisSeekFixedWizard\b/, label: 'isSeekFixedWizard (use isIntentFixedWizard)' },
  { pattern: /\bisSeekFlexibleWizard\b/, label: 'isSeekFlexibleWizard (use isIntentOpenWizard)' },
  { pattern: /\bisAvailabilityFixedWizard\b/, label: 'isAvailabilityFixedWizard (use isIntentFixedWizard)' },
  { pattern: /\bisAvailabilityOpenWizard\b/, label: 'isAvailabilityOpenWizard (use isIntentOpenWizard)' },
  { pattern: /\bSEEK_FIXED_COMPOSE_OPTIONS\b/, label: 'SEEK_FIXED_COMPOSE_OPTIONS' },
  { pattern: /\bSEEK_MODE_OPTIONS\b/, label: 'SEEK_MODE_OPTIONS' },
  { pattern: /\bADD_COMPOSE_OPTIONS\b/, label: 'ADD_COMPOSE_OPTIONS (use CREATE_VENUE_ADD_COMPOSE_OPTIONS)' },
  { pattern: /\bSeekFlexibleComposeSheet\b/, label: 'SeekFlexibleComposeSheet (use IntentOpenComposeSheet)' },
  { pattern: /\bMarkAvailabilityComposeSheet\b/, label: 'MarkAvailabilityComposeSheet (use IntentOpenComposeSheet)' },
  { pattern: /\bCreateIntentSheet\b/, label: 'CreateIntentSheet (use CreateKindSheet)' },
  { pattern: /\bexport const hostCompose\b/, label: 'hostCompose export (use activityCompose)' },
  { pattern: /\bFabTopLevel\b/, label: 'FabTopLevel (use ComposeKind)' },
  { pattern: /\bSeekFlexibleCompose\b/, label: 'SeekFlexibleCompose (retired seeking product name)' },
];

const ALLOWLIST = new Set([
  'src/config/availabilityLineageRepoGuard.test.ts',
  'src/config/mapChromeRetiredTermsGuard.test.ts',
  'src/config/memberAvailabilityLineageGuard.test.ts',
  'src/config/seekingPeekUnificationGuard.test.ts',
  'src/explore/exploreMapItemWireGuard.test.ts',
  'src/explore/compose.test.ts',
]);

/** Product `src/` must not reintroduce demand/looking map list paths (MIG-DISCO-REG). */
describe('availabilityLineageRepoGuard', () => {
  it('AVAIL-REPO-01: banned symbols absent from app source', () => {
    const files = collectTs(ROOT);
    const violations: string[] = [];

    for (const file of files) {
      if (file.endsWith('.test.ts') || file.endsWith('.test.tsx')) continue;
      if (ALLOWLIST.has(file)) continue;
      const content = readFileSync(join(process.cwd(), file), 'utf8');
      for (const rule of FORBIDDEN) {
        if (rule.pattern.test(content)) {
          violations.push(`${file}: ${rule.label}`);
        }
      }
    }

    expect(violations, violations.join('\n')).toEqual([]);
  });

  it('AVAIL-REPO-02: list URL serializes availability-only as filter=availability', () => {
    const url = readFileSync(join(process.cwd(), 'src/list/browse/browseListUrlState.ts'), 'utf8');
    expect(url).toMatch(/params\.set\('filter', 'availability'\)/);
    expect(url).toMatch(/listFilterMeansAvailabilityOnly/);
  });

  it('AVAIL-REPO-04: plan calendar models fixed slots as mapSlot (not seeking)', () => {
    const plan = readFileSync(join(process.cwd(), 'src/plan/planCalendarMarkers.ts'), 'utf8');
    expect(plan).toMatch(/kind: 'mapSlot'/);
    expect(plan).toMatch(/mapSlot: boolean/);
    expect(plan).not.toMatch(/kind: 'seeking'/);
    expect(plan).not.toMatch(/\bseeking: boolean/);
  });

  it('AVAIL-REPO-03: activity mode filter uses availability wire (not seeking serialize)', () => {
    const mode = readFileSync(join(process.cwd(), 'src/explore/exploreActivityModeFilter.ts'), 'utf8');
    expect(mode).toMatch(/return 'availability'/);
    expect(mode).not.toMatch(/serializeExploreActivityModeFilter[\s\S]*'seeking'/);
    const modeFilter = readFileSync(join(process.cwd(), 'src/explore/exploreActivityModeFilter.ts'), 'utf8');
    expect(modeFilter).not.toMatch(/serializeExploreActivityModeFilter[\s\S]*'seeking'/);
  });
});