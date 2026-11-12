/**
 * Mobile hero share / trip-alert — upper-right on the photo strip.
 * Modal header is in-flow above the scroller — do not offset by header height.
 */
export const DETAIL_HERO_MOBILE_TOP_CHROME_CLASS =
  'absolute end-3 top-3 z-20 flex items-center gap-2 lg:hidden md:max-lg:top-1.5';

/**
 * Formerly pulled the hero under an absolute modal header.
 * Header is in-flow now — keep empty so call sites stay stable.
 */
export const DETAIL_HERO_MODAL_UNDERLAP_CLASS = '';
