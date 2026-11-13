import type { ActivityDetailDTO } from '@uaetrail/shared-types';
import { Shield } from 'lucide-react';
import {
  buildActivityAudienceLines,
  activityHasAudiencePresentation,
} from '../../../activity/activityDetailAudiencePresentation';
import { ConsumerPlanSection } from '../../../detail/shell/ConsumerPlanSection';

type Props = {
  activity: ActivityDetailDTO;
  panelClassName: string;
  consumerSection?: boolean;
};

/**
 * Who the outing is for — plan §4 audience / fitness / accessibility.
 */
export const ActivityDetailAudienceSection = ({
  activity,
  panelClassName,
  consumerSection = false,
}: Props) => {
  if (!activityHasAudiencePresentation(activity)) return null;
  const lines = buildActivityAudienceLines(activity);
  const body = (
    <ul className="list-disc space-y-1 pl-5 text-sm text-gray-800 lg:text-[13px]">
      {lines.map((line) => (
        <li key={line}>{line}</li>
      ))}
    </ul>
  );

  if (consumerSection) {
    return (
      <ConsumerPlanSection
        id="activity-detail-audience"
        title="Who it is for"
        tone="emerald"
        panelClassName={panelClassName}
      >
        {body}
      </ConsumerPlanSection>
    );
  }

  return (
    <div
      id="activity-detail-audience"
      className={`scroll-mt-24 rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 dark:border-neutral-800 dark:bg-neutral-900 lg:scroll-mt-8 lg:rounded-xl lg:p-3 ${panelClassName}`}
    >
      <div className="mb-2 flex items-center gap-2">
        <Shield className="h-4 w-4 text-emerald-700" aria-hidden />
        <h2 className="text-lg font-bold text-gray-900 lg:text-[13px] lg:font-semibold lg:uppercase lg:tracking-wide lg:text-neutral-500">
          Who it is for
        </h2>
      </div>
      {body}
    </div>
  );
};
