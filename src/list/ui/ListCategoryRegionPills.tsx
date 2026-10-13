import { LIST_CHIP_SCROLL, listCategoryPillClass } from '../listChromeTheme';
import { LIST_VENUE_REGION_PILLS, toggleListVenueRegion } from '../listCategoryFilterPills';

interface ListCategoryRegionPillsProps {
  selected: string[];
  onChange: (regions: string[]) => void;
}

/** Multi-select emirate / area chips for Places (and shop) browse. */
export const ListCategoryRegionPills = ({ selected, onChange }: ListCategoryRegionPillsProps) => (
  <div className={`${LIST_CHIP_SCROLL} gap-2 pb-0.5 pt-2`}>
    {LIST_VENUE_REGION_PILLS.map((region) => {
      const active = selected.includes(region);
      const label = region === 'RAK' ? 'RAK' : region;
      return (
        <button
          key={region}
          type="button"
          onClick={() => onChange(toggleListVenueRegion(selected, region))}
          className={listCategoryPillClass(active)}
          aria-pressed={active}
        >
          {label}
        </button>
      );
    })}
  </div>
);
