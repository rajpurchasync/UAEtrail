import { Car, Mountain, Tent } from 'lucide-react';
import { iconStroke } from '../../config/navIcons';

export const CONSUMER_DETAIL_HEADER_CHROME_ROW_CLASS =
  'inline-flex max-w-full items-center justify-center gap-2 truncate text-center text-[15px] font-bold leading-tight text-neutral-900';

export const CONSUMER_DETAIL_HEADER_CHROME_EMOJI_CLASS =
  'font-emoji text-2xl font-bold leading-none shrink-0';

const LUCIDE_MARK_CLASS = 'h-6 w-6 shrink-0 text-neutral-900';

/** Lucide marks for scheduled outing types and trail places (emoji fallback for other venues). */
export type ConsumerDetailHeaderMark = 'rideshare' | 'hiking' | 'trail' | 'camping';

type ConsumerDetailHeaderChromeTitleProps = {
  emoji: string;
  label: string;
  mark?: ConsumerDetailHeaderMark;
};

const HeaderChromeLucideMark = ({ mark }: { mark: ConsumerDetailHeaderMark }) => {
  const stroke = iconStroke.active;
  switch (mark) {
    case 'rideshare':
      return <Car className={LUCIDE_MARK_CLASS} strokeWidth={stroke} aria-hidden />;
    case 'hiking':
    case 'trail':
      return <Mountain className={LUCIDE_MARK_CLASS} strokeWidth={stroke} aria-hidden />;
    case 'camping':
      return <Tent className={LUCIDE_MARK_CLASS} strokeWidth={stroke} aria-hidden />;
  }
};

const HeaderChromeLucideMarkHero = ({ mark }: { mark: ConsumerDetailHeaderMark }) => {
  const stroke = iconStroke.active;
  const heroClass = 'h-4 w-4 shrink-0 text-white';
  switch (mark) {
    case 'rideshare':
      return <Car className={heroClass} strokeWidth={stroke} aria-hidden />;
    case 'hiking':
    case 'trail':
      return <Mountain className={heroClass} strokeWidth={stroke} aria-hidden />;
    case 'camping':
      return <Tent className={heroClass} strokeWidth={stroke} aria-hidden />;
  }
};

/** Type / place pin mark for sheet headers (not the outing photo). */
export const ConsumerDetailHeaderTypeMark = ({
  emoji,
  mark,
  sizeClass = 'h-9 w-9',
  variant = 'default',
}: {
  emoji: string;
  mark?: ConsumerDetailHeaderMark;
  sizeClass?: string;
  variant?: 'default' | 'hero';
}) => (
  <span
    className={`flex shrink-0 items-center justify-center rounded-lg ring-1 ${
      variant === 'hero'
        ? `bg-white/15 ring-white/30 ${sizeClass}`
        : `bg-neutral-100 ring-black/5 ${sizeClass}`
    }`}
    aria-hidden
  >
    {mark ? (
      variant === 'hero' ? (
        <HeaderChromeLucideMarkHero mark={mark} />
      ) : (
        <HeaderChromeLucideMark mark={mark} />
      )
    ) : (
      <span className={`font-emoji leading-none ${variant === 'hero' ? 'text-base' : 'text-xl'}`}>{emoji}</span>
    )}
  </span>
);

/** Center title on consumer entity detail sticky headers (activity, trail, camp, shop facility, …). */
export const ConsumerDetailHeaderChromeTitle = ({
  emoji,
  label,
  mark,
}: ConsumerDetailHeaderChromeTitleProps) => (
  <p className={CONSUMER_DETAIL_HEADER_CHROME_ROW_CLASS} title={label}>
    {mark ? (
      <HeaderChromeLucideMark mark={mark} />
    ) : (
      <span className={CONSUMER_DETAIL_HEADER_CHROME_EMOJI_CLASS} aria-hidden>{emoji}</span>
    )}
    <span className="truncate">{label}</span>
  </p>
);
