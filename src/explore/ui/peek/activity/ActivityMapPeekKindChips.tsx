import { Car, Route, Users, type LucideIcon } from 'lucide-react';
import type { ActivityMapPeekStatChip } from '../../../../activity/resolveActivityMapPeekStatChips';
import { EXPLORE_PEEK } from '../../../../config/exploreTheme';

const chipIcon = (icon: ActivityMapPeekStatChip['icon']): LucideIcon => {
  switch (icon) {
    case 'carpool':
      return Car;
    case 'route':
      return Route;
    case 'spots':
      return Users;
    default:
      return Route;
  }
};

const toneClass = (tone: ActivityMapPeekStatChip['tone']) => {
  switch (tone) {
    case 'accent':
      return 'bg-emerald-50 text-emerald-900 ring-1 ring-emerald-100';
    case 'sky':
      return 'bg-teal-50 text-teal-900 ring-1 ring-teal-100';
    default:
      return 'bg-neutral-100 text-neutral-800';
  }
};

export const ActivityMapPeekKindChips = ({ chips }: { chips: ActivityMapPeekStatChip[] }) => {
  if (chips.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-1" aria-label="Trip type details">
      {chips.map((chip) => {
        const Icon = chipIcon(chip.icon);
        return (
          <li key={chip.id} className={`${EXPLORE_PEEK.tripStatChip} ${toneClass(chip.tone)}`}>
            <Icon className="h-3 w-3 shrink-0 opacity-75" strokeWidth={2.25} aria-hidden />
            <span className="truncate">{chip.label}</span>
          </li>
        );
      })}
    </ul>
  );
};