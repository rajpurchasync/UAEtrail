import { CalendarDays, LayoutGrid, List } from 'lucide-react';
import type { ListExplorerLayout } from '../browse/browseListLayout';

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
  compact?: boolean;
};

export const ListExplorerViewSwitch = ({
  layout,
  onChange,
  showCalendar = true,
  compact = false,
}: ListExplorerViewSwitchProps) => {
  const options = showCalendar ? OPTIONS : OPTIONS.filter((option) => option.key !== 'calendar');
  const btnSize = compact ? 'h-7 w-7' : 'h-8 w-8';
  const iconSize = compact ? 'h-3.5 w-3.5' : 'h-4 w-4';
  return (
  <div
    className={`inline-flex shrink-0 rounded-full border border-neutral-200/80 bg-neutral-100/80 ${
      compact ? 'p-px' : 'p-0.5'
    }`}
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
          className={`inline-flex ${btnSize} items-center justify-center rounded-full transition ${
            active
              ? 'bg-white text-emerald-700 shadow-sm'
              : 'text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <Icon className={`${iconSize} shrink-0`} strokeWidth={active ? 2.4 : 2} aria-hidden />
        </button>
      );
    })}
  </div>
  );
};
