import type { PlanCommitmentFilter } from '../../plan/planTab';

const FILTERS: { key: PlanCommitmentFilter; label: string }[] = [
  { key: 'hosting', label: 'Hosting' },
  { key: 'joined', label: 'Joined' },
];

type PlanCommitmentFilterProps = {
  value: PlanCommitmentFilter;
  onChange: (value: PlanCommitmentFilter) => void;
  showHosting: boolean;
};

export const PlanCommitmentFilterChips = ({
  value,
  onChange,
  showHosting,
}: PlanCommitmentFilterProps) => {
  const options = showHosting ? FILTERS : FILTERS.filter((f) => f.key === 'joined');

  return (
    <div className="flex gap-2" role="tablist" aria-label="Upcoming filter">
      {options.map((opt) => {
        const active = opt.key === value;
        return (
          <button
            key={opt.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.key)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              active
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-neutral-100 text-neutral-600 active:bg-neutral-200'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};
