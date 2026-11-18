import { EXPLORE_PEEK } from '../../../../config/exploreTheme';

export const PlaceMapPeekAmenityChips = ({ labels }: { labels: string[] }) => {
  if (labels.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-1" aria-label="Place features">
      {labels.map((label) => (
        <li key={label} className={`${EXPLORE_PEEK.venueAmenityChip} bg-neutral-100 text-neutral-800`}>
          <span className="truncate">{label}</span>
        </li>
      ))}
    </ul>
  );
};