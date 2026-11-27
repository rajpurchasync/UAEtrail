import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

const collectProductTs = (dir: string): string[] => {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules') continue;
      out.push(...collectProductTs(full));
    } else if (
      (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) &&
      !entry.name.endsWith('.test.ts') &&
      !entry.name.endsWith('.test.tsx')
    ) {
      out.push(relative(ROOT, full).replace(/\\/g, '/'));
    }
  }
  return out;
};

const PEEK_FOOTER_SURFACES = [
  'src/explore/ui/peek/activity/ActivityPeekStandardFooter.tsx',
  'src/components/activity/detail/ActivityDetailEngagementActions.tsx',
  'src/components/activity/ActivityMapPeekWireFooter.tsx',
] as const;

describe('participationPresentationGuard (MIG-SURFACE-ACTIVITY-DETAIL)', () => {
  it('PART-PRES-01: L3 activity route resolves wire presentation once', () => {
    const page = read('src/pages/ActivityDetail.tsx');
    expect(page).toMatch(/resolveActivityDetailWirePresentation/);
    expect(page).not.toMatch(/resolveActivityDetailPresentation\(/);
  });

  it('PART-PRES-02: map peek + detail footers share resolveActivityMapPeekActions', () => {
    const violations: string[] = [];
    for (const file of PEEK_FOOTER_SURFACES) {
      const source = read(file);
      if (!source.includes('resolveActivityMapPeekActions')) {
        violations.push(`${file}: missing resolveActivityMapPeekActions`);
      }
      if (/computeActivityMapPeekActions\(/.test(source)) {
        violations.push(`${file}: inline computeActivityMapPeekActions (use activityPeekEngagement)`);
      }
    }
    expect(violations).toEqual([]);
  });

  it('PART-PRES-03: presentation modules delegate to resolveActivityEngagementPolicy', () => {
    expect(read('src/activity/activityDetailPresentation.ts')).toMatch(/resolveActivityEngagementPolicy/);
    expect(read('src/activity/resolveActivityDetailWirePresentation.ts')).toMatch(
      /resolveActivityEngagementPolicy/
    );
    expect(read('src/activity/activityPeekEngagement.ts')).toMatch(/resolveActivityEngagementPolicy/);
  });

  it('PART-PRES-04: peek↔detail parity tests stay in domain verify', () => {
    const verify = read('scripts/verify/domain-fe-vitest-files.mjs');
    expect(verify).toMatch(/mapDetailEngagementParity\.test\.ts/);
    expect(verify).toMatch(/listMapPeekEngagementParity\.test\.ts/);
    expect(verify).toMatch(/resolveActivityPresentation\.test\.ts/);
  });

  it('PART-PRES-05: join spine guard covers publishing queue client', () => {
    expect(read('src/config/participationJoinSpineGuard.test.ts')).toMatch(/PART-SPINE-01/);
    expect(read('src/hooks/publishingJoinQueueClientApi.ts')).toMatch(/getActivityJoinRequests/);
    expect(read('src/hooks/activityJoinClientApi.ts')).toMatch(/createJoinRequest|rsvpActivity/);
  });

  it('PART-PRES-06: L1 peek CTA brain stays in activityPeekEngagement only', () => {
    const violations: string[] = [];
    for (const file of collectProductTs(join(ROOT, 'src'))) {
      if (file === 'src/activity/activityPeekEngagement.ts') continue;
      const content = read(file);
      if (/from ['"]@uaetrail\/shared-types['"][\s\S]*computeActivityMapPeekActions/.test(content)) {
        violations.push(file);
      }
      if (/import\s*\{[^}]*computeActivityMapPeekActions/.test(content)) {
        violations.push(file);
      }
    }
    expect(violations).toEqual([]);
  });

  it('PART-PRES-07: list feed footer delegates to resolveActivityPeekEngagement', () => {
    const footer = read('src/list/browse/listFeedFooterActions.ts');
    expect(footer).toMatch(/resolveActivityPeekEngagement/);
    expect(footer).not.toMatch(/computeActivityMapPeekActions/);
  });

  it('PART-PRES-08: retired seeking detail is read-only archive (AD-SEEK-01)', () => {
    expect(read('src/pages/ActivityDetail.tsx')).toMatch(/activityDetailIsRetiredSeekingPost/);
    expect(read('src/activity/retiredSeekingActivityDetail.ts')).toMatch(/RETIRED_SEEKING_ACTIVITY_DETAIL_NOTICE/);
    expect(read('scripts/ops/consumer-detail-manual-qa-routes.mjs')).toMatch(/retired|Archived find post/i);
  });
});