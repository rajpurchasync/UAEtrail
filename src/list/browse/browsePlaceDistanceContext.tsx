import { createContext, useContext, type ReactNode } from 'react';
import type { UnitSystem } from '../../preferences/displayPreferences';
import { distanceMeters, formatPlaceDistance, type ViewerFix } from './placeDistance';

type PlaceDistanceValue = {
  viewer: ViewerFix | null;
  units: UnitSystem;
};

const PlaceDistanceContext = createContext<PlaceDistanceValue>({ viewer: null, units: 'metric' });

export const BrowsePlaceDistanceProvider = ({
  viewer,
  units,
  children,
}: PlaceDistanceValue & { children: ReactNode }) => (
  <PlaceDistanceContext.Provider value={{ viewer, units }}>{children}</PlaceDistanceContext.Provider>
);

export const useBrowsePlaceDistanceLabel = (lat?: number | null, lng?: number | null): string | null => {
  const { viewer, units } = useContext(PlaceDistanceContext);
  if (!viewer || lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return formatPlaceDistance(distanceMeters(viewer, lat, lng), units);
};