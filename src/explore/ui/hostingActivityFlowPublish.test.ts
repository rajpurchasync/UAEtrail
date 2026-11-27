import { describe, expect, it, vi, beforeEach } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { defaultHikingPackingItems, type ActivityDTO } from '@uaetrail/shared-types';
import { emptyCreateActivityDraft } from './hostingFlowEngine';
import { HOSTING_PROFILE_INCOMPLETE_ERROR } from '../createFlowCopy';

const publishHostingActivity = vi.fn();
const updateHostingActivity = vi.fn();
const afterHostingActivityPublishClientRefresh = vi.fn();
const clearHostingWizardSession = vi.fn();

vi.mock('../../services/hostingActivityPublish', () => ({
  publishHostingActivity: (...args: unknown[]) => publishHostingActivity(...args),
  updateHostingActivity: (...args: unknown[]) => updateHostingActivity(...args),
}));

vi.mock('../../hooks/hostingPublishClientEffects', () => ({
  afterHostingActivityPublishClientRefresh: (...args: unknown[]) =>
    afterHostingActivityPublishClientRefresh(...args),
}));

vi.mock('./composeWizardSession', () => ({
  readHostingWizardSession: vi.fn(),
  clearHostingWizardSession: (...args: unknown[]) => clearHostingWizardSession(...args),
}));

import { runHostingActivityFlowPublish } from './hostingActivityFlowPublish';

const publishableDraft = () => ({
  ...emptyCreateActivityDraft(),
  kind: 'hiking' as const,
  title: 'New wadi sunrise',
  latitude: 24.8,
  longitude: 56.1,
  meetingLatitude: 24.81,
  meetingLongitude: 56.11,
  placeLabelSource: 'custom' as const,
  trailName: 'Hidden wadi loop',
  customPlaceDestinationId: 'area-hatta',
  trailLatitude: 24.82,
  trailLongitude: 56.12,
  aboutTrail: 'Quiet sunrise loop with shade and a short scramble near the dam.',
  packingItems: defaultHikingPackingItems(),
  joinKit: 'Water 2 L minimum.',
});

const baseInput = () => ({
  userId: 'user-1',
  tenantId: 'tenant-1',
  draft: publishableDraft(),
  selectedKind: 'hiking' as const,
  catalogPlaces: [],
  editActivity: null as ActivityDTO | null,
  wizardPrefill: null as null,
  hostingFlowId: null as string | null,
  wizardSessionScope: undefined as string | undefined,
  queryClient: new QueryClient(),
});

describe('runHostingActivityFlowPublish (R6 contract)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    publishHostingActivity.mockResolvedValue({ id: 'act-new', title: 'New wadi sunrise' } as ActivityDTO);
    updateHostingActivity.mockResolvedValue({ id: 'act-edit', title: 'Edit title' } as ActivityDTO);
    afterHostingActivityPublishClientRefresh.mockResolvedValue(undefined);
  });

  it('returns validation_error when tenantId is missing', async () => {
    const result = await runHostingActivityFlowPublish({
      ...baseInput(),
      tenantId: null,
    });
    expect(result).toEqual({
      outcome: 'validation_error',
      message: HOSTING_PROFILE_INCOMPLETE_ERROR,
    });
    expect(publishHostingActivity).not.toHaveBeenCalled();
  });

  it('returns validation_error when publish step validation fails', async () => {
    const incomplete = { ...publishableDraft(), title: 'Hi' };
    const result = await runHostingActivityFlowPublish({
      ...baseInput(),
      draft: incomplete,
    });
    expect(result).toEqual({
      outcome: 'validation_error',
      message: 'Title must be at least 4 characters.',
    });
  });

  it('creates a new activity and refreshes client caches', async () => {
    const input = baseInput();
    const result = await runHostingActivityFlowPublish({
      ...input,
      hostingFlowId: 'activity.hiking',
      wizardSessionScope: 'scope-a',
    });

    expect(result).toEqual({
      outcome: 'created',
      activity: expect.objectContaining({ id: 'act-new' }),
    });
    expect(publishHostingActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        userId: 'user-1',
        draft: expect.objectContaining({ rideshareEnabled: false, kind: 'hiking' }),
      })
    );
    expect(afterHostingActivityPublishClientRefresh).toHaveBeenCalledWith(input.queryClient, {
      activityId: 'act-new',
      userId: 'user-1',
    });
    expect(clearHostingWizardSession).toHaveBeenCalledWith('activity.hiking', 'scope-a');
  });

  it('updates an existing activity when editActivity is set', async () => {
    const editActivity = { id: 'act-existing', title: 'Before' } as ActivityDTO;
    const input = baseInput();
    const result = await runHostingActivityFlowPublish({
      ...input,
      editActivity,
    });

    expect(result).toEqual({
      outcome: 'updated',
      activity: expect.objectContaining({ id: 'act-edit' }),
    });
    expect(updateHostingActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        activityId: 'act-existing',
        tenantId: 'tenant-1',
        userId: 'user-1',
      })
    );
    expect(publishHostingActivity).not.toHaveBeenCalled();
    expect(afterHostingActivityPublishClientRefresh).toHaveBeenCalledWith(input.queryClient, {
      activityId: 'act-edit',
      userId: 'user-1',
    });
  });

  it('maps publish service failures to publish_error', async () => {
    publishHostingActivity.mockRejectedValue(new Error('Network down'));
    const result = await runHostingActivityFlowPublish(baseInput());
    expect(result).toEqual({ outcome: 'publish_error', message: 'Network down' });
  });
});