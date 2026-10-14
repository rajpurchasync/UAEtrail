import { Pause, Play } from 'lucide-react';
import { HERO_CAROUSEL_AUTOPLAY_MS } from './heroCarouselTypes';

export type CarouselPlayPauseTone = 'hero' | 'surface' | 'muted';

const toneClass: Record<CarouselPlayPauseTone, string> = {
  hero: 'bg-white/15 text-white backdrop-blur-sm hover:bg-white/25',
  surface:
    'border border-[var(--gray-200)] bg-home-surface text-home-ink shadow-home-card hover:bg-home-muted',
  muted:
    'border border-[var(--gray-200)] bg-home-surface text-[var(--gray-600)] shadow-sm hover:bg-home-muted hover:text-home-ink'
};

const ringTrackClass: Record<CarouselPlayPauseTone, string> = {
  hero: 'stroke-white/40',
  surface: 'stroke-[var(--gray-300)]',
  muted: 'stroke-[var(--gray-300)]'
};

const ringProgressClass: Record<CarouselPlayPauseTone, string> = {
  hero: 'stroke-white',
  surface: 'stroke-[var(--green-600)]',
  muted: 'stroke-[var(--green-600)]'
};

const RING_RADIUS = 17;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export const CarouselPlayPauseButton = ({
  paused,
  onToggle,
  tone = 'surface',
  showProgressRing = false,
  freezeProgressRing = false,
  progressCycle = 0,
  className = 'h-10 w-10',
  iconClassName = 'h-4 w-4'
}: {
  paused: boolean;
  onToggle: () => void;
  tone?: CarouselPlayPauseTone;
  showProgressRing?: boolean;
  freezeProgressRing?: boolean;
  progressCycle?: number;
  className?: string;
  iconClassName?: string;
}) => (
  <button
    type="button"
    className={`home-focus-ring relative flex shrink-0 items-center justify-center rounded-full ${toneClass[tone]} ${className}`}
    onClick={onToggle}
    aria-pressed={paused}
    aria-label={paused ? 'Play carousel' : 'Pause carousel'}
  >
    <svg
      className="pointer-events-none absolute inset-0 -rotate-90"
      viewBox="0 0 40 40"
      aria-hidden
    >
      <circle
        cx="20"
        cy="20"
        r={RING_RADIUS}
        fill="none"
        className={ringTrackClass[tone]}
        strokeWidth="2"
      />
      <circle
        key={progressCycle}
        cx="20"
        cy="20"
        r={RING_RADIUS}
        fill="none"
        className={[
          ringProgressClass[tone],
          showProgressRing ? 'home-carousel-ring-progress' : '',
          freezeProgressRing ? '[animation-play-state:paused]' : ''
        ].join(' ')}
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray={RING_CIRCUMFERENCE}
        style={{
          ['--carousel-ring-circumference' as string]: `${RING_CIRCUMFERENCE}`,
          ['--carousel-ring-duration' as string]: `${HERO_CAROUSEL_AUTOPLAY_MS}ms`
        }}
      />
    </svg>
    {paused ? <Play className={`relative z-[1] ${iconClassName}`} aria-hidden /> : <Pause className={`relative z-[1] ${iconClassName}`} aria-hidden />}
  </button>
);
