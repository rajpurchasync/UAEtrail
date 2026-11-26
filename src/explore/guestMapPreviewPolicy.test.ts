import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  GUEST_EXPLORE_PREVIEW_MAX_VIEWS,
  guestExplorePreviewCanSearch,
  guestExplorePreviewLimitReached,
  guestExplorePreviewViewCount,
  recordGuestExplorePreviewView,
} from './guestMapPreviewPolicy';

describe('guestMapPreviewPolicy', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('allows three unique previews then blocks search and further items', () => {
    expect(guestExplorePreviewViewCount()).toBe(0);
    expect(recordGuestExplorePreviewView('a').allowed).toBe(true);
    expect(recordGuestExplorePreviewView('b').allowed).toBe(true);
    expect(recordGuestExplorePreviewView('c').allowed).toBe(true);
    expect(guestExplorePreviewViewCount()).toBe(GUEST_EXPLORE_PREVIEW_MAX_VIEWS);
    expect(guestExplorePreviewLimitReached()).toBe(true);
    expect(guestExplorePreviewCanSearch()).toBe(false);
    expect(recordGuestExplorePreviewView('d').allowed).toBe(false);
    expect(recordGuestExplorePreviewView('a').allowed).toBe(true);
  });

  it('explore map suppresses guest preview chrome when map load failed', () => {
    const stage = readFileSync(join(process.cwd(), 'src/explore/ui/ExploreMapStage.tsx'), 'utf8');
    expect(stage).toMatch(/discoveryPortExploreGuestWire/);
    expect(stage).not.toMatch(/from ['"]\.\.\/guestMapPreviewPolicy['"]/);
    expect(stage).toMatch(/showGuestMapPreviewNotice[\s\S]*!loadError/);
    expect(stage).toMatch(/!loadError && guestExplorePreviewLimitReached\(\)/);
  });
});
