import { describe, expect, it } from 'vitest';
import { buildActivityFromCreateInput } from '../src/lib/entity-builders.js';
import { createActivityDetailed, updateActivityDetailed } from '../src/lib/activities-store.js';

describe('activityMode seeking retired (MIG-DISCO-REG)', () => {
  it('rejects create builder input', () => {
    expect(() =>
      buildActivityFromCreateInput(
        {
          activityMode: 'seeking',
          tenant: { connect: { id: 't1' } },
          title: 'Legacy',
          activityType: 'HIKING',
          startAt: new Date(),
          status: 'published',
        } as never,
        'act-seek-1'
      )
    ).toThrow(/activity_mode_seeking_retired/);
  });

  it('rejects createActivityDetailed', async () => {
    await expect(
      createActivityDetailed({
        activityMode: 'seeking',
        tenant: { connect: { id: 't1' } },
        title: 'Legacy',
        activityType: 'HIKING',
        startAt: new Date(),
        status: 'published',
      } as never)
    ).rejects.toThrow(/activity_mode_seeking_retired/);
  });

  it('rejects updateActivityDetailed patch', async () => {
    await expect(
      updateActivityDetailed('act-1', { activityMode: 'seeking' } as never)
    ).rejects.toThrow(/activity_mode_seeking_retired/);
  });
});