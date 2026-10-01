import type { TripsRole } from '../../trips/tripsRouting';

type TripsRoleChipsProps = {
  chips: { id: TripsRole; label: string }[];
  activeId: TripsRole;
  onChange: (id: TripsRole) => void;
};

export const TripsRoleChips = ({ chips, activeId, onChange }: TripsRoleChipsProps) => {
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => {
        const active = chip.id === activeId;
        return (
          <button
            key={chip.id}
            type="button"
            onClick={() => onChange(chip.id)}
            className={`min-h-[40px] rounded-full px-3.5 text-sm font-semibold transition active:scale-[0.98] ${
              active ? 'bg-emerald-600 text-white' : 'bg-neutral-100 text-neutral-700 active:bg-neutral-200'
            }`}
          >
            {chip.label}
          </button>
        );
      })}
    </div>
  );
};
