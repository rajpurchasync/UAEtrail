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
    <div className={`bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 ${panelClassName}`}>
      <h2 className="text-lg font-bold text-gray-900 mb-4">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {visible.map((item) => (
          <div key={item.label} className="bg-gray-50 rounded-xl p-3">
            <p className={`text-xs font-medium ${accentClass} mb-0.5`}>{item.label}</p>
            <p className="text-sm font-semibold text-gray-900 leading-snug">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
