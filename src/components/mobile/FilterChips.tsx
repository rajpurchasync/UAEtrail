import { useRef } from 'react';

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
  const rowRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ active: boolean; x: number }>({ active: false, x: 0 });
  const activeClass = variant === 'neutral' ? 'app-chip-active-neutral' : 'app-chip-active';

  const handleWheel: React.WheelEventHandler<HTMLDivElement> = (event) => {
    const row = rowRef.current;
    if (!row) return;
    const canScrollX = row.scrollWidth > row.clientWidth;
    if (!canScrollX) return;
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
    row.scrollLeft += event.deltaY;
  };

  const handlePointerDown: React.PointerEventHandler<HTMLDivElement> = (event) => {
    if (event.pointerType === 'touch') return;
    if (!rowRef.current || rowRef.current.scrollWidth <= rowRef.current.clientWidth) return;
    dragRef.current = { active: true, x: event.clientX };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove: React.PointerEventHandler<HTMLDivElement> = (event) => {
    const row = rowRef.current;
    if (!row || !dragRef.current.active) return;
    const deltaX = event.clientX - dragRef.current.x;
    dragRef.current.x = event.clientX;
    row.scrollLeft -= deltaX;
  };

  const stopDragging = () => {
    dragRef.current.active = false;
  };

  return (
    <div
      ref={rowRef}
      className={`app-chip-row ${className}`}
      role="tablist"
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={stopDragging}
      onPointerCancel={stopDragging}
    >
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
