import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { ActivityDTO } from '@uaetrail/shared-types';
import {
  buildHostPublishAvailabilityNotice,
  hostPublishAvailabilityNoticeMessage,
} from './hostPublishAvailabilityNotice';

vi.mock('../hooks/memberPeopleClientApi', () => ({
  fetchExplorePeopleAvailability: vi.fn(),
}));

import { fetchExplorePeopleAvailability } from '../hooks/memberPeopleClientApi';

const hostedActivity = (overrides: Partial<ActivityDTO> = {}): ActivityDTO =>
  ({
    id: 'act-1',
    status: 'published',
    activityMode: 'hosted',
    activityType: 'hiking',
    date: '2026-11-01',
    joinMode: 'open',
    ...overrides,
  }) as ActivityDTO;

describe('hostPublishAvailabilityNotice', () => {
  beforeEach(() => {
    vi.mocked(fetchExplorePeopleAvailability).mockReset();
  });

  it('skips seeking outings and participant-intent rows', async () => {
    expect(
      await buildHostPublishAvailabilityNotice(
        hostedActivity({ activityMode: 'seeking' as ActivityDTO['activityMode'] }),
        'host-1'
      )
    ).toBeNull();
    expect(fetchExplorePeopleAvailability).not.toHaveBeenCalled();
  });

  it('returns null when no other members are available that day', async () => {
    vi.mocked(fetchExplorePeopleAvailability).mockResolvedValue({
      people: [{ userId: 'host-1', displayName: 'Host' }],
    } as Awaited<ReturnType<typeof fetchExplorePeopleAvailability>>);

    const notice = await buildHostPublishAvailabilityNotice(hostedActivity(), 'host-1');
    expect(notice).toBeNull();
  });

  it('counts available members excluding the host', async () => {
    vi.mocked(fetchExplorePeopleAvailability).mockResolvedValue({
      people: [
        { userId: 'host-1', displayName: 'Host' },
        { userId: 'm-2', displayName: 'A' },
        { userId: 'm-3', displayName: 'B' },
      ],
    } as Awaited<ReturnType<typeof fetchExplorePeopleAvailability>>);

    const notice = await buildHostPublishAvailabilityNotice(hostedActivity(), 'host-1');
    expect(notice).toMatch(/2 members marked available/);
    expect(notice).toMatch(/Find crew/);
  });

  it('hostPublishAvailabilityNoticeMessage requires host user id', async () => {
    expect(await hostPublishAvailabilityNoticeMessage(hostedActivity(), null)).toBeNull();
  });
});
