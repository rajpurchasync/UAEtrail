import { CalendarDays, LayoutGrid, List } from 'lucide-react';
import type { ListExplorerLayout } from './listExplorerLayout';

const OPTIONS: ReadonlyArray<{
  key: ListExplorerLayout;
  label: string;
  icon: typeof LayoutGrid;
}> = [
  { key: 'thumbnails', label: 'Thumbnails', icon: LayoutGrid },
  { key: 'list', label: 'List', icon: List },
  { key: 'calendar', label: 'Calendar', icon: CalendarDays },
];

type ListExplorerViewSwitchProps = {
  layout: ListExplorerLayout;
  onChange: (layout: ListExplorerLayout) => void;
  /** Calendar is for dated outings. Places, shops, and spots hide it. */
  showCalendar?: boolean;
};

export const ListExplorerViewSwitch = ({
  layout,
  onChange,
  showCalendar = true,
}: ListExplorerViewSwitchProps) => {
  const options = showCalendar ? OPTIONS : OPTIONS.filter((option) => option.key !== 'calendar');
  return (
  <div
    className="inline-flex shrink-0 rounded-full border border-neutral-200/80 bg-neutral-100/80 p-0.5"
    role="tablist"
    aria-label="View"
  >
    {options.map(({ key, label, icon: Icon }) => {
      const active = layout === key;
      return (
        <button
          key={key}
          type="button"
          role="tab"
          aria-selected={active}
          aria-label={label}
          title={label}
          onClick={() => onChange(key)}
          className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition ${
            active
              ? 'bg-white text-emerald-700 shadow-sm'
              : 'text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <Icon className="h-4 w-4" strokeWidth={active ? 2.4 : 2} aria-hidden />
        </button>
      );
    })}
  </div>
  );
};
