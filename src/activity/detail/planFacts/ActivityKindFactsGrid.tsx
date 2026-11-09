import type { ReactNode } from 'react';
import { ConsumerPlanSection } from '../../../detail/shell/ConsumerPlanSection';

export type ActivityKindFactItem = {
  label: string;
  value: ReactNode;
};

type ActivityKindFactsGridProps = {
  title: string;
  items: ActivityKindFactItem[];
  panelClassName: string;
  accentClass?: string;
  consumerSection?: boolean;
  sectionId?: string;
};

const factsGrid = (
  visible: ActivityKindFactItem[],
  accentClass: string
) => (
  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:gap-2">
    {visible.map((item) => (
      <div key={item.label} className="rounded-xl bg-gray-50 p-3 lg:rounded-lg lg:p-2 dark:bg-neutral-800/50">
        <p className={`mb-0.5 text-xs font-medium lg:text-[10px] ${accentClass}`}>{item.label}</p>
        <div className="text-sm font-semibold leading-snug text-gray-900 lg:text-[13px] dark:text-neutral-100">
          {item.value}
        </div>
      </div>
    ))}
  </div>
);

/** Shared stat grid for per-kind activity Plan panels. */
export const ActivityKindFactsGrid = ({
  title,
  items,
  panelClassName,
  accentClass = 'text-emerald-600',
  consumerSection = false,
  sectionId = 'activity-detail-trail-facts',
}: ActivityKindFactsGridProps) => {
  const visible = items.filter((item) => item.value != null && item.value !== '');
  if (visible.length === 0) return null;

  if (consumerSection) {
    return (
      <ConsumerPlanSection
        id={sectionId}
        title={title}
        tone="slate"
        panelClassName={panelClassName}
      >
        {factsGrid(visible, accentClass)}
      </ConsumerPlanSection>
    );
  }

  return (
    <div
      className={`rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 dark:border-neutral-800 dark:bg-neutral-900 lg:rounded-xl lg:p-3 ${panelClassName}`}
    >
      <h2 className="mb-4 text-lg font-bold text-gray-900 lg:mb-2 lg:text-[13px] lg:font-semibold lg:uppercase lg:tracking-wide lg:text-neutral-500">
        {title}
      </h2>
      {factsGrid(visible, accentClass)}
    </div>
  );
};
