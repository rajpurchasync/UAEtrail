/** Shared mobile top chrome — scroll-linked frost for product shell + consumer detail. */

/** Bottom-nav tab surfaces + standalone list — one safe-area inset (identity row + actions). */
export const MOBILE_CONSUMER_HEADER_TOP_INSET = 'pt-[var(--safe-top)]';
export const MOBILE_CONSUMER_HEADER_BOTTOM_PAD = 'pb-1.5';
export const MOBILE_CONSUMER_HEADER_HORIZONTAL_PAD = 'px-4';
export const MOBILE_CONSUMER_IDENTITY_ROW = 'flex min-h-12 items-center justify-between gap-3';

export const MOBILE_PRODUCT_HEADER_TRANSITION =
  'transition-[background-color,backdrop-filter,border-color,box-shadow] duration-200';

/** Fixed / layout header at scroll top (My Plans, Chat, profile stack, …). */
export const MOBILE_PRODUCT_HEADER_REST =
  `border-0 bg-white ${MOBILE_PRODUCT_HEADER_TRANSITION}`;

/** After `#app-scroll-root` / `.app-scroll-body` scrolls — light glass so content shows through. */
export const MOBILE_PRODUCT_HEADER_FROSTED =
  `border-0 bg-white/40 backdrop-blur-2xl ${MOBILE_PRODUCT_HEADER_TRANSITION} supports-[backdrop-filter]:bg-white/30`;

/** Full-screen FAB compose — tab header stays on top; sheet scrolls underneath. */
export const MOBILE_PRODUCT_HEADER_COMPOSE_IMMERSIVE =
  `border-0 bg-white/20 backdrop-blur-xl shadow-none ${MOBILE_PRODUCT_HEADER_TRANSITION} supports-[backdrop-filter]:bg-white/15`;

/** Activity / place consumer detail scroll — clearance for absolute sticky join CTA. */
export const CONSUMER_DETAIL_SCROLL_CLASS = 'consumer-detail-scroll';
