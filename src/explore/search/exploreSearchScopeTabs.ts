import type { ExploreSearchScope } from './exploreSearchRouting';

export const EXPLORE_SEARCH_SCOPE_TAB_ROWS: ReadonlyArray<{
  mode: ExploreSearchScope;
  label: string;
}> = [
  { mode: 'join', label: 'Trips' },
  { mode: 'places', label: 'Places' },
  { mode: 'crew', label: 'Go with' },
];

/** Underlined icon tabs — booking search modal + results chrome. */
export const EXPLORE_SEARCH_SCOPE_TAB = {
  row: 'grid w-full grid-cols-3 border-b border-neutral-200',
  button:
    'flex min-w-0 flex-col items-center gap-1 px-1 pb-2.5 pt-2 text-center transition [-webkit-tap-highlight-color:transparent]',
  icon: 'h-5 w-5 shrink-0',
  label: 'truncate text-xs font-semibold leading-tight',
  active: 'border-b-2 border-emerald-600 text-emerald-900 -mb-px',
  inactive: 'border-b-2 border-transparent text-neutral-500 hover:text-neutral-800',
  activeIcon: 'text-emerald-700',
  inactiveIcon: 'text-neutral-400',
} as const;