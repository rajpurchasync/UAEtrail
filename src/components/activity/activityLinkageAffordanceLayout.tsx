import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';

/** Shared sky linked-plan / rideshare card body (peek + consumer detail). */
export const ActivityLinkageAffordanceBody = ({
  eyebrow,
  title,
  metaLine,
  blurb,
  ctaLabel,
  trailing,
}: {
  eyebrow: string;
  title?: string | null;
  metaLine?: string | null;
  blurb?: string | null;
  ctaLabel: string;
  trailing?: ReactNode;
}) => (
  <>
    <div className="flex items-start gap-2.5">
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-800/90">{eyebrow}</p>
        {title ? (
          <p className="mt-1 text-[15px] font-semibold leading-snug text-neutral-950">{title}</p>
        ) : null}
        {metaLine ? (
          <p className="mt-1 text-sm font-medium text-neutral-600">{metaLine}</p>
        ) : null}
        {blurb ? (
          <p className="mt-2 text-sm leading-relaxed text-neutral-700 line-clamp-3">{blurb}</p>
        ) : null}
      </div>
      {trailing ?? <ChevronRight className="mt-0.5 h-5 w-5 shrink-0 text-sky-600/80" aria-hidden />}
    </div>
    <p className="mt-3 flex items-center gap-1 border-t border-sky-200/70 pt-2.5 text-sm font-semibold text-sky-800">
      {ctaLabel}
      <ChevronRight className="h-4 w-4" aria-hidden />
    </p>
  </>
);
