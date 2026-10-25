import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

const collectTsxUnder = (dir: string): string[] => {
  const root = join(process.cwd(), dir);
  const files: string[] = [];
  const walk = (current: string) => {
    for (const entry of readdirSync(current)) {
      const full = join(current, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (entry.endsWith('.tsx')) files.push(relative(process.cwd(), full).replace(/\\/g, '/'));
    }
  };
  walk(root);
  return files;
};

describe('discoveryUiMethodologyGuard', () => {
  it('DISC-METH-01: Tier-1 documents the discovery UI stack (L0–L3)', () => {
    const coherence = read('docs/SYSTEM_COHERENCE.md');
    expect(coherence).toMatch(/### 6\.1 Discovery UI stack/);
    expect(coherence).toMatch(/mapPeekSlots/);
    expect(coherence).toMatch(/src\/discovery\/discoveryCardModel/);
  });

  it('DISC-METH-02: activity peek wires entity slots — not legacy ExploreItemPeekParts', () => {
    const peek = read('src/explore/ui/peek/ActivityPeekCard.tsx');
    expect(peek).toMatch(/from ['"].*map-peek/);
    expect(peek).toMatch(/MapPeekActionsSlot/);
    expect(peek).toMatch(/MapPeekBodySlot/);
    expect(peek).not.toMatch(/ExploreItemPeekParts/);
  });

  it('DISC-METH-05: wire-driven activity + shop peek actions live under peek/', () => {
    expect(read('src/explore/ui/peek/activity/ActivityPeekEngagementActions.tsx')).toMatch(
      /ActivityPeekEngagementActions/
    );
    expect(read('src/explore/ui/peek/shop/ShopPeekActions.tsx')).toMatch(/ShopPeekActions/);
    expect(read('src/explore/ui/map-peek/mapPeekSlots.tsx')).toMatch(/ShopPeekActions/);
    expect(read('src/explore/ui/peek/activity/ActivityPeekActions.tsx')).toMatch(
      /ActivityPeekStandardFooter/
    );
  });

  it('DISC-METH-03: source branching for activity pin host lives in mapPeekSlots', () => {
    const slots = read('src/explore/ui/map-peek/mapPeekSlots.tsx');
    expect(slots).toMatch(/card\.source === 'area'/);
    expect(slots).toMatch(/card\.source === 'shop'/);
    expect(slots).toMatch(/card\.source === 'activity'/);
    const actions = read('src/explore/ui/peek/activity/ActivityPeekActions.tsx');
    expect(actions).not.toMatch(/card\.source === 'area'/);
  });

  it('DISC-METH-06: ActivityMapPeekHost and PlaceMapPeekHost are mount wrappers — not organizer “host” UI', () => {
    expect(read('src/explore/ui/ActivityMapPeekHost.tsx')).toMatch(/ActivityPeekCard/);
    expect(read('src/explore/ui/ActivityMapPeekHost.tsx')).not.toMatch(/ActivityPeekHostManageActions/);
    expect(read('src/explore/ui/peek/place/PlaceMapPeekHost.tsx')).toMatch(/PlacePeekCard/);
  });

  it('DISC-METH-07: member people browse uses L1 row model (parallel to discoveryCardModel)', () => {
    expect(read('src/people-discovery/memberBrowseRowModel.ts')).toMatch(/MemberBrowseRowVm/);
    const tab = read('src/people-discovery/panel/peopleBrowse/PeopleBrowseTabContent.tsx');
    expect(tab).toMatch(/memberBrowseRowModel/);
    expect(tab).not.toMatch(/memberDiscoverProfilePath/);
  });

  it('DISC-METH-08: member profile links centralized in memberProfileLink', () => {
    expect(read('src/member/memberProfileLink.ts')).toMatch(/memberProfilePath/);
    const model = read('src/people-discovery/memberBrowseRowModel.ts');
    expect(model).toMatch(/memberProfileLink/);
    expect(model).not.toMatch(/`\/member\/\$\{/);
  });

  it('DISC-METH-09: list/map people browse shares people-discovery panel module', () => {
    expect(existsSync(join(process.cwd(), 'src/list/ui/ListDiscoverPeopleView.tsx'))).toBe(false);
    expect(read('src/list/ListDiscoveryExperience.tsx')).toMatch(/PeopleBrowsePanel/);
    expect(read('src/people-discovery/panel/PeopleBrowsePanel.tsx')).toMatch(
      /from '\.\/peopleBrowse'/
    );
  });

  it('DISC-METH-04: no Explore*Peek* modules under explore/ui (use map-peek + peek/{entity}/)', () => {
    const violations: string[] = [];
    for (const file of collectTsxUnder('src/explore/ui')) {
      const base = file.split('/').pop() ?? '';
      if (/^Explore.*Peek.*\.tsx$/.test(base)) violations.push(file);
    }
    expect(
      violations,
      `Use MapPeekShell + peek/{entity}/ — remove Explore*Peek*:\n${violations.join('\n')}`
    ).toEqual([]);
  });

  it('DISC-METH-10: no ExploreFollowed* modules (folder is namespace; people-discovery owns people rows)', () => {
    const hits = collectTsxUnder('src/explore/ui').filter((file) => /ExploreFollowed/.test(file));
    expect(hits).toEqual([]);
    expect(read('src/explore/exploreBrowseUrlHydrate.ts')).not.toMatch(/ExploreFollowedSegment/);
    expect(read('src/explore/exploreBrowseUrlHydrate.ts')).not.toMatch(/followedKind/);
  });

  it('DISC-METH-11: explore does not re-export people browse (people-discovery owns the module)', () => {
    expect(existsSync(join(process.cwd(), 'src/explore/ui/peopleBrowse'))).toBe(false);
    expect(existsSync(join(process.cwd(), 'src/explore/peopleBrowseTab.ts'))).toBe(false);
    expect(read('src/explore/exploreBrowseUrlHydrate.ts')).toMatch(
      '@/people-discovery/peopleBrowseTab'
    );
  });
});
