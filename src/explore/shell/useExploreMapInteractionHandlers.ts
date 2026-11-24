import { useCallback } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import type { QueryClient } from '@tanstack/react-query';
import { areaDetailPath } from '@uaetrail/shared-types';
import type { PlaceMapPin } from '../../components/ui/PlacesMap';
import { reloadExploreMap } from '../../hooks/useExploreMap';
import { resolveExploreItemIdFromMapPin } from '../ui/exploreMapPinModel';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';

type Selection = {
  openItem: (item: ExploreMapItemDTO) => void;
};

export const useExploreMapInteractionHandlers = (
  queryClient: QueryClient,
  selectionItems: ExploreMapItemDTO[],
  selection: Selection,
  navigate: NavigateFunction
) => {
  const reloadMap = useCallback(() => {
    void reloadExploreMap(queryClient);
  }, [queryClient]);

  const handleMapPinClick = useCallback(
    (pin: PlaceMapPin) => {
      const itemId = resolveExploreItemIdFromMapPin(pin);
      const item = selectionItems.find((entry) => entry.id === itemId);
      if (item) selection.openItem(item);
    },
    [selectionItems, selection]
  );

  const handlePickExploreArea = useCallback(
    (slug: string) => {
      navigate(areaDetailPath(slug));
    },
    [navigate]
  );

  return { reloadMap, handleMapPinClick, handlePickExploreArea };
};