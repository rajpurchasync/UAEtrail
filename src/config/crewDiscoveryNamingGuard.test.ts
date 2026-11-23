import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = join(process.cwd(), 'src');
const SKIP = new Set(['node_modules', '.git', 'dist']);

const collectTs = (dir: string): string[] => {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (SKIP.has(entry)) continue;
      out.push(...collectTs(full));
    } else if ((entry.endsWith('.ts') || entry.endsWith('.tsx')) && !entry.endsWith('.d.ts')) {
      out.push(relative(process.cwd(), full).replace(/\\/g, '/'));
    }
  }
  return out;
};

const ALLOWLIST = new Set(['src/config/crewDiscoveryNamingGuard.test.ts']);

const FORBIDDEN: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\bPeopleBrowsePanel\b/, label: 'PeopleBrowsePanel (use CrewsBrowsePanel)' },
  { pattern: /\bPeopleBrowseTabContent\b/, label: 'PeopleBrowseTabContent (use CrewBrowseTabContent)' },
  { pattern: /\bpeopleBrowseOpen\b/, label: 'peopleBrowseOpen (use crewsBrowseOpen)' },
  { pattern: /\bapplyPeopleBrowseTab\b/, label: 'applyPeopleBrowseTab (use applyCrewBrowseLane)' },
  { pattern: /\bopenPeopleBrowsePanel\b/, label: 'openPeopleBrowsePanel (use openCrewsBrowsePanel)' },
  {
    pattern: /\busePeopleDiscoveryAvailabilityCatalog\b/,
    label: 'usePeopleDiscoveryAvailabilityCatalog (use useCrewDiscoveryAvailabilityCatalog)',
  },
  {
    pattern: /\bpeopleDiscoveryAvailabilityCatalogQueryKey\b/,
    label: 'peopleDiscoveryAvailabilityCatalogQueryKey (use crewDiscoveryAvailabilityCatalogQueryKey)',
  },
  { pattern: /panel\/peopleBrowse\//, label: 'panel/peopleBrowse/ path (use panel/crewBrowse/)' },
  { pattern: /\buseExplorePeopleAvailability\b/, label: 'useExplorePeopleAvailability (use useCrewDiscoveryAvailability)' },
  { pattern: /\buseMemberDiscoveryRoster\b/, label: 'useMemberDiscoveryRoster (use useCrewDiscoveryRoster)' },
  { pattern: /\buseMemberPeopleNetworkPreview\b/, label: 'useMemberPeopleNetworkPreview (use useCrewDiscoveryNetworkPreview)' },
  { pattern: /memberPeopleQueryKeys/, label: 'memberPeopleQueryKeys (use crewDiscoveryQueryKeys)' },
  { pattern: /\bexplorePeopleBrowsePath\b/, label: 'explorePeopleBrowsePath (use exploreCrewsPath)' },
  { pattern: /\bexploreCrewDiscoveryPath\b/, label: 'exploreCrewDiscoveryPath (use exploreCrewsPath)' },
  { pattern: /\buseExploreCrewDiscoveryBrowseBundle\b/, label: 'useExploreCrewDiscoveryBrowseBundle (use useCrewDiscoveryBrowseBundle)' },
  { pattern: /\bpeopleBrowse\?:/, label: 'explorePath peopleBrowse option (use crews)' },
  { pattern: /explorePeopleBrowseCopy|exploreCrewDiscoveryCopy/, label: 'deprecated crews copy shim filenames' },
  { pattern: /\bCrewDiscoveryPanel\b/, label: 'CrewDiscoveryPanel (use CrewsBrowsePanel)' },
  { pattern: /\bcrewDiscoveryOpen\b/, label: 'crewDiscoveryOpen (use crewsBrowseOpen)' },
  { pattern: /\bopenCrewDiscoveryPanel\b/, label: 'openCrewDiscoveryPanel (use openCrewsBrowsePanel)' },
  { pattern: /\bcloseCrewDiscoveryPanel\b/, label: 'closeCrewDiscoveryPanel (use closeCrewsBrowsePanel)' },
  { pattern: /\bcrewDiscoveryPanelProps\b/, label: 'crewDiscoveryPanelProps (use crewsBrowsePanelProps)' },
  { pattern: /\bclampGuestCrewDiscovery\b/, label: 'clampGuestCrewDiscovery (use clampGuestCrewsBrowse)' },
  { pattern: /\bpeopleMap\b/, label: 'peopleMap (use crewsBrowseMap)' },
  { pattern: /\bpeopleBrowsePanel/, label: 'peopleBrowsePanel* (use crewsBrowseMap*)' },
  { pattern: /\bpeopleBrowseGuest\b/, label: 'peopleBrowseGuest (use crewsBrowseMapGuest)' },
  { pattern: /\bpeopleBrowsePossibleCrewCount\b/, label: 'peopleBrowsePossibleCrewCount (use crewsBrowseMapCrewCount)' },
  { pattern: /\bPeopleProps\b/, label: 'PeopleProps (use CrewsBrowsePanelComponentProps)' },
  { pattern: /listMode === ['"]people['"]/, label: "listMode 'people' (use 'crews')" },
  { pattern: /listMode: ['"]people['"]/, label: "listMode: 'people' (use 'crews')" },
  { pattern: /CrewBrowseLookingList/, label: 'CrewBrowseLookingList (use CrewBrowseAvailabilityMapList)' },
  {
    pattern: /CREW_BROWSE_TAB_ORDER:\s*CrewBrowseTab\[\]\s*=\s*\[[^\]]*'looking'/,
    label: "retired top-level crew tab 'looking'",
  },
  { pattern: /CREW_BROWSE_TAB_LABELS[\s\S]*\blooking:\s*'/, label: "CREW_BROWSE_TAB_LABELS.looking" },
  { pattern: /crewBrowseTab === ['"]looking['"]/, label: "crewBrowseTab === 'looking' (use 'available')" },
];

describe('crewDiscoveryNamingGuard (Find crew UI vocabulary)', () => {
  it('CREW-DISC-01: legacy People browse symbols removed from app source', () => {
    const violations: string[] = [];
    for (const file of collectTs(ROOT)) {
      if (file.endsWith('.test.ts') || file.endsWith('.test.tsx')) continue;
      if (ALLOWLIST.has(file)) continue;
      const content = readFileSync(join(process.cwd(), file), 'utf8');
      for (const rule of FORBIDDEN) {
        if (rule.pattern.test(content)) violations.push(`${file}: ${rule.label}`);
      }
    }
    expect(violations, violations.join('\n')).toEqual([]);
  });

  it('CREW-DISC-02: canonical Find crew panel + tab modules exist', () => {
    expect(existsSync(join(process.cwd(), 'src/crew-discovery/panel/CrewsBrowsePanel.tsx'))).toBe(true);
    expect(existsSync(join(process.cwd(), 'src/crew-discovery/panel/crewBrowse/CrewBrowseTabContent.tsx'))).toBe(
      true
    );
    expect(existsSync(join(process.cwd(), 'src/content/exploreCrewsCopy.ts'))).toBe(true);
    expect(existsSync(join(process.cwd(), 'src/people-discovery'))).toBe(false);
  });

  it('CREW-DISC-03: no deprecated crews copy shims (single canonical exploreCrewsCopy)', () => {
    expect(existsSync(join(process.cwd(), 'src/content/explorePeopleBrowseCopy.ts'))).toBe(false);
    expect(existsSync(join(process.cwd(), 'src/content/exploreCrewDiscoveryCopy.ts'))).toBe(false);
  });
});