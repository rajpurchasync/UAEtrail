type TripsUnderlineTabsProps<T extends string> = {
  tabs: { id: T; label: string }[];
  activeId: T;
  onChange: (id: T) => void;
  ariaLabel?: string;
};

const tabBase =
  'shrink-0 min-w-[5.5rem] px-2 pb-3 pt-1 text-[15px] font-semibold transition [-webkit-tap-highlight-color:transparent]';

/** Underline tab row (Plans sub-tabs, legacy upcoming/completed). */
export const TripsUnderlineTabs = <T extends string>({
  tabs,
  activeId,
  onChange,
  ariaLabel = 'Trips sections',
}: TripsUnderlineTabsProps<T>) => (
  <div
    className="mb-1 flex gap-8 border-b border-neutral-200/90 px-0.5"
    role="tablist"
    aria-label={ariaLabel}
  >
    {tabs.map((tab) => {
      const active = tab.id === activeId;
      return (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active}
          className={
            active
              ? `${tabBase} text-emerald-800 decoration-emerald-600 underline decoration-2 underline-offset-[12px]`
              : `${tabBase} text-neutral-500 hover:text-neutral-800`
          }
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      );
    })}
  </div>
);

export type TripsUnderlineTabId = 'upcoming' | 'completed';
