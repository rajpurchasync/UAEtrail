import { APP_SCROLL_BODY_CLASS } from '../config/layoutScroll';

/** Home hub visual language — mint canvas, not dashboard gray. */

export const MEMBER_HOME_CANVAS =
  `${APP_SCROLL_BODY_CLASS} bg-[#eef6f1] text-neutral-900 max-md:pb-[calc(var(--bottom-nav-height,56px)+var(--safe-bottom,0px)+1.25rem)]`;

export const MEMBER_HOME_COLUMN = 'mx-auto w-full max-w-[32rem] px-4';

export const MEMBER_HOME_SEARCH_PILL =
  'flex h-10 w-full items-center gap-2 rounded-full border border-white bg-white px-3 text-left text-[14px] text-neutral-400 shadow-[0_1px_6px_rgba(15,23,42,0.05)]';

export const MEMBER_HOME_TILE_BASE =
  'relative flex min-h-[5.75rem] flex-col justify-end rounded-[1.25rem] p-3 text-left shadow-[0_2px_12px_rgba(15,23,42,0.05)] transition active:scale-[0.99]';

/** Upper identity row — slightly shorter than standard tab headers, still centered. */
export const MEMBER_HOME_HEADER_ROW = 'flex min-h-11 items-center gap-2';

/** Sticky upper row — avatar · area · chat · calendar · bell. */
export const MEMBER_HOME_HEADER_CHROME =
  'sticky top-0 z-20 -mx-4 border-b border-emerald-950/[0.07] bg-[#eef6f1]/96 px-4 pt-[max(0.375rem,var(--safe-top,0px))] pb-1 backdrop-blur-md md:static md:mx-0 md:border-b-0 md:bg-transparent md:px-0 md:pt-0 md:pb-0';

/** Lower header band — weather · greeting · subcopy · search. */
export const MEMBER_HOME_HERO_LOWER = 'space-y-1.5 pt-2.5';

/** Weather row — text only, no pill background. */
export const MEMBER_HOME_WEATHER_CHROME =
  'inline-flex max-w-full items-center gap-2 text-[12px] leading-none';

export const MEMBER_HOME_HERO_GREETING =
  'text-[1.75rem] font-bold leading-[1.1] tracking-tight text-[#0b2418]';

export const MEMBER_HOME_HERO_SUBCOPY = 'text-[15px] font-normal leading-snug text-neutral-500';

/** Intent tiles + nearby — tighter than feed below. */
export const MEMBER_HOME_PRIMARY_STACK = 'mt-3 space-y-3';

export const MEMBER_HOME_FEED_STACK = 'mt-5';
