/**
 * List browse thumbnail hero chrome (P-B in SYSTEM_COHERENCE §6.1.3).
 * Map peek keeps its own density; these tokens are for `/list` + hub catalog thumbs only.
 */

/** S1 — outing kind pill on photo (text only; no emoji). */
export const BROWSE_LIST_HERO_TYPE_WRAP =
  'inline-block max-w-full rounded-md bg-black/65 px-2 py-1 ring-1 ring-white/25 shadow-sm';

export const BROWSE_LIST_HERO_TYPE =
  'text-[13px] font-bold leading-tight text-white sm:text-sm';

/** Price / free — sits above policy chips on the photo foot. */
export const BROWSE_LIST_HERO_PRICE_CHIP =
  'inline-block rounded-lg bg-white/95 px-2 py-1 text-[11px] font-bold leading-snug text-neutral-900 ring-1 ring-white/40 sm:text-xs';

export const BROWSE_LIST_HERO_SOLD_OUT_CHIP =
  'inline-block rounded-lg bg-red-600 px-2 py-1 text-[11px] font-bold uppercase tracking-wide leading-snug text-white ring-1 ring-white/25 sm:text-xs';

/** S4 — audience / policy chips on photo foot. */
export const BROWSE_LIST_HERO_POLICY_CHIP =
  'inline-block rounded-lg bg-black/65 px-2 py-1 text-[11px] font-semibold leading-snug text-white ring-1 ring-white/25 sm:text-xs';

/** Bottom gradient behind policy chips — readable on busy photos. */
export const BROWSE_LIST_HERO_FOOT_GRADIENT = 'px-2.5 pb-2.5 pt-10';

export const BROWSE_LIST_HERO_POLICY_GAP = 'gap-1.5';