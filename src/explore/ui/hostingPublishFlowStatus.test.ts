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

  it('publishing and published are mutually exclusive', () => {
    const publishing: HostingPublishFlowStatus = { kind: 'publishing' };
    const published: HostingPublishFlowStatus = { kind: 'published', activity };

    expect(hostingPublishFlowIsPublishing(publishing)).toBe(true);
    expect(hostingPublishFlowPublishedActivity(publishing)).toBeNull();

    expect(hostingPublishFlowIsPublishing(published)).toBe(false);
    expect(hostingPublishFlowPublishedActivity(published)).toBe(activity);
    expect(hostingPublishFlowBlocksSessionPersist(published)).toBe(true);
  });
});