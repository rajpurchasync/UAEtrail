import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('hostingSurfaceNamingGuard', () => {
  it('HOST-NAMING-01: hosting hub lives under src/hosting (not PlanDesktop*)', () => {
    expect(existsSync(join(process.cwd(), 'src/hosting/HostingHubView.tsx'))).toBe(true);
    expect(existsSync(join(process.cwd(), 'src/components/plan/PlanDesktopHostingHub.tsx'))).toBe(
      false
    );
    expect(existsSync(join(process.cwd(), 'src/components/plan/PlanHostingUpcoming.tsx'))).toBe(
      false
    );
    const page = read('src/hosting/HostingHubPage.tsx');
    expect(page).toContain('HostingHubView');
    expect(page).not.toContain('PlanDesktopHostingHub');
  });

  it('HOST-NAMING-02: Plan upcoming tab does not mount legacy PlanHosting* lists', () => {
    const upcoming = read('src/components/plan/PlanUpcomingView.tsx');
    expect(upcoming).not.toMatch(/PlanHostingUpcoming/);
    expect(upcoming).not.toMatch(/filter === 'hosting'/);
    expect(read('src/plan/PlanPage.tsx')).toMatch(/HOSTING_HUB_PATH/);
  });

  it('HOST-NAMING-03: hosting hub does not mount legacy seeking-posts strip (MIG-DISCO-REG)', () => {
    const hub = read('src/hosting/HostingHubView.tsx');
    expect(hub).not.toMatch(/HostingSeekingPostsSection|useMySeekingPosts/);
  });
});