import { CarouselPlayPauseButton } from './CarouselPlayPauseButton';

const NAV_BUTTON_CLASS =
  'home-focus-ring flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--gray-200)] bg-home-surface text-[length:var(--text-lg)] leading-none text-[var(--gray-600)] shadow-sm transition-colors hover:bg-home-muted hover:text-home-ink';

export interface MarketingCarouselControlsProps {
  activeIndex: number;
  /** Number of dots / steps (pages), not necessarily total cards. */
  itemCount: number;
  onPrevious: () => void;
  onNext: () => void;
  onSelect: (index: number) => void;
  previousLabel: string;
  nextLabel: string;
  dotsGroupLabel: string;
  dotLabel: (index: number) => string;
  userPaused: boolean;
  onTogglePause: () => void;
  showProgressRing: boolean;
  freezeProgressRing: boolean;
  progressCycle: number;
}

export const MarketingCarouselControls = ({
  activeIndex,
  itemCount,
  onPrevious,
  onNext,
  onSelect,
  previousLabel,
  nextLabel,
  dotsGroupLabel,
  dotLabel,
  userPaused,
  onTogglePause,
  showProgressRing,
  freezeProgressRing,
  progressCycle
}: MarketingCarouselControlsProps) => (
  <div
    className="mt-1.5 flex items-center justify-center gap-0.5 md:mt-2 md:justify-end"
    role="toolbar"
    aria-label={dotsGroupLabel}
  >
    <button type="button" className={NAV_BUTTON_CLASS} aria-label={previousLabel} onClick={onPrevious}>
      ‹
    </button>
    <div className="flex items-center px-0.5" role="group" aria-label={dotsGroupLabel}>
      {Array.from({ length: itemCount }, (_, i) => (
        <button
          key={i}
          type="button"
          aria-current={i === activeIndex ? 'true' : undefined}
          aria-label={dotLabel(i)}
          className="home-focus-ring flex h-7 min-w-7 items-center justify-center rounded-full"
          onClick={() => onSelect(i)}
        >
          <span
            className={[
              'rounded-full transition-all duration-[var(--duration-hover)]',
              i === activeIndex
                ? 'h-2 w-6 bg-home-green-600'
                : 'h-2 w-2 bg-[var(--gray-300)] hover:bg-[var(--gray-400)]'
            ].join(' ')}
          />
        </button>
      ))}
    </div>
    <button type="button" className={NAV_BUTTON_CLASS} aria-label={nextLabel} onClick={onNext}>
      ›
    </button>
    <CarouselPlayPauseButton
      paused={userPaused}
      onToggle={onTogglePause}
      tone="surface"
      className="h-9 w-9"
      iconClassName="h-4 w-4"
      showProgressRing={showProgressRing}
      freezeProgressRing={freezeProgressRing}
      progressCycle={progressCycle}
    />
  </div>
);
