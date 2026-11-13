/** Outer list item — fixed footprint so every chip matches. */
export const WEATHER_DAY_CHIP_ITEM =
  'list-none flex h-[5.85rem] w-[5.65rem] shrink-0';

/** Shared surface for forecast day chips (light + dark). */
export const WEATHER_DAY_CHIP_SHELL =
  'flex h-full w-full min-h-0 flex-col overflow-hidden rounded-xl border px-2 py-1.5 shadow-sm ' +
  'bg-white/95 border-sky-200/75 text-neutral-900 ring-1 ring-sky-100/90 ' +
  'dark:bg-neutral-900/95 dark:border-neutral-700/65 dark:text-neutral-50 dark:ring-white/[0.06] dark:shadow-[0_2px_10px_rgba(0,0,0,.35)]';

/** Interactive chip (external day forecast link). */
export const WEATHER_DAY_CHIP_SHELL_LINK =
  WEATHER_DAY_CHIP_SHELL +
  ' cursor-pointer no-underline transition-[border-color,box-shadow,transform] duration-150 ' +
  'hover:border-sky-400 hover:shadow-md hover:-translate-y-0.5 ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 ' +
  'dark:hover:border-sky-500';

export const WEATHER_DAY_CHIP_LABEL =
  'truncate text-[9px] font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400';

export const WEATHER_DAY_CHIP_META =
  'mt-auto truncate text-[9px] leading-snug text-neutral-500 dark:text-neutral-400';

export const WEATHER_DAY_CHIP_CONDITION =
  'mt-0.5 truncate text-[10px] leading-tight text-neutral-600 dark:text-neutral-300';
