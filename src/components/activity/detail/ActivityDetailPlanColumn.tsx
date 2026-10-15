import { Link } from 'react-router-dom';
import { ACTIVITY_DETAIL_JOIN_REQUIRED_PLAN_HINT } from '../../../content/activityDetailCopy';
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

type ActivityDetailPlanColumnProps = {
  model: Model;
  planSections?: ActivityDetailPlanSectionsComponent | null;
};

/** Plan / place / transport main column (S13-W7) — kind slots injected via `planSections`. */
export const ActivityDetailPlanColumn = ({
  model,
  planSections = null,
}: ActivityDetailPlanColumnProps) => {
  const KindPlanSections = planSections;

  if (model.consumerDetailLayout) {
    return null;
  }

  return (
    <div className="lg:col-span-2 space-y-4">
      {model.showInviteShare && model.canSendJoinInvites && !model.consumerDetailLayout ? (
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

      {model.requiresSignIn && !model.consumerDetailLayout ? (
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

      <ActivityDetailPlanAboutCard
        panelClassName={model.mobilePlanPanel}
        activity={model.activity}
        showMobileTabs={model.showMobileTabs}
        showPlanTransportTeaser={model.showPlanTransportTeaser}
        onMobileTabChange={model.onMobileTabChange}
        hideAboutBody={model.requiresSignIn}
      />

      {!model.requiresSignIn && KindPlanSections ? <KindPlanSections model={model} /> : null}

      {!model.requiresSignIn ? (
        <ActivityDetailPlanExtras
          panelClassName={model.mobilePlanPanel}
          activity={model.activity}
          canViewSensitivePlanContent={model.canViewSensitivePlanContent}
          previewMode={model.previewMode}
          activityReviews={model.activityReviews}
          canWriteActivityReview={model.canWriteActivityReview}
          onActivityReviewSubmitted={model.onActivityReviewSubmitted}
        />
      ) : null}

      {model.showPlaceTab ? (
        <ActivityDetailPlaceTabPanels
          panelClassName={model.mobilePlacePanel}
          activity={model.activity}
          previewMode={model.previewMode}
          showMobileTabs={model.showMobileTabs}
          showPlaceCrewBody={model.showPlaceCrewBody}
          showPlaceLockedOnMobile={model.showPlaceLockedOnMobile}
          registryPlacePath={model.registryPlacePath}
          registryPlaceName={model.registryPlaceName}
          hasAccessCoordinates={model.hasAccessCoordinates}
          accessLat={model.accessLat}
          accessLng={model.accessLng}
          openInGoogleMapsUrl={model.openInGoogleMapsUrl}
          onMobileTabChange={model.onMobileTabChange}
        />
      ) : null}

      {model.showTransportTab ? (
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
