import { Users } from 'lucide-react';
import { EXPLORE_PEEK } from '../../../../config/exploreTheme';

export const ActivityMapPeekCapacityLine = ({ line }: { line: string | null }) => {
  if (!line) return null;

  return (
    <p className={EXPLORE_PEEK.tripCapacity} data-peek-capacity>
      <Users className="h-3.5 w-3.5 shrink-0 text-emerald-700" aria-hidden />
      <span>{line}</span>
    </p>
  );
};