import { Mountain } from 'lucide-react';

type UaeTrailBrandMarkProps = {
  /** `sm` matches mobile tab header; `md` for drawers and marketing rows. */
  size?: 'sm' | 'md';
  className?: string;
};

/** Logo + wordmark — same gradient mark as explore tab header and auth shells. */
export const UaeTrailBrandMark = ({ size = 'sm', className = '' }: UaeTrailBrandMarkProps) => {
  const box = size === 'md' ? 'h-9 w-9 rounded-lg' : 'h-8 w-8 rounded-lg';
  const icon = size === 'md' ? 'h-[18px] w-[18px]' : 'h-4 w-4';
  const text = size === 'md' ? 'text-base' : 'text-sm';

  return (
    <span className={`inline-flex min-w-0 items-center gap-2 ${className}`}>
      <span
        className={`flex shrink-0 items-center justify-center bg-gradient-to-br from-emerald-400 to-emerald-700 ${box}`}
        aria-hidden
      >
        <Mountain className={`${icon} text-white`} strokeWidth={2.25} />
      </span>
      <span className={`truncate font-bold tracking-tight text-gray-900 ${text}`}>UAE Trail</span>
    </span>
  );
};
