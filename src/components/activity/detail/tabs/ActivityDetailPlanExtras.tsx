import { CheckCircle2 } from 'lucide-react';
import type {
  ActivityDetailDTO,
  ActivityGearItemDTO,
  ActivityItineraryStepDTO,
  ReviewDTO,
} from '@uaetrail/shared-types';
import {
  extractJoinInstructionLines,
  MANDATORY_INSTRUCTIONS_LABEL,
} from '../../../../utils/joinInstructions';
import { extractActivityPlanDetailLines } from '../../../../activity/activityDetailReachBy';
import { ActivityPackingListPreview } from '../../ActivityPackingListPreview';
import { activityScheduleHasEnded, filterMigratedPlaceholderGear } from '@uaetrail/shared-types';
import { ReviewSection } from '../../../ui/ReviewSection';
import {
  ActivityDetailCostPolicySection,
  activityShowsCostPolicySection,
} from '../ActivityDetailCostPolicySection';
import { ConsumerPlanSection } from '../../../../detail/shell/ConsumerPlanSection';

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
  /** Consumer scroll template renders cost in `ActivityDetailPlanColumn` so guests can see it. */
  hideCostPolicy?: boolean;
  isHostViewer?: boolean;
  consumerSection?: boolean;
  /** Consumer template merges gear into the scroll `packing` section. */
  hideGearList?: boolean;
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
  hideCostPolicy = false,
  isHostViewer = false,
  consumerSection = false,
  hideGearList = false,
}: ActivityDetailPlanExtrasProps) => {
  const mandatoryInstructions = extractJoinInstructionLines(activity.requirements);
  const planDetailLines = extractActivityPlanDetailLines(activity.requirements);
  const itinerarySteps: ActivityItineraryStepDTO[] | null =
    activity.itinerarySteps && activity.itinerarySteps.length > 0
      ? activity.itinerarySteps
      : activity.itinerary && activity.itinerary.length > 0
        ? activity.itinerary.map((title, i) => ({
            key: `legacy-${i}`,
            step: 'start' as const,
            title,
          }))
        : null;
  const gearItems: ActivityGearItemDTO[] | null = (() => {
    const filtered = filterMigratedPlaceholderGear(activity.gear, activity.requirements);
    return filtered.length > 0 ? filtered : null;
  })();
  const participantCheckedIn = Boolean(activity.myParticipation?.checkedInAt);
  const activityEnded = activityScheduleHasEnded(activity);
  const activityAwaitingCompletion = participantCheckedIn && !activityEnded;
  const showCostPolicy = !hideCostPolicy && activityShowsCostPolicySection(activity);

  if (!canViewSensitivePlanContent && !showCostPolicy) {
    return null;
  }

  const twoUp = hidePackingList && !consumerSection;

  return (
    <>
      {showCostPolicy ? (
        <ActivityDetailCostPolicySection
          activity={activity}
          panelClassName={panelClassName}
          consumerSection={consumerSection}
        />
      ) : null}

      {!canViewSensitivePlanContent ? null : (
        <div className={twoUp ? 'space-y-6 lg:grid lg:grid-cols-2 lg:items-start lg:gap-3 lg:space-y-0' : 'contents'}>
      {itinerarySteps && itinerarySteps.length > 0 ? (
        consumerSection ? (
          <ConsumerPlanSection
            id="activity-detail-itinerary"
            title="Itinerary"
            tone="slate"
            panelClassName={panelClassName}
          >
            <ul className="space-y-2">
              {itinerarySteps.map((item, i) => (
                <li key={item.key || i} className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  <span>
                    {item.at ? <span className="mr-1 font-medium text-gray-900">{item.at}</span> : null}
                    {item.title}
                    {item.note ? <span className="mt-0.5 block text-xs text-gray-500">{item.note}</span> : null}
                  </span>
                </li>
              ))}
            </ul>
          </ConsumerPlanSection>
        ) : (
          <div
            id="activity-detail-itinerary"
            className={`scroll-mt-24 rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 dark:border-neutral-800 dark:bg-neutral-900 lg:scroll-mt-8 lg:rounded-xl lg:p-3 ${panelClassName}`}
          >
            <h2 className="mb-3 text-lg font-bold text-gray-900 lg:mb-2 lg:text-[13px] lg:font-semibold lg:uppercase lg:tracking-wide lg:text-neutral-500">
              Itinerary
            </h2>
            <ul className="space-y-2">
              {itinerarySteps.map((item, i) => (
                <li key={item.key || i} className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  <span>
                    {item.at ? <span className="mr-1 font-medium text-gray-900">{item.at}</span> : null}
                    {item.title}
                    {item.note ? <span className="mt-0.5 block text-xs text-gray-500">{item.note}</span> : null}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )
      ) : null}

      {!hideGearList && gearItems && gearItems.length > 0 ? (
        consumerSection ? (
          <ConsumerPlanSection
            id="activity-detail-gear"
            title="Gear list"
            tone="amber"
            panelClassName={panelClassName}
          >
            <GearList items={gearItems} />
          </ConsumerPlanSection>
        ) : (
          <div
            id="activity-detail-gear"
            className={`scroll-mt-24 rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 dark:border-neutral-800 dark:bg-neutral-900 lg:scroll-mt-8 lg:rounded-xl lg:p-3 ${panelClassName}`}
          >
            <h2 className="mb-3 text-lg font-bold text-gray-900 lg:mb-2 lg:text-[13px] lg:font-semibold lg:uppercase lg:tracking-wide lg:text-neutral-500">
              Gear list
            </h2>
            <GearList items={gearItems} />
          </div>
        )
      ) : null}

      {hidePackingList ? null : (
        <ActivityPackingListPreview
          requirements={activity.requirements}
          className={`mb-4 ${panelClassName}`}
          hideJoinerAcknowledgement={isHostViewer}
        />
      )}

      {mandatoryInstructions.length > 0 ? (
        consumerSection ? (
          <ConsumerPlanSection
            id="activity-detail-mandatory"
            title={MANDATORY_INSTRUCTIONS_LABEL}
            tone="amber"
            panelClassName={panelClassName}
          >
            <p className="mb-2 text-xs text-neutral-600 dark:text-neutral-400">
              Joiners must agree to these when requesting a spot.
            </p>
            <ul className="list-disc space-y-1 pl-4 text-sm text-gray-700">
              {mandatoryInstructions.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </ConsumerPlanSection>
        ) : (
          <div
            id="activity-detail-mandatory"
            className={`rounded-2xl border border-amber-100 bg-white p-5 sm:p-6 lg:rounded-xl lg:p-3 ${panelClassName}`}
          >
            <h2 className="mb-1 text-lg font-bold text-gray-900 lg:text-[13px] lg:font-semibold lg:uppercase lg:tracking-wide lg:text-neutral-500">
              {MANDATORY_INSTRUCTIONS_LABEL}
            </h2>
            <p className="mb-3 text-xs text-gray-500">Joiners must agree to these when requesting a spot.</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              {mandatoryInstructions.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        )
      ) : null}

      {planDetailLines.length > 0 ? (
        consumerSection ? (
          <ConsumerPlanSection
            id="activity-detail-activity-details"
            title="Activity details"
            tone="slate"
            panelClassName={panelClassName}
          >
            <ul className="list-disc space-y-1 pl-4 text-sm text-gray-700">
              {planDetailLines.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </ConsumerPlanSection>
        ) : (
          <div
            className={`rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 dark:border-neutral-800 dark:bg-neutral-900 lg:rounded-xl lg:p-3 ${panelClassName}`}
          >
            <h2 className="mb-3 text-lg font-bold text-gray-900 lg:mb-2 lg:text-[13px] lg:font-semibold lg:uppercase lg:tracking-wide lg:text-neutral-500">
              Activity details
            </h2>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              {planDetailLines.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        )
      ) : null}

      {!hidePhotoGallery && activity.images && activity.images.length > 1 ? (
        <div
          id="activity-detail-photos"
          className={`scroll-mt-24 bg-white rounded-2xl border border-gray-100 dark:border-neutral-800 dark:bg-neutral-900 p-5 sm:p-6 lg:scroll-mt-8 lg:rounded-xl lg:p-3 ${panelClassName}`}
        >
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
        </div>
      )}
    </>
  );
};

const GearList = ({ items }: { items: ActivityGearItemDTO[] }) => (
  <ul className="space-y-2">
    {items.map((row) => (
      <li key={row.key} className="flex items-start gap-2 text-sm text-gray-700">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
        <span>
          <span className="mr-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
            {row.level === 'mandatory' ? 'Must have' : row.level}
          </span>
          {row.label}
          {row.spec ? <span className="mt-0.5 block text-xs text-gray-500">{row.spec}</span> : null}
        </span>
      </li>
    ))}
  </ul>
);
