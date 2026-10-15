import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('map peek naming', () => {
  it('PEEK-NAME-02: entity pin modules use object names (not Explore*Peek*)', () => {
    expect(read('src/explore/ui/peek/activity/ActivityPeekStrips.tsx')).toMatch(/ActivityPeekStrips/);
    expect(read('src/explore/ui/peek/place/PlacePeekBody.tsx')).toMatch(/PlacePeekBody/);
    expect(read('src/activity/detail/templates/ActivityConsumerDetailPage.tsx')).toMatch(
      /ActivityPeekLinkedTransport/
    );
  });

  it('PEEK-NAME-01: canonical shell is MapPeekShell (no ExploreMapPeekCard)', () => {
    for (const file of [
      'src/explore/ui/peek/ActivityPeekCard.tsx',
      'src/explore/ui/peek/PlacePeekCard.tsx',
      'src/explore/ui/ActivityMapPeekHost.tsx',
      'src/explore/ui/peek/place/PlaceMapPeekHost.tsx',
    ]) {
      expect(read(file)).toMatch(/MapPeek/);
      expect(read(file)).not.toMatch(/ExploreMapPeekCard/);
    }
    expect(read('src/explore/ui/map-peek/MapPeekShell.tsx')).toMatch(/MapPeekShell/);
  });

  it('DISC-CARD-01: canonical discovery card VM lives under src/discovery/', () => {
    expect(read('src/discovery/discoveryCardModel.ts')).toMatch(/export interface DiscoveryCardModel/);
    expect(read('src/discovery/discoveryCardModel.ts')).toMatch(/buildDiscoveryCardModel/);
    expect(read('src/explore/exploreCardModel.ts')).toMatch(/@deprecated/);
    expect(read('src/explore/exploreCardModel.ts')).toMatch(/discovery\/discoveryCardModel/);
  });

  it('PEEK-NAME-04: map peek wire actions use ActivityPeekEngagementActions + PeekDetailLink', () => {
    expect(read('src/explore/ui/peek/activity/ActivityPeekEngagementActions.tsx')).toMatch(
      /PeekDetailLink/
    );
  });

  it('PEEK-CTA-01: wire peek CTAs render immediately (join context does not blank footer)', () => {
    const actions = read('src/explore/ui/peek/activity/ActivityPeekActions.tsx');
    expect(actions).not.toMatch(
      /wireActions\.length > 0[\s\S]*if \(joinStateLoading\) return <PeekLoading/
    );
    const joinFlow = read('src/hooks/useActivityJoinFlow.ts');
    expect(joinFlow).toMatch(/loading: queryEnabled && isLoading/);
    expect(joinFlow).not.toMatch(/isLoading \|\| isFetching/);
  });

  it('PEEK-NAME-03: activity map host is ActivityMapPeekHost; venue wire uses PlaceMapPeekHost', () => {
    expect(read('src/explore/ui/ActivityMapPeekHost.tsx')).toMatch(/ActivityMapPeekHost/);
    expect(read('src/explore/ui/ExploreMapStage.tsx')).toMatch(/PlaceMapPeekHost/);
    expect(read('src/explore/ui/peek/place/PlaceMapPeekHost.tsx')).toMatch(/PlacePeekCard/);
  });
});
