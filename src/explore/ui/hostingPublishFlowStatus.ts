import type { ActivityDTO } from '@uaetrail/shared-types';

/** Create/edit hosting wizard — publish outcome only (wizard draft is separate state). */
export type HostingPublishFlowStatus =
  | { kind: 'idle' }
  | { kind: 'publishing' }
  | { kind: 'published'; activity: ActivityDTO };

export const HOSTING_PUBLISH_FLOW_IDLE: HostingPublishFlowStatus = { kind: 'idle' };

export const hostingPublishFlowIsPublishing = (status: HostingPublishFlowStatus): boolean =>
  status.kind === 'publishing';

export const hostingPublishFlowPublishedActivity = (
  status: HostingPublishFlowStatus
): ActivityDTO | null => (status.kind === 'published' ? status.activity : null);

export const hostingPublishFlowBlocksSessionPersist = (status: HostingPublishFlowStatus): boolean =>
  status.kind === 'published';