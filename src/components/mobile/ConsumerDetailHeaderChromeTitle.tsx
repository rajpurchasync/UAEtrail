import { Car, Footprints, Tent } from 'lucide-react';
import { iconStroke } from '../../config/navIcons';

export const CONSUMER_DETAIL_HEADER_CHROME_ROW_CLASS =
  'inline-flex max-w-full items-center justify-center gap-2 truncate text-center text-[15px] font-bold leading-tight text-neutral-900';

export const CONSUMER_DETAIL_HEADER_CHROME_EMOJI_CLASS =
  'font-emoji text-2xl font-bold leading-none shrink-0';

const LUCIDE_MARK_CLASS = 'h-6 w-6 shrink-0 text-neutral-900';

/** Lucide marks for scheduled outing types (emoji fallback for venues / events). */
export type ConsumerDetailHeaderMark = 'rideshare' | 'hiking' | 'camping';

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
      return <Footprints className={LUCIDE_MARK_CLASS} strokeWidth={stroke} aria-hidden />;
    case 'camping':
      return <Tent className={LUCIDE_MARK_CLASS} strokeWidth={stroke} aria-hidden />;
  }
};

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
