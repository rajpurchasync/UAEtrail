import { useId, useState } from 'react';

export interface InfoPopoverProps {
  definition: string;
  learnMoreHref?: string;
  learnMoreLabel?: string;
}

export const InfoPopover = ({
  definition,
  learnMoreHref,
  learnMoreLabel = 'Learn more'
}: InfoPopoverProps) => {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        className="home-focus-ring flex h-[var(--touch-min)] w-[var(--touch-min)] items-center justify-center rounded-full text-[length:var(--text-sm)] text-home-ink/70 hover:text-home-ink"
        aria-expanded={open}
        aria-controls={id}
        aria-describedby={open ? id : undefined}
        onClick={() => setOpen((v) => !v)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setOpen(false);
          }
        }}
      >
        <span aria-hidden>ⓘ</span>
        <span className="sr-only">More information</span>
      </button>
      {open ? (
        <div
          id={id}
          role="tooltip"
          className="absolute bottom-full left-1/2 z-10 mb-2 w-56 -translate-x-1/2 rounded-home-sm border border-[var(--gray-200)] bg-home-surface p-3 text-[length:var(--text-sm)] leading-[var(--leading-body)] text-home-ink shadow-home-card"
        >
          <p>{definition}</p>
          {learnMoreHref ? (
            <a
              href={learnMoreHref}
              className="mt-2 inline-block font-medium text-home-green-600 hover:text-home-green-700"
            >
              {learnMoreLabel}
            </a>
          ) : null}
        </div>
      ) : null}
    </span>
  );
};
