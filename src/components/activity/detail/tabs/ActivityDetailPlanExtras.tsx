import { CheckCircle2 } from 'lucide-react';
import type { ActivityDetailDTO, ReviewDTO } from '@uaetrail/shared-types';
import {
  extractJoinInstructionLines,
  MANDATORY_INSTRUCTIONS_LABEL,
} from '../../../../utils/joinInstructions';
import { extractActivityPlanDetailLines } from '../../../../activity/activityDetailReachBy';
import { ActivityPackingListPreview } from '../../ActivityPackingListPreview';
import { activityScheduleHasEnded } from '@uaetrail/shared-types';
import { ReviewSection } from '../../../ui/ReviewSection';

type ActivityDetailPlanExtrasProps = {
  panelClassName: string;
  activity: ActivityDetailDTO;
  canViewSensitivePlanContent: boolean;
  previewMode: boolean;
  activityReviews: ReviewDTO[];
  canWriteActivityReview: boolean;
  onActivityReviewSubmitted?: (review: import('@uaetrail/shared-types').ReviewDTO) => void;
  hidePhotoGallery?: boolean;
  hideActivityReviews?: boolean;
  hidePackingList?: boolean;
};

export const ActivityDetailPlanExtras = ({
  panelClassName,
  activity,
  canViewSensitivePlanContent,
  previewMode,
  activityReviews,
  canWriteActivityReview,
  onActivityReviewSubmitted,
  hidePhotoGallery = false,
  hideActivityReviews = false,
  hidePackingList = false,
}: ActivityDetailPlanExtrasProps) => {
  const mandatoryInstructions = extractJoinInstructionLines(activity.requirements);
  const planDetailLines = extractActivityPlanDetailLines(activity.requirements);
  const participantCheckedIn = Boolean(activity.myParticipation?.checkedInAt);
  const activityEnded = activityScheduleHasEnded(activity);
  const activityAwaitingCompletion = participantCheckedIn && !activityEnded;

  if (!canViewSensitivePlanContent) {
    return null;
  }

  return (
    <>
      {activity.itinerary && activity.itinerary.length > 0 ? (
        <div className={`bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 ${panelClassName}`}>
          <h2 className="text-lg font-bold text-gray-900 mb-3">Itinerary</h2>
          <ul className="space-y-2">
            {activity.itinerary.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-gray-700 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {hidePackingList ? null : (
        <ActivityPackingListPreview requirements={activity.requirements} className={`mb-4 ${panelClassName}`} />
      )}

      {mandatoryInstructions.length > 0 ? (
        <div className={`bg-white rounded-2xl border border-amber-100 p-5 sm:p-6 ${panelClassName}`}>
          <h2 className="text-lg font-bold text-gray-900 mb-1">{MANDATORY_INSTRUCTIONS_LABEL}</h2>
          <p className="text-xs text-gray-500 mb-3">Joiners must agree to these when requesting a spot.</p>
          <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
            {mandatoryInstructions.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {planDetailLines.length > 0 ? (
        <div className={`bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 ${panelClassName}`}>
          <h2 className="text-lg font-bold text-gray-900 mb-3">Activity details</h2>
          <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
            {planDetailLines.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {!hidePhotoGallery && activity.images && activity.images.length > 1 ? (
        <div className={`bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 ${panelClassName}`}>
          <h2 className="text-lg font-bold text-gray-900 mb-3">Photos</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {activity.images.map((img, i) => (
              <img key={i} src={img} alt="" className="rounded-xl aspect-video object-cover" />
            ))}
          </div>
        </div>
      ) : null}

      {!hideActivityReviews &&
      !previewMode &&
      activity.status === 'published' &&
      onActivityReviewSubmitted ? (
        <ReviewSection
          targetType="activity"
          targetId={activity.id}
          reviews={activityReviews}
          onReviewSubmitted={onActivityReviewSubmitted}
          canWriteReview={canWriteActivityReview}
          activityAwaitingCompletion={activityAwaitingCompletion}
          collapsible
          defaultExpanded
        />
      ) : null}
    </>
  );
};
