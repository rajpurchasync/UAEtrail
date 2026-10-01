import type { TripsHubLayer } from '../../trips/tripsRouting';
import { TRIPS_HUB_LAYER_PILLS } from '../../trips/tripsRouting';
import { FilterChips } from '../mobile/FilterChips';

type TripsHubLayerPillsProps = {
  activeId: TripsHubLayer;
  onChange: (layer: TripsHubLayer) => void;
};

/** Personal wishlist layers on Trips (Trips · Places · Shops). Public “Looking for” is Explore-only. */
export const TripsHubLayerPills = ({ activeId, onChange }: TripsHubLayerPillsProps) => (
  <FilterChips
    variant="brand"
    options={TRIPS_HUB_LAYER_PILLS.map((pill) => ({ key: pill.id, label: pill.label }))}
    value={activeId}
    onChange={onChange}
  />
);
