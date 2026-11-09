import { activityDetailPath } from '../../../config/routingCatalog';
import { planHostedActivityManagePath } from '../../../plan/planRouting';
import type { ActivityDetailPlanSectionsComponent } from '../../../activity/detail/composers';
import { ActivityDetailPlanColumn } from './ActivityDetailPlanColumn';
import { ActivityDetailSidebarColumn } from './ActivityDetailSidebarColumn';
import { ActivityDetailPlaceTabPanels } from './tabs/ActivityDetailPlaceTabPanels';
import { ActivityDetailTransportTabPanels } from './tabs/ActivityDetailTransportTabPanels';
import type { useActivityDetailViewModel } from './useActivityDetailViewModel';

type Model = ReturnType<typeof useActivityDetailViewModel>;

type ActivityDetailBodyProps = Model & {
  planSections?: ActivityDetailPlanSectionsComponent | null;
};

/** Embed and preview grid. The public page uses `ActivityDetailSections`. */
export const ActivityDetailBody = ({ planSections = null, ...model }: ActivityDetailBodyProps) => {
  if (model.publicDetail) return null;

  const placeReturnTo = model.isEmbedded
    ? planHostedActivityManagePath(model.activity.id)
    : activityDetailPath(model.activity.id);

  return (
    <div
      className={`max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 ${
        model.isEmbedded ? 'px-0 py-2' : 'px-4 py-6'
      }`}
    >
      <div className="space-y-4 lg:col-span-2">
        <ActivityDetailPlanColumn model={model} planSections={planSections} />
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
            placeReturnTo={placeReturnTo}
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
      <ActivityDetailSidebarColumn model={model} />
    </div>
  );
};
