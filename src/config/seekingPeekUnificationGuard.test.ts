import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

const _collectTsxUnder = (dir: string): string[] => {
  const root = join(process.cwd(), dir);
  const files: string[] = [];
  const walk = (current: string) => {
    for (const entry of readdirSync(current)) {
      const full = join(current, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (entry.endsWith('.tsx') || entry.endsWith('.ts')) {
        files.push(relative(process.cwd(), full).replace(/\\/g, '/'));
      }
    }
  };
  walk(root);
  return files;
};

describe('seekingPeekUnificationGuard (S12 — one activity peek stack)', () => {
  it('SEEK-PEEK-01: map stage mounts hosted + seeking via ActivityMapPeekHost only', () => {
    const stage = read('src/explore/ui/ExploreMapStage.tsx');
    expect(stage).toMatch(/ActivityMapPeekHost/);
    expect(stage).not.toMatch(/DemandOwner|LegacySeeking|showLegacySeeking/);
  });

  it('SEEK-PEEK-02: activity peek actions use resolveActivityPeekEngagement only', () => {
    const actions = read('src/explore/ui/peek/activity/ActivityPeekActions.tsx');
    expect(actions).toMatch(/resolveActivityPeekEngagement/);
    expect(actions).toMatch(/ActivityPeekStandardFooter/);
    expect(actions).not.toMatch(/LegacyIntent|HostManageActions|discoveryCardIsSeeking/);
  });

  it('SEEK-PEEK-03: peek selection enrich is single module (organizer join hide only)', () => {
    expect(read('src/discovery/enrichDiscoveryPeekSelection.ts')).not.toMatch(/showLegacySeeking/);
    expect(read('src/explore/exploreSelectionSelectedCard.ts')).toMatch(/enrichDiscoveryPeekSelection/);
    expect(read('src/list/enrichListFeedCard.ts')).toMatch(/enrichDiscoveryPeekSelection/);
  });

  it('SEEK-PEEK-04: L1 card normalizes seeking to source activity', () => {
    expect(read('src/discovery/discoveryCardModel.ts')).toMatch(
      /exploreMapItemIsSeeking\(item\) \? 'activity'/
    );
  });

  it('SEEK-PEEK-05: map peek join hook is activity-only', () => {
    const hook = read('src/explore/ui/useExploreSelectionPeekJoin.ts');
    expect(hook).toMatch(/useActivityJoinContext/);
    expect(hook).not.toMatch(/useParticipantIntentJoinContext|createParticipantIntentJoinRequest/);
  });
});
