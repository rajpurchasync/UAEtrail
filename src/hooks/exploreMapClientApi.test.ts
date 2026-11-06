import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const clientApiPath = join(ROOT, 'src/hooks/exploreMapClientApi.ts');

describe('exploreMapClientApi', () => {
  it('fetches map catalog and overlay in parallel', () => {
    const source = readFileSync(clientApiPath, 'utf8');
    expect(source).toContain('Promise.all');
    expect(source).toContain('fetchExploreMapOverlayIfSignedIn');
    expect(source).toContain('auth: true');
    expect(source).not.toMatch(
      /if \(result\.notModified\)[\s\S]*await fetchExploreMapOverlayIfSignedIn/
    );
  });
});
