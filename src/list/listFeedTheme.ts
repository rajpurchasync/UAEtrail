/** Category feed — 4:5 hero matches Instagram portrait feed posts (1080×1350). */
export const LIST_FEED_POSTER_ASPECT = 'aspect-[4/5]' as const;

export const LIST_FEED = {
  list: 'flex flex-col gap-8 py-2 sm:gap-10 sm:py-4',
  categoryList: 'flex flex-col gap-6 py-1 sm:gap-8 sm:py-3',
  article: 'flex flex-col',
  articleEdge: 'flex flex-col max-md:-mx-0',
  header: 'mb-2.5 flex items-center justify-between gap-3 px-1',
  headerEdge: 'mb-2 flex items-center justify-between gap-3 px-4',
  publisherLink: 'flex min-w-0 flex-1 items-center gap-3 active:opacity-85',
  publisherStatic: 'flex min-w-0 flex-1 items-center gap-3',
  publisherName: 'truncate text-[15px] font-semibold leading-tight text-neutral-900',
  publisherType: 'truncate text-xs font-medium leading-tight text-neutral-500',
  menuButton:
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-neutral-800 transition active:bg-neutral-100 active:scale-95',
  feedCardFrame:
    'overflow-hidden rounded-[22px] bg-white shadow-[0_8px_30px_rgba(15,23,42,.07)] ring-1 ring-black/[0.05]',
  feedCardFrameEdge:
    'overflow-hidden rounded-none bg-white shadow-none ring-0 max-md:rounded-none md:rounded-[22px] md:shadow-[0_8px_30px_rgba(15,23,42,.07)] md:ring-1 md:ring-black/[0.05]',
  mediaOnly: `relative ${LIST_FEED_POSTER_ASPECT} w-full overflow-hidden bg-neutral-100`,
  media:
    `relative ${LIST_FEED_POSTER_ASPECT} w-full overflow-hidden rounded-[22px] bg-neutral-100 ring-1 ring-black/[0.05]`,
  overlayBottom:
    'pointer-events-none absolute inset-0 z-[2] flex h-full min-h-0 flex-col px-4 pb-3.5 pt-11 text-left',
  overlayCaptionHeader: 'flex min-w-0 flex-col items-start justify-center gap-1',
  overlayCaptionHeaderSlot: 'flex shrink-0 flex-col justify-start pt-[3.5rem] sm:pt-14',
  overlayCaptionSpacer: 'min-h-0 flex-1',
  overlayCaptionFooter: 'mt-auto flex w-full shrink-0 flex-col gap-0.5 pb-0.5',
  overlayCaptionFooterWithCta: 'pb-1',
  /** Base for adaptive bottom gradient — see listFeedCaptionContrast.ts */
  overlayPhotoScrimBase:
    'before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:bg-gradient-to-t',
  overlayTextShadow:
    '[text-shadow:0_1px_3px_rgba(0,0,0,.55),0_4px_16px_rgba(0,0,0,.35)]',
  factsLine: 'w-full text-sm leading-snug',
  factsOnPhoto: 'font-semibold text-white',
  factsOnFallback: 'font-medium text-neutral-700',
  placeLine: 'text-[11px] font-semibold tracking-wide',
  placeOnPhoto: 'text-white/90',
  placeOnFallback: 'text-emerald-900',
  title: 'font-extrabold leading-[1.08] tracking-tight',
  titleFeed: 'text-[1.85rem] sm:text-[2.45rem]',
  scheduleRow: 'flex w-full items-baseline justify-between gap-3 text-sm font-semibold',
  scheduleLeft: 'min-w-0 truncate text-left',
  scheduleRight: 'shrink-0 text-right tabular-nums',
  titleOnPhoto: 'text-white',
  titleOnFallback: 'text-neutral-900',
  labelPill: 'rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide',
  labelOnPhoto: 'bg-black/40 text-white ring-1 ring-white/35 backdrop-blur-[3px]',
  labelOnFallback: 'bg-white/70 text-neutral-700',
  railArticle: 'w-[17.5rem] shrink-0 snap-start',
  railMedia:
    `relative ${LIST_FEED_POSTER_ASPECT} w-full overflow-hidden rounded-[20px] bg-neutral-100 ring-1 ring-black/[0.06]`,
  railOverlayBottom:
    'pointer-events-none absolute inset-0 z-[2] flex h-full min-h-0 flex-col px-3 pb-2.5 pt-8 text-left',
  railOverlayCaptionHeaderSlot: 'flex shrink-0 flex-col justify-start pt-10',
  railFactsLine: 'w-full text-[11px] font-semibold leading-snug',
  railTitle: 'text-[1.25rem] font-extrabold leading-[1.12] tracking-tight',
} as const;
