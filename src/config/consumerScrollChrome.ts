/** Shared mobile top chrome — scroll-linked frost for product shell + consumer detail. */

export const MOBILE_PRODUCT_HEADER_TRANSITION =
  'transition-[background-color,backdrop-filter,border-color,box-shadow] duration-200';

/** Fixed / layout header at scroll top (My Plans, Chat, profile stack, …). */
export const MOBILE_PRODUCT_HEADER_REST =
  `border-b border-neutral-200/80 bg-white ${MOBILE_PRODUCT_HEADER_TRANSITION}`;

/** After `#app-scroll-root` / `.app-scroll-body` scrolls — light glass so content shows through. */
export const MOBILE_PRODUCT_HEADER_FROSTED =
  `border-b border-neutral-200/25 bg-white/40 backdrop-blur-2xl shadow-[0_4px_20px_rgba(15,23,42,.04)] ${MOBILE_PRODUCT_HEADER_TRANSITION} supports-[backdrop-filter]:bg-white/30`;

/** Activity / place consumer detail scroll — clearance for absolute sticky join CTA. */
export const CONSUMER_DETAIL_SCROLL_CLASS = 'consumer-detail-scroll';
