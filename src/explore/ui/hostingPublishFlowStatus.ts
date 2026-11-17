import type { ActivityDTO } from '@uaetrail/shared-types';
import {
  COMPOSE_SUBMIT_FLOW_IDLE,
  composeSubmitFlowBlocksSessionPersist,
  composeSubmitFlowIsSubmitting,
  composeSubmitFlowResult,
  type ComposeSubmitFlowStatus,
} from './composeSubmitFlowStatus';

/** Create/edit hosting wizard — publish outcome only (wizard draft is separate state). */
export type HostingPublishFlowStatus = ComposeSubmitFlowStatus<ActivityDTO>;

export const HOSTING_PUBLISH_FLOW_IDLE: HostingPublishFlowStatus = COMPOSE_SUBMIT_FLOW_IDLE;

export const hostingPublishFlowIsPublishing = composeSubmitFlowIsSubmitting;

export const hostingPublishFlowPublishedActivity = composeSubmitFlowResult;

export const hostingPublishFlowBlocksSessionPersist = composeSubmitFlowBlocksSessionPersist;