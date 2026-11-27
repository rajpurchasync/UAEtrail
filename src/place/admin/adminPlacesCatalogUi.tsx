/** Shared chip + status UI for the admin places catalog console. */

export const AdminPlacesCatalogStatusBadge = ({ status }: { status: string }) => {
  const labels: Record<string, string> = {
    active: 'Active',
    inactive: 'Inactive',
    draft: 'Pending review',
  };
  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-600',
    draft: 'bg-amber-100 text-amber-800',
  };
  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-medium ${colors[status] ?? 'bg-gray-100 text-gray-600'}`}
    >
      {labels[status] ?? status}
    </span>
  );
};

export const AdminPlacesCatalogChipSelect = ({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (item: string) => void;
}) => (
  <div>
    <label className="text-sm font-medium text-gray-700 mb-2 block">{label}</label>
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            selected.includes(opt)
              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  </div>
);