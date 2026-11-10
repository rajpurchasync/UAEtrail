/**
 * Mobile hero share / trip-alert — upper-right on the photo strip.
 * Hero wrappers already pull under the modal header (`-mt` / `pt` on `--detail-header-pad`);
 * do not add header height again here (that pushed controls ~1 header too low).
 */
export const DETAIL_HERO_MOBILE_TOP_CHROME_CLASS =
  'absolute end-3 top-3 z-20 flex items-center gap-2 lg:hidden md:max-lg:top-1.5';

/** Pull hero under fixed modal header — omit when the sheet header is already outside scroll. */
export const DETAIL_HERO_MODAL_UNDERLAP_CLASS =
  'max-md:-mt-[var(--detail-header-pad,calc(var(--safe-top)+4.75rem))] max-md:pt-[var(--detail-header-pad,calc(var(--safe-top)+4.75rem))]';
