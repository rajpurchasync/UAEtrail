import { Mountain } from 'lucide-react';

type UaeTrailBrandMarkProps = {
  /** `sm` matches mobile tab header; `md` for drawers and marketing rows; `inline` for quotes. */
  size?: 'sm' | 'md' | 'inline';
  tone?: 'dark' | 'light';
  className?: string;
  /** Defaults to spaced wordmark; pass `UAETrail` where the product title is required. */
  wordmark?: string;
};

/** Logo + wordmark — same gradient mark as explore tab header and auth shells. */
export const UaeTrailBrandMark = ({
  size = 'sm',
  tone = 'dark',
  className = '',
  wordmark = 'UAE Trail',
}: UaeTrailBrandMarkProps) => {
  const box =
    size === 'md' ? 'h-9 w-9 rounded-lg' : size === 'inline' ? 'h-5 w-5 rounded-md' : 'h-8 w-8 rounded-lg';
  const icon = size === 'md' ? 'h-[18px] w-[18px]' : size === 'inline' ? 'h-3 w-3' : 'h-4 w-4';
  const text = size === 'md' ? 'text-base' : size === 'inline' ? 'text-[0.95em] leading-none' : 'text-sm';
  const gap = size === 'inline' ? 'gap-1' : 'gap-2';
  const wordmarkClass = tone === 'light' ? 'text-white' : 'text-gray-900 dark:text-neutral-50';

  return (
    <span className={`inline-flex min-w-0 items-center ${gap} ${className}`}>
      <span
        className={`flex shrink-0 items-center justify-center bg-gradient-to-br from-emerald-400 to-emerald-700 ${box}`}
        aria-hidden
      >
        <Mountain className={`${icon} text-white`} strokeWidth={2.25} />
      </span>
      <span className={`truncate font-bold tracking-tight ${wordmarkClass} ${text}`}>{wordmark}</span>
    </span>
  );
};
