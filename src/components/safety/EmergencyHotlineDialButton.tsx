import { useId, useState } from 'react';
import { Phone } from 'lucide-react';
import type { EmergencyHotline } from '../../config/regionEmergencyNumbers';

type EmergencyHotlineDialButtonProps = {
  line: EmergencyHotline;
  compact?: boolean;
};

/** One-tap call with confirmation — avoids accidental dials. */
export const EmergencyHotlineDialButton = ({ line, compact = false }: EmergencyHotlineDialButtonProps) => {
  const dialogId = useId();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const tel = line.number.replace(/[^\d+]/g, '');

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        className={`flex w-full items-center text-left transition hover:border-sky-300 hover:bg-sky-50/50 dark:hover:bg-sky-950/30 ${
          compact
            ? 'gap-2 rounded-lg border border-sky-200/70 bg-white/80 px-2 py-1.5 dark:border-sky-900/50 dark:bg-neutral-900/80'
            : 'gap-3 rounded-xl border border-sky-200/80 bg-white px-3 py-2.5 shadow-sm dark:border-sky-900/60 dark:bg-neutral-950'
        }`}
      >
        <span
          className={`flex shrink-0 items-center justify-center rounded-md bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200 ${
            compact ? 'h-7 w-7' : 'h-9 w-9 rounded-lg'
          }`}
        >
          <Phone className={compact ? 'h-3 w-3' : 'h-4 w-4'} aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={`block font-semibold text-neutral-900 dark:text-neutral-50 ${
              compact ? 'text-[11px] leading-tight' : 'text-sm'
            }`}
          >
            {line.label}
          </span>
          <span className={`text-neutral-600 dark:text-neutral-400 ${compact ? 'text-[10px]' : 'text-xs'}`}>
            {compact ? (
              <span className="font-semibold tabular-nums text-sky-900 dark:text-sky-200">{line.number}</span>
            ) : (
              <>
                {line.description ? `${line.description} · ` : null}
                <span className="font-semibold tabular-nums text-sky-900 dark:text-sky-200">{line.number}</span>
              </>
            )}
          </span>
        </span>
      </button>

      {confirmOpen ? (
        <div
          className="fixed inset-0 z-[2000] flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="presentation"
          onClick={() => setConfirmOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={dialogId}
            className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-lg dark:bg-neutral-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id={dialogId} className="text-base font-semibold text-neutral-900 dark:text-neutral-50">
              Call {line.label}?
            </h3>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              This will open your phone dialer for{' '}
              <span className="font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">{line.number}</span>.
              Only continue if you need emergency help.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="min-h-10 flex-1 rounded-xl border border-neutral-200 px-3 text-sm font-semibold text-neutral-800"
              >
                Cancel
              </button>
              <a
                href={`tel:${tel}`}
                onClick={() => setConfirmOpen(false)}
                className="min-h-10 flex flex-1 items-center justify-center rounded-xl bg-sky-700 px-3 text-sm font-bold text-white"
              >
                Call now
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};
