import { Calendar, Clock, Users } from 'lucide-react';
import type { ActivityDetailDTO } from '@uaetrail/shared-types';
import { ACTIVITY_PRICING_INDICATION_NOTE, activityScheduleSpanLabel } from '@uaetrail/shared-types';
import { formatDate } from '../../../../utils';
import {
  inferActivityPricingMode,
  activityPriceLabel,
  activityPricingBadge,
  activityPricingModeLabel,
} from '../../../../utils/activityPricing';
import { ConsumerDetailSection } from '../../../../detail/shell/ConsumerDetailSection';
type ActivityDetailPlanAboutCardProps = {
  panelClassName: string;
  activity: ActivityDetailDTO;
  showMobileTabs: boolean;
  /** Guest sign-in gate — facts live on hero; omit description and desktop fact grid. */
  hideAboutBody?: boolean;
  /** Consumer scroll with L1 peek card — omit duplicate schedule/pricing grid. */
  hideScheduleFactsGrid?: boolean;
  /** Anchor id for in-page nav (consumer detail). */
  contentId?: string;
};

export const ActivityDetailPlanAboutCard = ({
  panelClassName,
  activity,
  showMobileTabs,
  hideAboutBody = false,
  hideScheduleFactsGrid = false,
  contentId,
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
      {activity.endDate && activity.endDate !== activity.date ? (
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
        <p className="mt-1 text-xs font-semibold text-sky-700">
          {activityScheduleSpanLabel(activity.date, activity.endDate)}
        </p>
      </div>
      <div className="bg-gray-50 rounded-xl p-3">
        <Users className="w-4 h-4 text-emerald-600 mb-1" />
        <p className="text-xs text-gray-500">Spots</p>
        <p className="text-sm font-semibold text-gray-900">
          {activity.slotsAvailable}/{activity.slotsTotal} left
          {(activity.slotsAvailable ?? 0) === 0 ? (
            <span className="mt-1 block text-xs font-medium text-amber-800">
              {activity.waitlist === false ? 'Full — waitlist closed' : 'Waitlist when full'}
            </span>
          ) : activity.waitlist !== false ? (
            <span className="mt-1 block text-xs font-medium text-neutral-500">Waitlist if it fills</span>
          ) : null}
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

  const aboutTitle = activity.activityType === 'event' ? 'About this event' : 'About this activity';

  const inner = (
    <>
      {activity.description && !hideAboutBody ? (
        <p className="whitespace-pre-line leading-relaxed text-gray-600 dark:text-neutral-200 lg:text-[13px] lg:leading-5">
          {activity.description}
        </p>
      ) : null}
      {scheduleFactsGrid}
      {pricingMode !== 'free' ? (
        <p className="mt-4 text-xs leading-relaxed text-gray-500 dark:text-neutral-400">
          {ACTIVITY_PRICING_INDICATION_NOTE}
        </p>
      ) : null}
    </>
  );

  if (contentId) {
    return (
      <ConsumerDetailSection
        id={contentId}
        title={aboutTitle}
        tone="emerald"
        ariaLabel={aboutTitle}
        className={panelClassName}
      >
        {inner}
      </ConsumerDetailSection>
    );
  }

  const scrollAnchorClass = '';

  if (hideAboutBody) {
    return (
      <div
        className={`bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 dark:border-neutral-800 dark:bg-neutral-900 lg:rounded-xl lg:p-3${scrollAnchorClass} ${panelClassName}`}
      >
        <h2 className="mb-3 hidden text-lg font-bold text-gray-900 md:block lg:mb-2 lg:text-[13px] lg:font-semibold lg:uppercase lg:tracking-wide lg:text-neutral-500">
          {aboutTitle}
        </h2>
        {inner}
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 dark:border-neutral-800 dark:bg-neutral-900 lg:rounded-xl lg:p-3${scrollAnchorClass} ${panelClassName}`}
    >
      <h2 className="mb-3 text-lg font-bold text-gray-900 md:block lg:mb-2 lg:text-[13px] lg:font-semibold lg:uppercase lg:tracking-wide lg:text-neutral-500">
        {aboutTitle}
      </h2>
      {inner}
    </div>
  );
};
