import {
  activityScheduleHasEnded,
  type ActivityDetailDTO,
  type ReviewDTO,
} from '@uaetrail/shared-types';
import {
  resolveActivityPublisherProfilePath,
  type PublishingProfileKind,
} from '@uaetrail/shared-types';
import { placeReviewPath } from '../utils/placePaths';

export type PostCheckInReviewPromptItem = {
  id: 'activity' | 'place' | 'host';
  label: string;
  done: boolean;
  href: string | null;
};

const placeReviewEligible = (activityType: ActivityDetailDTO['activityType']): boolean =>
  activityType === 'hiking' || activityType === 'camping' || activityType === 'event';

export const buildParticipantPostCheckInReviewPrompts = (input: {
  activity: ActivityDetailDTO;
  viewerUserId: string | null;
  activityReviews: ReviewDTO[];
  checkedIn: boolean;
}): PostCheckInReviewPromptItem[] => {
  if (!input.checkedIn || !input.viewerUserId) return [];
  if (!activityScheduleHasEnded(input.activity)) return [];

  const { activity, viewerUserId, activityReviews } = input;
  const hasActivityReview = activityReviews.some((row) => row.userId === viewerUserId);

  const prompts: PostCheckInReviewPromptItem[] = [
    {
      id: 'activity',
      label: 'Rate this outing',
      done: hasActivityReview,
      href: null,
    },
  ];

  if (placeReviewEligible(activity.activityType) && activity.locationId?.trim()) {
    prompts.push({
      id: 'place',
      label: 'Rate the trail or venue',
      done: false,
      href: placeReviewPath(activity.activityType, activity.locationId),
    });
  }

  const kind: PublishingProfileKind = activity.publishingProfileKind ?? 'community';
  const hostPath = resolveActivityPublisherProfilePath({
    publishingProfileKind: kind,
    tenantSlug: activity.tenantSlug,
    hostUserId: activity.hostUserId,
  });
  if (hostPath) {
    prompts.push({
      id: 'host',
      label: 'Rate the host',
      done: false,
      href: `${hostPath}#reviews`,
    });
  }

  return prompts;
};

export const participantPostCheckInReviewsPending = (
  prompts: PostCheckInReviewPromptItem[]
): boolean => {
  if (prompts.length === 0) return false;
  const activityPrompt = prompts.find((item) => item.id === 'activity');
  if (activityPrompt && !activityPrompt.done) return true;
  return prompts.some((item) => item.id !== 'activity');
};
