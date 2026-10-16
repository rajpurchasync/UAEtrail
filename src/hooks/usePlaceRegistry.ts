import { useEffect, useState } from 'react';
import type { PlaceDTO } from '@uaetrail/shared-types';
import {
  fetchPlaceCatalogRows,
  type PlaceCatalogQuery,
} from './placeCatalogReadsClientApi';

type UsePlaceRegistryOptions = PlaceCatalogQuery & {
  enabled?: boolean;
};

/** React hook over {@link fetchPlaceCatalogRows} — place catalog for pickers. */
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

    void fetchPlaceCatalogRows({ placeType, countryCode })
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
