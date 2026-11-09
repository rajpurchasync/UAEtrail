import { PanelLeftOpen } from 'lucide-react';

type BrowsePanelCollapsedRailProps = {
  labels: readonly string[];
  onExpand: () => void;
};

/** Browse panel while collapsed — applied filters plus a control to reopen the list. */
export const BrowsePanelCollapsedRail = ({ labels, onExpand }: BrowsePanelCollapsedRailProps) => (
  <div className="flex h-full min-h-0 flex-col gap-2 px-2 py-2">
    <button
      type="button"
      onClick={onExpand}
      className="inline-flex min-h-8 w-full items-center justify-center gap-1 rounded-md bg-white px-1.5 text-[11px] font-semibold text-neutral-800 shadow-sm ring-1 ring-neutral-200 hover:bg-neutral-50"
      aria-label="Show browse panel"
    >
      <PanelLeftOpen className="h-3.5 w-3.5 shrink-0" aria-hidden />
      Browse
    </button>
    <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
      <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-neutral-400">Filters</p>
      {labels.length === 0 ? (
        <p className="mt-1 text-[11px] leading-snug text-neutral-500">All</p>
      ) : (
        <ul className="mt-1 flex flex-wrap gap-1">
          {labels.map((label) => (
            <li key={label} className="max-w-full">
              <span
                className="inline-flex max-w-full rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold leading-tight text-emerald-800 ring-1 ring-emerald-100/80"
                title={label}
              >
                <span className="truncate">{label}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  </div>
);
