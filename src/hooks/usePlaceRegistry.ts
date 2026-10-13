import { useEffect, useState } from 'react';
import type { PlaceDTO } from '@uaetrail/shared-types';
import {
  fetchPlaceRegistryCatalog,
  type PlaceRegistryQuery,
} from './placeCatalogApi';

type UsePlaceRegistryOptions = PlaceRegistryQuery & {
  enabled?: boolean;
};

/** React hook over {@link fetchPlaceRegistryCatalog} — venue catalog for place pickers. */
export const usePlaceRegistry = ({
  enabled = true,
  placeType,
  countryCode,
}: UsePlaceRegistryOptions): PlaceDTO[] => {
  const [places, setPlaces] = useState<PlaceDTO[]>([]);

  useEffect(() => {
    if (!enabled) {
      setPlaces([]);
      return;
    }

    let disposed = false;

    void fetchPlaceRegistryCatalog({ placeType, countryCode })
      .then((data) => {
        if (!disposed) setPlaces(data);
      })
      .catch(() => {
        if (!disposed) setPlaces([]);
      });

    return () => {
      disposed = true;
    };
  }, [enabled, placeType, countryCode]);

  return places;
};
