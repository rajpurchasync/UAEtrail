import { useCallback, useRef, type KeyboardEvent } from 'react';
import { UaeEmirateFlagIcon, type HomeEmirateFilterId } from './UaeEmirateFlagIcon';

export interface EmirateChipOption {
  id: string;
  label: string;
  count?: number;
}

export interface EmirateChipsProps {
  options: EmirateChipOption[];
  value: string;
  onChange: (id: string) => void;
  'aria-label'?: string;
}

const isEmirateId = (id: string): id is HomeEmirateFilterId =>
  id === 'all' ||
  id === 'dubai' ||
  id === 'abu-dhabi' ||
  id === 'sharjah' ||
  id === 'rak' ||
  id === 'fujairah' ||
  id === 'ajman' ||
  id === 'uaq';

export const EmirateChips = ({
  options,
  value,
  onChange,
  'aria-label': ariaLabel = 'Filter by emirate'
}: EmirateChipsProps) => {
  const listRef = useRef<HTMLDivElement>(null);

  const onKeyDown = useCallback(
    (event: KeyboardEvent, index: number) => {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
      event.preventDefault();
      const delta = event.key === 'ArrowRight' ? 1 : -1;
      const next = (index + delta + options.length) % options.length;
      onChange(options[next].id);
      const buttons = listRef.current?.querySelectorAll<HTMLButtonElement>('button');
      buttons?.[next]?.focus();
    },
    [onChange, options]
  );

  return (
    <div className="relative -mx-[var(--gutter-mobile)] md:mx-0">
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-home-surface to-transparent md:hidden"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-home-surface to-transparent md:hidden"
        aria-hidden
      />
      <div
        ref={listRef}
        role="group"
        aria-label={ariaLabel}
        className="flex gap-2 overflow-x-auto px-[var(--gutter-mobile)] pb-1 scroll-px-[var(--gutter-mobile)] [-ms-overflow-style:none] [scrollbar-width:none] md:flex-wrap md:overflow-visible md:px-0 md:scroll-px-0 [&::-webkit-scrollbar]:hidden"
      >
        {options.map((option, index) => {
          const selected = option.id === value;
          const flagId = isEmirateId(option.id) ? option.id : 'all';
          const countLabel =
            option.count != null ? (
              <span className={selected ? 'text-white/85' : 'text-home-ink/50'}>({option.count})</span>
            ) : null;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(option.id)}
              onKeyDown={(e) => onKeyDown(e, index)}
              className={[
                'home-v2-font home-focus-ring home-motion-safe inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full px-3 py-2 text-[length:var(--text-sm)] font-semibold transition-all duration-[var(--duration-hover)]',
                selected
                  ? 'bg-home-green-600 text-white shadow-md shadow-home-green-600/25 ring-2 ring-home-green-600/20'
                  : 'border border-[var(--gray-200)] bg-white text-home-ink shadow-home-card hover:border-home-green-600/35 hover:bg-home-green-50/80'
              ].join(' ')}
            >
              <UaeEmirateFlagIcon emirateId={flagId} title={option.label} />
              <span className="whitespace-nowrap">{option.label}</span>
              {countLabel}
            </button>
          );
        })}
      </div>
    </div>
  );
};
