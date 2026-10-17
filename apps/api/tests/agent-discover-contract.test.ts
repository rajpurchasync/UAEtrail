import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildAgentManifest } from '../src/lib/agent-manifest.js';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('agent discover contract', () => {
  it('registers public agent routes under /api/agent', () => {
    const index = read('src/routes/index.ts');
    const agent = read('src/routes/agent.ts');
    expect(index).toMatch(/agentRouter/);
    expect(index).toMatch(/\/agent/);
    expect(agent).toMatch(/\/discover/);
    expect(agent).toMatch(/\/manifest\.json/);
  });

  it('manifest points at discover search and llms docs', () => {
    const manifest = buildAgentManifest('https://uaetrail.com');
    expect(manifest.discovery.search_url).toBe('https://uaetrail.com/api/agent/discover');
    expect(manifest.documentation.llms_txt).toBe('https://uaetrail.com/llms.txt');
    expect(manifest.product_home).toBe('https://uaetrail.com/explore');
    expect(manifest.disallowed_paths).toContain('/api/me/');
    expect(manifest.allowed_scrape_paths).toContain('/place/');
    expect(manifest.allowed_scrape_paths).toContain('/facility/');
    expect(manifest.allowed_scrape_paths).toContain('/api/places');
    expect(manifest.allowed_scrape_paths).toContain('/api/facilities');
  });

  it('llms.txt documents agent discover API', () => {
    const llms = readFileSync(join(process.cwd(), '../../public/llms.txt'), 'utf8');
    expect(llms).toContain('/api/agent/discover');
    expect(llms).toContain('/explore');
    expect(llms).not.toContain('/trail-points');
  });
});
