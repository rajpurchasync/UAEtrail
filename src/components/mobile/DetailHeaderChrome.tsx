import { Car, Mountain, Tent } from 'lucide-react';
import { iconStroke } from '../../config/navIcons';

export const DETAIL_HEADER_CHROME_ROW_CLASS =
  'inline-flex max-w-full items-center justify-center gap-2 truncate text-center text-[15px] font-bold leading-tight text-neutral-900';

export const DETAIL_HEADER_CHROME_EMOJI_CLASS =
  'font-emoji text-2xl font-bold leading-none shrink-0';

const LUCIDE_MARK_CLASS = 'h-6 w-6 shrink-0 text-neutral-900';

export type DetailHeaderMark = 'rideshare' | 'hiking' | 'trail' | 'camping';

type DetailHeaderChromeTitleProps = {
  emoji: string;
  label: string;
  mark?: DetailHeaderMark;
};

const HeaderChromeLucideMark = ({ mark }: { mark: DetailHeaderMark }) => {
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

export const DetailHeaderTypeMark = ({
  emoji,
  mark,
  sizeClass = 'h-9 w-9',
}: {
  emoji: string;
  mark?: DetailHeaderMark;
  sizeClass?: string;
}) => (
  <span
    className={`flex shrink-0 items-center justify-center rounded-lg bg-neutral-100 ring-1 ring-black/5 ${sizeClass}`}
    aria-hidden
  >
    {mark ? (
      <HeaderChromeLucideMark mark={mark} />
    ) : (
      <span className="font-emoji text-xl leading-none">{emoji}</span>
    )}
  </span>
);

/** Center title on entity detail sticky headers (activity, trail, camp, …). */
export const DetailHeaderChromeTitle = ({ emoji, label, mark }: DetailHeaderChromeTitleProps) => (
  <p className={DETAIL_HEADER_CHROME_ROW_CLASS} title={label}>
    {mark ? (
      <HeaderChromeLucideMark mark={mark} />
    ) : (
      <span className={DETAIL_HEADER_CHROME_EMOJI_CLASS} aria-hidden>
        {emoji}
      </span>
    )}
    <span className="truncate">{label}</span>
  </p>
);
