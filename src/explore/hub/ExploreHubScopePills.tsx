import type { ExploreSearchScope } from '../search/exploreSearchRouting';

const SCOPES: ReadonlyArray<{ mode: ExploreSearchScope; label: string }> = [
  { mode: 'join', label: 'Trips' },
  { mode: 'places', label: 'Places' },
  { mode: 'crew', label: 'Go with' },
];

type ExploreHubScopePillsProps = {
  active: ExploreSearchScope;
  onChange: (mode: ExploreSearchScope) => void;
};

/** Booking-style product pills — scope before search commit. */
export const ExploreHubScopePills = ({ active, onChange }: ExploreHubScopePillsProps) => (
  <div
    className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-0.5 scrollbar-none"
    role="tablist"
    aria-label="Search scope"
  >
    {SCOPES.map(({ mode, label }) => {
      const selected = active === mode;
      return (
        <button
          key={mode}
          type="button"
          role="tab"
          aria-selected={selected}
          onClick={() => onChange(mode)}
          className={[
            'shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition',
            selected
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white text-neutral-800 ring-1 ring-neutral-200',
          ].join(' ')}
        >
          {label}
        </button>
      );
    })}
  </div>
);