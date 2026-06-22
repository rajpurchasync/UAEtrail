interface ChipOption<T extends string> {
  key: T;
  label: string;
}

interface FilterChipsProps<T extends string> {
  options: ChipOption<T>[];
  value: T;
  onChange: (key: T) => void;
  className?: string;
  /** Use dark active state for secondary nav (e.g. My Trips) */
  variant?: 'brand' | 'neutral';
}

/** Compact horizontal filter chips — standard across consumer pages. */
export function FilterChips<T extends string>({
  options,
  value,
  onChange,
  className = '',
  variant = 'brand',
}: FilterChipsProps<T>) {
  const activeClass = variant === 'neutral' ? 'app-chip-active-neutral' : 'app-chip-active';

  return (
    <div className={`app-chip-row ${className}`} role="tablist">
      {options.map((opt) => {
        const active = opt.key === value;
        return (
          <button
            key={opt.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.key)}
            className={active ? activeClass : 'app-chip-inactive'}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/** @deprecated Use FilterChips */
export const PillTabs = FilterChips;

interface MultiChipOption {
  key: string;
  label: string;
}

interface MultiFilterChipsProps {
  options: MultiChipOption[];
  selected: Set<string>;
  onToggle: (key: string) => void;
  className?: string;
}

/** Toggle filter chips — multiple can be active at once. */
export function MultiFilterChips({
  options,
  selected,
  onToggle,
  className = '',
}: MultiFilterChipsProps) {
  return (
    <div className={`app-chip-row flex-wrap ${className}`} role="group" aria-label="Filters">
      {options.map((opt) => {
        const active = selected.has(opt.key);
        return (
          <button
            key={opt.key}
            type="button"
            aria-pressed={active}
            onClick={() => onToggle(opt.key)}
            className={active ? 'app-chip-active' : 'app-chip-inactive'}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
