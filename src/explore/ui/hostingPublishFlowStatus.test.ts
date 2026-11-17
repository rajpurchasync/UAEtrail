import type { ActivityDTO } from '@uaetrail/shared-types';
import { describe, expect, it } from 'vitest';
import {
  HOSTING_PUBLISH_FLOW_IDLE,
  hostingPublishFlowBlocksSessionPersist,
  hostingPublishFlowIsPublishing,
  hostingPublishFlowPublishedActivity,
  type HostingPublishFlowStatus,
} from './hostingPublishFlowStatus';

const activity = { id: 'a1' } as ActivityDTO;

describe('hostingPublishFlowStatus', () => {
  it('idle is not publishing and has no published activity', () => {
    expect(hostingPublishFlowIsPublishing(HOSTING_PUBLISH_FLOW_IDLE)).toBe(false);
    expect(hostingPublishFlowPublishedActivity(HOSTING_PUBLISH_FLOW_IDLE)).toBeNull();
    expect(hostingPublishFlowBlocksSessionPersist(HOSTING_PUBLISH_FLOW_IDLE)).toBe(false);
  });

  it('submitting and submitted are mutually exclusive', () => {
    const submitting: HostingPublishFlowStatus = { kind: 'submitting' };
    const submitted: HostingPublishFlowStatus = { kind: 'submitted', result: activity };

    expect(hostingPublishFlowIsPublishing(submitting)).toBe(true);
    expect(hostingPublishFlowPublishedActivity(submitting)).toBeNull();

    expect(hostingPublishFlowIsPublishing(submitted)).toBe(false);
    expect(hostingPublishFlowPublishedActivity(submitted)).toBe(activity);
    expect(hostingPublishFlowBlocksSessionPersist(submitted)).toBe(true);
  });
});