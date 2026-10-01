import type { TripsSegment } from '../../trips/tripsRouting';

type TripsSegmentScrollProps = {
  tabs: { id: TripsSegment; label: string }[];
  activeId: TripsSegment;
  onChange: (id: TripsSegment) => void;
};

/** Horizontally scrollable primary trips segments (mobile-first). */
export const TripsSegmentScroll = ({ tabs, activeId, onChange }: TripsSegmentScrollProps) => (
  <div className="-mx-4 overflow-x-auto px-4 scrollbar-none">
    <div className="flex min-w-min gap-2 pb-1">
      {tabs.map((tab) => {
        const active = tab.id === activeId;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition active:scale-[0.98] ${
              active
                ? 'bg-neutral-900 text-white shadow-sm'
                : 'bg-white text-neutral-700 ring-1 ring-neutral-200/90'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  </div>
);
