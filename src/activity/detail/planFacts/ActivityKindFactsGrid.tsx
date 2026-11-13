import type { ReactNode } from 'react';

export type ActivityKindFactItem = {
  label: string;
  value: ReactNode;
};

type ActivityKindFactsGridProps = {
  title: string;
  items: ActivityKindFactItem[];
  panelClassName: string;
  accentClass?: string;
};

/** Shared stat grid for per-kind activity Plan panels. */
export const ActivityKindFactsGrid = ({
  title,
  items,
  panelClassName,
  accentClass = 'text-emerald-600',
}: ActivityKindFactsGridProps) => {
  const visible = items.filter((item) => item.value != null && item.value !== '');
  if (visible.length === 0) return null;

  return (
    <div className={`bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 lg:rounded-xl lg:p-3 ${panelClassName}`}>
      <h2 className="text-lg font-bold text-gray-900 mb-4 lg:mb-2 lg:text-[13px] lg:font-semibold lg:uppercase lg:tracking-wide lg:text-neutral-500">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 lg:gap-2">
        {visible.map((item) => (
          <div key={item.label} className="bg-gray-50 rounded-xl p-3 lg:rounded-lg lg:p-2">
            <p className={`text-xs font-medium ${accentClass} mb-0.5 lg:text-[10px]`}>{item.label}</p>
            <p className="text-sm font-semibold text-gray-900 leading-snug lg:text-[13px]">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
