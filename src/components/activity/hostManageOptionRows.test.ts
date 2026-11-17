import { describe, expect, it, vi } from 'vitest';
import type { ActivityDTO } from '@uaetrail/shared-types';
import { buildHostManageOptionRows } from './hostManageOptionRows';

const base = (status: ActivityDTO['status']): ActivityDTO =>
  ({
    id: 'a1',
    title: 'Hike',
    activityType: 'hiking',
    status,
    date: '2026-12-01',
    participationMode: 'approval',
  }) as ActivityDTO;

const caps = {
  showJoinRequests: true,
  showLinkRideshare: false,
  showGroupChat: true,
  kindLabel: 'Hike',
};

const handlers = {
  onSelectSubview: vi.fn(),
  onEdit: vi.fn(),
  onDuplicate: vi.fn(),
  onDelete: vi.fn(),
  onSuspend: vi.fn(),
  onResume: vi.fn(),
};

const visibleIds = (status: ActivityDTO['status']) =>
  buildHostManageOptionRows({ activity: base(status), caps, ...handlers })
    .filter((row) => !row.hidden)
    .map((row) => row.id);

describe('buildHostManageOptionRows', () => {
  it('hides edit on suspended (API rejects it) and shows resume', () => {
    expect(visibleIds('suspended')).toContain('resume');
    expect(visibleIds('suspended')).not.toContain('edit');
    expect(visibleIds('suspended')).not.toContain('suspend');
  });

  it('shows suspend and edit on published, not resume', () => {
    expect(visibleIds('published')).toContain('edit');
    expect(visibleIds('published')).toContain('suspend');
    expect(visibleIds('published')).not.toContain('resume');
  });

  it('shows edit on draft and hides suspend/resume', () => {
    expect(visibleIds('draft')).toContain('edit');
    expect(visibleIds('draft')).not.toContain('suspend');
    expect(visibleIds('draft')).not.toContain('resume');
  });
});
