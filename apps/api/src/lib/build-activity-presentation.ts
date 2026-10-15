import {
  resolveActivityEngagementPolicy,
  type ActivityPresentationDTO,
  type ActivityViewerAccessDTO,
} from '@uaetrail/shared-types';
import type { buildActivityDto } from './mappers.js';
import { buildDetailEngagementPolicyInput } from './activity-engagement-policy-input.js';

type ActivityEventSource = Parameters<typeof buildActivityDto>[0];

export const buildActivityPresentationForDetail = (input: {
  event: ActivityEventSource;
  viewerAccess: ActivityViewerAccessDTO;
  viewerUserId: string | null;
  myParticipation: unknown | null;
  myRequest: { status: string; canWithdraw: boolean } | null;
  previewMode?: boolean;
  isEmbedded?: boolean;
  pendingJoinInviteCount?: number;
  participantPreviewCount?: number;
}): ActivityPresentationDTO => {
  const policy = resolveActivityEngagementPolicy(
    buildDetailEngagementPolicyInput(input)
  );

  return {
    ...policy.presentation,
    strips: policy.strips,
  };
};
