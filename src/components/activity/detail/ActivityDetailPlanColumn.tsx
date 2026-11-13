import { activityDetailPath } from '../../../config/routingCatalog';
import { ACTIVITY_DETAIL_JOIN_REQUIRED_PLAN_HINT } from '../../../content/activityDetailCopy';
import { planHostedActivityManagePath } from '../../../plan/planRouting';
import { ActivityDetailLinkedPlaceLink } from './ActivityDetailLinkedPlaceLink';
import { ActivityDetailGuestGate } from './ActivityDetailGuestGate';
import { ActivityInviteLauncher } from '../ActivityInviteLauncher';
import { ActivityPostCheckInReviewPrompts } from '../ActivityPostCheckInReviewPrompts';
import type { ActivityDetailPlanSectionsComponent } from '../../../activity/detail/composers';
import { ActivityDetailPlanAboutCard } from './tabs/ActivityDetailPlanAboutCard';
import { ActivityDetailPlanExtras } from './tabs/ActivityDetailPlanExtras';
import type { useActivityDetailViewModel } from './useActivityDetailViewModel';

type Model = ReturnType<typeof useActivityDetailViewModel>;

const linkedPlaceEyebrow = (kind: string | null | undefined): string => {
  if (kind === 'hiking') return 'Trail';
  if (kind === 'camping') return 'Camp spot';
  return 'Place';
};

type ActivityDetailPlanColumnProps = {
  model: Model;
  planSections?: ActivityDetailPlanSectionsComponent | null;
  /**
   * Public page already renders venue, packing, and getting there.
   * Embed and preview render those beside this column.
   */
  factsOnly?: boolean;
};

/** Shared plan facts. The public page passes `factsOnly` because it already renders venue, packing, and getting there. */
export const ActivityDetailPlanColumn = ({
  model,
  planSections = null,
  factsOnly = false,
}: ActivityDetailPlanColumnProps) => {
  const KindPlanSections = planSections;
  const rideshareFacts = factsOnly && model.activity.activityType === 'rideshare';

  return (
    <div className={factsOnly ? 'space-y-6 lg:space-y-3' : 'space-y-4'}>
      {model.showInviteShare && model.canSendJoinInvites && !factsOnly ? (
        <ActivityInviteLauncher
          activity={{
            id: model.activity.id,
            title: model.activity.title || model.activity.locationName,
            activityType: model.activity.activityType,
            date: model.activity.date,
            locationName: model.activity.locationName,
          }}
          canSendBuddyInvites
        />
      ) : null}

      {model.showParticipantReviewPrompts ? (
        <ActivityPostCheckInReviewPrompts
          items={model.participantReviewPrompts}
          panelClassName={model.mobilePlanPanel}
          onMobileTabChange={model.onMobileTabChange}
        />
      ) : null}

      {model.planRequestManagePanel}

      {model.requiresSignIn && !factsOnly ? (
        <div className={model.mobilePlanPanel}>
          <ActivityDetailGuestGate activity={model.activity} compact />
        </div>
      ) : null}

      {model.showJoinRequiredHint ? (
        <p
          className={`text-sm font-medium text-neutral-700 leading-relaxed ${model.mobilePlanPanel}`}
          role="status"
        >
          {ACTIVITY_DETAIL_JOIN_REQUIRED_PLAN_HINT}
        </p>
      ) : null}

      {!rideshareFacts ? (
        <ActivityDetailPlanAboutCard
          panelClassName={model.mobilePlanPanel}
          activity={model.activity}
          showMobileTabs={model.showMobileTabs}
          hideScheduleFactsGrid={factsOnly}
          hideAboutBody={false}
        />
      ) : null}

      {!factsOnly && model.registryPlaceName ? (
        <div className={model.mobilePlanPanel}>
          <ActivityDetailLinkedPlaceLink
            name={model.registryPlaceName}
            to={model.registryPlacePath}
            returnTo={
              model.isEmbedded
                ? planHostedActivityManagePath(model.activity.id)
                : activityDetailPath(model.activity.id)
            }
            eyebrow={linkedPlaceEyebrow(
              model.activity.location?.activityType ?? model.activity.activityType
            )}
          />
        </div>
      ) : null}

      {!model.requiresSignIn && KindPlanSections && !rideshareFacts ? (
        <KindPlanSections model={model} />
      ) : null}

      {!model.requiresSignIn ? (
        <ActivityDetailPlanExtras
          panelClassName={model.mobilePlanPanel}
          activity={model.activity}
          canViewSensitivePlanContent={model.canViewSensitivePlanContent}
          previewMode={model.previewMode}
          activityReviews={model.activityReviews}
          canWriteActivityReview={model.canWriteActivityReview}
          onActivityReviewSubmitted={model.onActivityReviewSubmitted}
          hideActivityReviews={rideshareFacts}
          hidePackingList={factsOnly}
        />
      ) : null}
    </div>
  );
};
