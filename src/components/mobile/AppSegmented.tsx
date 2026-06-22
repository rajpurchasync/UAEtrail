interface SegmentOption<T extends string> {
  key: T;
  label: string;
}

interface AppSegmentedProps<T extends string> {
  segments: SegmentOption<T>[];
  value: T;
  onChange: (key: T) => void;
  className?: string;
}

/** Compact inline segmented control for 2–4 mutually exclusive options. */
export function AppSegmented<T extends string>({
  segments,
  value,
  onChange,
  className = '',
}: AppSegmentedProps<T>) {
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
