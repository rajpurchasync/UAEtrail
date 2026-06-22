interface Segment<T extends string> {
  key: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  segments: Segment<T>[];
  value: T;
  onChange: (key: T) => void;
  className?: string;
}

/** @deprecated Prefer AppSegmented */
export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
  className = '',
}: SegmentedControlProps<T>) {
  return (
    <div className={`app-segmented ${className}`} role="tablist">
      {segments.map((seg) => {
        const active = seg.key === value;
        return (
          <button
            key={seg.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(seg.key)}
            className={active ? 'app-segment-active' : 'app-segment'}
          >
            {seg.label}
          </button>
        );
      })}
    </div>
  );
}
