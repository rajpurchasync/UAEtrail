import { useCallback, useState, type ChangeEvent } from 'react';
import { Minus, Plus } from 'lucide-react';
import {
  GROUP_JOIN_EDIT_LEAD,
  GROUP_JOIN_JOIN_LEAD,
  GROUP_JOIN_KIDS_NOT_ALLOWED,
  GROUP_JOIN_SECTION_LABEL,
} from '../../content/groupJoinCopy';

const ADULTS_MIN = 1;
const ADULTS_MAX = 6;
const KIDS_MIN = 0;
const KIDS_MAX = 4;

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

const PartySizeCounter = ({
  label,
  value,
  min,
  max,
  onChange,
  className = '',
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
  className?: string;
}) => {
  const [draft, setDraft] = useState<string | null>(null);
  const display = draft ?? String(value);

  const commit = useCallback(
    (raw: string) => {
      const parsed = Number.parseInt(raw, 10);
      if (!Number.isFinite(parsed)) {
        setDraft(null);
        return;
      }
      const next = clamp(parsed, min, max);
      setDraft(null);
      if (next !== value) onChange(next);
    },
    [max, min, onChange, value]
  );

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setDraft(event.target.value);
  };

  return (
    <div className={`flex items-center justify-between gap-2 ${className}`}>
      <span className="shrink-0 text-[10px] font-medium text-neutral-500">{label}</span>
      <div className="flex items-center rounded-lg border border-neutral-200/90 bg-white dark:border-neutral-600 dark:bg-neutral-900">
        <button
          type="button"
          aria-label={`Decrease ${label.toLowerCase()}`}
          disabled={value <= min}
          onClick={() => onChange(clamp(value - 1, min, max))}
          className="inline-flex h-8 w-8 items-center justify-center rounded-l-lg text-neutral-600 hover:bg-neutral-50 disabled:opacity-35 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          <Minus className="h-3.5 w-3.5" aria-hidden />
        </button>
        <input
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          aria-label={label}
          value={display}
          onChange={onInputChange}
          onBlur={() => commit(display)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.currentTarget.blur();
            }
          }}
          className="h-8 w-9 border-x border-neutral-200/90 bg-transparent text-center text-xs font-semibold tabular-nums text-neutral-900 [appearance:textfield] dark:border-neutral-600 dark:text-neutral-100 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <button
          type="button"
          aria-label={`Increase ${label.toLowerCase()}`}
          disabled={value >= max}
          onClick={() => onChange(clamp(value + 1, min, max))}
          className="inline-flex h-8 w-8 items-center justify-center rounded-r-lg text-neutral-600 hover:bg-neutral-50 disabled:opacity-35 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>
    </div>
  );
};

/** Adults / kids — join modal and desktop action aside (plan §12). */
export const PartySizeSelect = ({
  adults,
  kids,
  onAdults,
  onKids,
  compact = false,
  embedded = false,
  joined = false,
  horizontal = false,
  kidsAllowed = true,
}: {
  adults: number;
  kids: number;
  onAdults: (n: number) => void;
  onKids: (n: number) => void;
  compact?: boolean;
  /** Inside action card — omit outer frame (parent provides border). */
  embedded?: boolean;
  /** After join — adults fixed; prompt to add kids / family. */
  joined?: boolean;
  /** Mobile footer — adults and kids on one row. */
  horizontal?: boolean;
  kidsAllowed?: boolean;
}) => (
  <div
    className={
      embedded
        ? horizontal
          ? 'space-y-1.5'
          : 'space-y-2'
        : compact
          ? 'space-y-2 rounded-xl border border-neutral-200/80 bg-neutral-50/80 p-2 dark:border-neutral-700 dark:bg-neutral-900/40'
          : 'space-y-3'
    }
    data-group-join-select={embedded ? undefined : true}
  >
  {horizontal ? (
    <>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        {GROUP_JOIN_SECTION_LABEL}
      </p>
      <p className="text-[10px] leading-snug text-neutral-500 dark:text-neutral-400">
        {joined ? GROUP_JOIN_EDIT_LEAD : GROUP_JOIN_JOIN_LEAD}
      </p>
      <div className="flex min-w-0 items-center gap-2">
        {joined ? (
          <p className="min-w-0 flex-1 text-[10px] leading-snug text-neutral-500 dark:text-neutral-400">
            You{adults > 1 ? ` + ${adults - 1} adult${adults - 1 === 1 ? '' : 's'}` : ''}
          </p>
        ) : (
          <PartySizeCounter
            className="min-w-0 flex-1"
            label="Adults"
            value={adults}
            min={ADULTS_MIN}
            max={ADULTS_MAX}
            onChange={onAdults}
          />
        )}
        <PartySizeCounter
          className="min-w-0 flex-1"
          label="Kids"
          value={kids}
          min={KIDS_MIN}
          max={kidsAllowed ? KIDS_MAX : 0}
          onChange={onKids}
        />
      </div>
      {!kidsAllowed ? (
        <p className="text-[10px] font-medium text-amber-800 dark:text-amber-200">
          {GROUP_JOIN_KIDS_NOT_ALLOWED}
        </p>
      ) : null}
    </>
  ) : (
    <>
      <p className={`font-semibold text-neutral-700 dark:text-neutral-200 ${compact ? 'text-[11px]' : 'text-xs'}`}>
        {GROUP_JOIN_SECTION_LABEL}
      </p>
      <p className="text-[10px] leading-snug text-neutral-500 dark:text-neutral-400">
        {joined ? GROUP_JOIN_EDIT_LEAD : GROUP_JOIN_JOIN_LEAD}
      </p>
      {!joined ? (
        <PartySizeCounter
          label="Adults"
          value={adults}
          min={ADULTS_MIN}
          max={ADULTS_MAX}
          onChange={onAdults}
        />
      ) : (
        <p className="text-[10px] leading-snug text-neutral-500 dark:text-neutral-400">
          You{adults > 1 ? ` + ${adults - 1} adult${adults - 1 === 1 ? '' : 's'}` : ''}
        </p>
      )}
      <PartySizeCounter
        label="Kids"
        value={kids}
        min={KIDS_MIN}
        max={kidsAllowed ? KIDS_MAX : 0}
        onChange={onKids}
      />
      {!kidsAllowed ? (
        <p className="text-[10px] font-medium text-amber-800 dark:text-amber-200">
          {GROUP_JOIN_KIDS_NOT_ALLOWED}
        </p>
      ) : null}
    </>
  )}
  </div>
);
