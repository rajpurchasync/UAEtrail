import { Link } from 'react-router-dom';
import { ActivityDetailTabBar } from './ActivityDetailTabBar';
import { ActivityDetailMobileHero } from './ActivityDetailMobileHero';
import type { ActivityDetailPlanSectionsComponent } from '../../../activity/detail/composers';
import { ActivityDetailPlanColumn } from './ActivityDetailPlanColumn';
import { ActivityDetailSidebarColumn } from './ActivityDetailSidebarColumn';
import type { useActivityDetailViewModel } from './useActivityDetailViewModel';

type Model = ReturnType<typeof useActivityDetailViewModel>;

type ActivityDetailBodyProps = Model & {
  planSections?: ActivityDetailPlanSectionsComponent | null;
};

/** Tab chrome + grid shell; columns own plan vs sidebar (R6 / S13-W7). */
export const ActivityDetailBody = ({ planSections = null, ...model }: ActivityDetailBodyProps) => (
  <>
    {model.showMobileTabs && model.onMobileTabChange ? (
      <ActivityDetailTabBar
        active={model.mobileTab}
        onChange={model.onMobileTabChange}
        visibleTabs={model.visibleMobileTabs}
      />
    ) : null}
    {model.showMobileTabs && !model.isEmbedded && !model.publicDetail ? (
      <ActivityDetailMobileHero
        date={model.activity.date}
        title={model.activityTitle}
        statusChips={model.heroFactChips}
        venueLine={
          model.registryPlacePath && model.registryPlaceName ? (
            <Link to={model.registryPlacePath} className="font-medium text-emerald-800">
              {model.registryPlaceName}
            </Link>
          ) : (
            model.activity.locationName
          )
        }
      />
    ) : null}
    {model.publicDetail ? null : (
      <div
        className={`max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 ${
          model.isEmbedded ? 'px-0 py-2' : 'px-4 py-6'
        }`}
      >
        <ActivityDetailPlanColumn model={model} planSections={planSections} />
        <ActivityDetailSidebarColumn model={model} />
      </div>
    )}
  </>
);
