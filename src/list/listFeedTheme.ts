/** Category feed — 4:5 hero matches Instagram portrait feed posts (1080×1350). */
export const LIST_FEED_POSTER_ASPECT = 'aspect-[4/5]' as const;

export const LIST_FEED = {
  list: 'flex flex-col gap-8 py-2 sm:gap-10 sm:py-4',
  categoryList: 'flex flex-col gap-6 pt-4 pb-2 sm:gap-8 sm:pt-5 sm:pb-3',
  article: 'flex flex-col',
  articleEdge: 'flex flex-col max-md:-mx-0',
  header: 'mb-2.5 flex items-center justify-between gap-3 px-1',
  headerEdge: 'mb-2.5 flex items-center justify-between gap-3 px-4 pt-1',
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
  overlayRoot:
    'pointer-events-none absolute inset-0 z-[2] flex h-full min-h-0 flex-col px-4 pb-4 pt-4',
  overlayHeroCenter:
    'absolute inset-x-0 top-[16%] flex flex-col items-center px-4 text-center sm:top-[18%]',
  overlayHeroCopy: 'flex w-full max-w-[min(92%,20rem)] flex-col items-center gap-1.5 text-center',
  overlayFooterStack: 'flex w-full flex-col gap-2',
  /** Lifts facts + label row above the hero bottom (join CTA sits below image). */
  overlayFooterLift: 'mb-9 sm:mb-11',
  overlayFactsPanel:
    'w-full max-w-[min(100%,17.5rem)] mx-auto rounded-xl bg-black/35 px-3 py-2.5 ring-1 ring-white/10 backdrop-blur-[2px]',
  overlayFactsGrid: 'grid w-full grid-cols-2 gap-x-2 gap-y-1 text-[15px] font-semibold leading-snug text-white sm:text-base',
  overlayFactsCellLeft: 'min-w-0 truncate text-left',
  overlayFactsCellRight: 'min-w-0 truncate text-right tabular-nums',
  overlayLabelRow: 'flex flex-wrap gap-1.5',
  overlayRequirementLine: 'text-center text-[11px] font-medium leading-snug text-white/90',
  /** Base + top lift for title — bottom band from listFeedCaptionContrast.ts */
  overlayPhotoScrimBase:
    'before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:bg-gradient-to-b before:from-black/50 before:from-0% before:via-transparent before:via-[38%] before:to-transparent',
  overlayPhotoScrimBottom:
    'after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:-z-10 after:h-[58%] after:bg-gradient-to-t after:from-black/85 after:via-black/45 after:to-transparent',
  overlayTextShadow:
    '[text-shadow:0_1px_3px_rgba(0,0,0,.55),0_4px_16px_rgba(0,0,0,.35)]',
  factsLine: 'w-full text-sm leading-snug',
  factsOnPhoto: 'font-semibold text-white',
  factsOnFallback: 'font-medium text-neutral-700',
  placeLine: 'text-center text-[11px] font-semibold tracking-wide',
  placeOnPhoto: 'text-white/90',
  placeOnFallback: 'text-emerald-900',
  title: 'text-center font-extrabold leading-[1.08] tracking-tight',
  titleFeed: 'text-[2.05rem] sm:text-[2.75rem]',
  scheduleRow: 'flex w-full items-baseline justify-between gap-3 text-sm font-semibold',
  scheduleLeft: 'min-w-0 truncate text-left',
  scheduleRight: 'shrink-0 text-right tabular-nums',
  titleOnPhoto: 'text-white',
  titleOnFallback: 'text-neutral-900',
  labelPill: 'rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide',
  /** Audience / policy tags under facts panel — readable chips, not shouty caps. */
  labelRequirement: 'rounded-full px-2.5 py-1 text-[10px] font-semibold leading-tight normal-case tracking-normal',
  labelOnPhoto: 'bg-black/40 text-white ring-1 ring-white/35 backdrop-blur-[3px]',
  labelOnFallback: 'bg-white/70 text-neutral-700',
} as const;
