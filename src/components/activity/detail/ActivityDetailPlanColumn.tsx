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
import { ActivityDetailPlaceTabPanels } from './tabs/ActivityDetailPlaceTabPanels';
import { ActivityDetailTransportTabPanels } from './tabs/ActivityDetailTransportTabPanels';
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
  /** Inside `ActivityDetailSections` — skip tab panels already on the public page. */
  consumerInline?: boolean;
};

/** Plan / place / transport main column (S13-W7) — kind slots injected via `planSections`. */
export const ActivityDetailPlanColumn = ({
  model,
  planSections = null,
  consumerInline = false,
}: ActivityDetailPlanColumnProps) => {
  const KindPlanSections = planSections;
  const consumerRideshare = consumerInline && model.activity.activityType === 'rideshare';

  if (model.publicDetail && !consumerInline) {
    return null;
  }

  return (
    <div className={consumerInline ? 'space-y-6 lg:space-y-3' : 'lg:col-span-2 space-y-4'}>
      {model.showInviteShare && model.canSendJoinInvites && !consumerInline ? (
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

      {model.requiresSignIn && !consumerInline ? (
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

      {!consumerRideshare ? (
        <ActivityDetailPlanAboutCard
          panelClassName={model.mobilePlanPanel}
          activity={model.activity}
          showMobileTabs={model.showMobileTabs}
          hideScheduleFactsGrid={consumerInline}
          hideAboutBody={false}
        />
      ) : null}

      {!consumerInline && model.registryPlaceName ? (
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

      {!model.requiresSignIn && KindPlanSections && !consumerRideshare ? (
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
          hideActivityReviews={consumerRideshare}
          hidePackingList={consumerInline}
        />
      ) : null}

      {model.showPlaceTab && !consumerInline ? (
        <ActivityDetailPlaceTabPanels
          panelClassName={model.mobilePlacePanel}
          activity={model.activity}
          previewMode={model.previewMode}
          showMobileTabs={model.showMobileTabs}
          showPlaceCrewBody={model.showPlaceCrewBody}
          showPlaceLockedOnMobile={model.showPlaceLockedOnMobile}
          registryPlacePath={model.registryPlacePath}
          registryPlaceName={model.registryPlaceName}
          placeReturnTo={
            model.isEmbedded
              ? planHostedActivityManagePath(model.activity.id)
              : activityDetailPath(model.activity.id)
          }
          hasAccessCoordinates={model.hasAccessCoordinates}
          accessLat={model.accessLat}
          accessLng={model.accessLng}
          openInGoogleMapsUrl={model.openInGoogleMapsUrl}
          onMobileTabChange={model.onMobileTabChange}
        />
      ) : null}

      {model.showTransportTab && !consumerInline ? (
        <ActivityDetailTransportTabPanels
          panelClassName={model.mobileTransportPanel}
          activity={model.activity}
          transportReachLines={model.transportReachLines}
          showTransportEncouragementMobile={
            model.requiresSignIn ? false : model.showTransportEncouragementMobile
          }
          showTransportHostProUpsell={model.requiresSignIn ? false : model.showTransportHostProUpsell}
          showTransportParticipantProUpsell={
            model.requiresSignIn ? false : model.showTransportParticipantProUpsell
          }
          publicReachOnly={model.requiresSignIn}
        />
      ) : null}
    </div>
  );
};
