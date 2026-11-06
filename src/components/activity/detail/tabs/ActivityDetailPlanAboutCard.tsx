import { Calendar, Clock, Users } from 'lucide-react';
import type { ActivityDetailDTO } from '@uaetrail/shared-types';
import { ACTIVITY_PRICING_INDICATION_NOTE } from '@uaetrail/shared-types';
import { formatDate } from '../../../../utils';
import {
  inferActivityPricingMode,
  activityPriceLabel,
  activityPricingBadge,
  activityPricingModeLabel,
} from '../../../../utils/activityPricing';
type ActivityDetailPlanAboutCardProps = {
  panelClassName: string;
  activity: ActivityDetailDTO;
  showMobileTabs: boolean;
  /** Guest sign-in gate — facts live on hero; omit description and desktop fact grid. */
  hideAboutBody?: boolean;
  /** Consumer scroll with L1 peek card — omit duplicate schedule/pricing grid. */
  hideScheduleFactsGrid?: boolean;
};

export const ActivityDetailPlanAboutCard = ({
  panelClassName,
  activity,
  showMobileTabs,
  hideAboutBody = false,
  hideScheduleFactsGrid = false,
}: ActivityDetailPlanAboutCardProps) => {
  const pricingMode = inferActivityPricingMode(activity);
  const pricingBadge = activityPricingBadge(activity);

  const scheduleFactsGrid = hideScheduleFactsGrid ? null : (
    <div
      className={`grid grid-cols-2 sm:grid-cols-4 gap-3 ${hideAboutBody ? '' : 'mt-6'} ${
        showMobileTabs ? 'hidden md:grid' : ''
      }`}
    >
      <div className="bg-gray-50 rounded-xl p-3">
        <Calendar className="w-4 h-4 text-emerald-600 mb-1" />
        <p className="text-xs text-gray-500">Start</p>
        <p className="text-sm font-semibold text-gray-900">{formatDate(activity.date)}</p>
      </div>
      {activity.endDate ? (
        <div className="bg-gray-50 rounded-xl p-3">
          <Calendar className="w-4 h-4 text-emerald-600 mb-1" />
          <p className="text-xs text-gray-500">End</p>
          <p className="text-sm font-semibold text-gray-900">{formatDate(activity.endDate)}</p>
        </div>
      ) : null}
      <div className="bg-gray-50 rounded-xl p-3">
        <Clock className="w-4 h-4 text-emerald-600 mb-1" />
        <p className="text-xs text-gray-500">Time</p>
        <p className="text-sm font-semibold text-gray-900">
          {activity.time}
          {activity.endTime ? ` – ${activity.endTime}` : ''}
        </p>
      </div>
      <div className="bg-gray-50 rounded-xl p-3">
        <Users className="w-4 h-4 text-emerald-600 mb-1" />
        <p className="text-xs text-gray-500">Spots</p>
        <p className="text-sm font-semibold text-gray-900">
          {activity.slotsAvailable}/{activity.slotsTotal} left
        </p>
      </div>
      <div className="bg-gray-50 rounded-xl p-3">
        <p className="text-xs text-gray-500 mb-1">Pricing</p>
        <p
          className={`text-sm font-semibold inline-flex px-2 py-0.5 rounded-lg ${pricingBadge.bg} ${pricingBadge.text}`}
        >
          {activityPricingModeLabel(activity)}
        </p>
        {pricingMode !== 'free' ? (
          <p className="text-sm font-semibold text-gray-900 mt-1">{activityPriceLabel(activity)}</p>
        ) : null}
      </div>
    </div>
  );

  if (hideAboutBody) {
    return (
      <div className={`bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 lg:rounded-xl lg:p-3 ${panelClassName}`}>
        <h2 className="text-lg font-bold text-gray-900 mb-3 hidden md:block lg:mb-2 lg:text-[13px] lg:font-semibold lg:uppercase lg:tracking-wide lg:text-neutral-500">
          About this {activity.activityType === 'event' ? 'event' : 'activity'}
        </h2>
        {scheduleFactsGrid}
        {pricingMode !== 'free' ? (
          <p className="mt-4 text-xs text-gray-500 leading-relaxed">{ACTIVITY_PRICING_INDICATION_NOTE}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 lg:rounded-xl lg:p-3 ${panelClassName}`}>
      <h2 className="text-lg font-bold text-gray-900 mb-3 hidden md:block lg:mb-2 lg:text-[13px] lg:font-semibold lg:uppercase lg:tracking-wide lg:text-neutral-500">
        About this {activity.activityType === 'event' ? 'event' : 'activity'}
      </h2>
      {activity.description ? (
        <p className="text-gray-600 leading-relaxed whitespace-pre-line lg:text-[13px] lg:leading-5">{activity.description}</p>
      ) : null}

      {scheduleFactsGrid}

      {pricingMode !== 'free' ? (
        <p className="mt-4 text-xs text-gray-500 leading-relaxed">{ACTIVITY_PRICING_INDICATION_NOTE}</p>
      ) : null}

    </div>
  );
};
