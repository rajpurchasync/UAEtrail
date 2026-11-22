import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('hostingSurfaceNamingGuard', () => {
  it('HOST-NAMING-01: community schedule lives on operator overview (not PlanDesktop*)', () => {
    expect(existsSync(join(process.cwd(), 'src/hosting/HostingHubView.tsx'))).toBe(true);
    expect(existsSync(join(process.cwd(), 'src/hosting/HostingHubPage.tsx'))).toBe(false);
    expect(existsSync(join(process.cwd(), 'src/components/plan/PlanDesktopHostingHub.tsx'))).toBe(
      false
    );
    expect(existsSync(join(process.cwd(), 'src/components/plan/PlanHostingUpcoming.tsx'))).toBe(
      false
    );
    const overview = read('src/pages/publishing/Overview.tsx');
    expect(overview).toContain('HostingHubView');
    expect(overview).toContain('PlanHostingManageProvider');
    expect(overview).not.toContain('HostingModeSwitcher');
    expect(overview).not.toContain('PlanGoalsProgressSummary');
    expect(overview).not.toContain('PlanWishlistView');
  });

  it('HOST-NAMING-02: Plan upcoming tab does not mount legacy PlanHosting* lists', () => {
    const upcoming = read('src/components/plan/PlanUpcomingView.tsx');
    expect(upcoming).not.toMatch(/PlanHostingUpcoming/);
    expect(upcoming).not.toMatch(/PlanAvailabilitySection/);
    expect(upcoming).not.toMatch(/filter === 'hosting'/);
    expect(read('src/plan/PlanPage.tsx')).toMatch(/setCommitmentFilter\('hosting'\)/);
  });

  it('HOST-NAMING-03: hosting hub does not mount legacy seeking-posts strip (MIG-DISCO-REG)', () => {
    const hub = read('src/hosting/HostingHubView.tsx');
    expect(hub).not.toMatch(/HostingSeekingPostsSection|useMySeekingPosts/);
  });
});