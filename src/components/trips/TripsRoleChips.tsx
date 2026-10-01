import type { TripsRole } from '../../trips/tripsRouting';

type TripsRoleChipsProps = {
  chips: { id: TripsRole; label: string }[];
  activeId: TripsRole;
  onChange: (id: TripsRole) => void;
};

/** Secondary trips role filter — brand chips (emerald active). */
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
            className={active ? 'app-chip-active' : 'app-chip-inactive'}
          >
            {chip.label}
          </button>
        );
      })}
    </div>
  );
};
