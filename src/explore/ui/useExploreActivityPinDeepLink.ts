import { useCallback, type Dispatch, type SetStateAction } from 'react';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { resolveActivityDisplayCoordinates } from '@uaetrail/shared-types';
import { buildExploreMapItemFromActivity } from '../privateActivityExploreItem';
import {
  findExploreMapItemForPinId,
  resolveActivityIdForExplorePinId,
} from '../exploreMapPinResolve';
import { fetchPublicActivityDetail } from '../../hooks/usePublicActivityDetail';

export type ActivityPinDeepLinkResult = 'opened' | 'not_activity' | 'auth_required' | 'denied' | 'error';

type Args = {
  items: ExploreMapItemDTO[];
  user: { id: string } | null | undefined;
  isDesktop: boolean;
  setListOpen: (open: boolean) => void;
  setLinkOnlyPeekItems: Dispatch<SetStateAction<ExploreMapItemDTO[]>>;
  setSelectedId: (id: string | null) => void;
  setDemandNotice: (message: string | null) => void;
  handleFocusMapLocation: (coords: { lat: number; lng: number }) => void;
  openItem: (item: ExploreMapItemDTO) => void;
};

/** `?pin=` activity deep link open (C18; S10d — no whole `browse` in deps). */
export const useExploreActivityPinDeepLink = ({
  items,
  user,
  isDesktop,
  setListOpen,
  setLinkOnlyPeekItems,
  setSelectedId,
  setDemandNotice,
  handleFocusMapLocation,
  openItem,
}: Args) => {
  const tryOpenActivityPinDeepLink = useCallback(
    async (mapItemId: string): Promise<ActivityPinDeepLinkResult> => {
      const existing = findExploreMapItemForPinId(items, mapItemId);
      if (existing) {
        openItem(existing);
        return 'opened';
      }

      const activityId = resolveActivityIdForExplorePinId(items, mapItemId);
      if (!activityId) return 'not_activity';
      if (!user) return 'auth_required';

      try {
        const detail = await fetchPublicActivityDetail(activityId);
        if (detail.viewerAccess?.exposure === 'none') {
          setDemandNotice(
            detail.activity.message ??
              'This private plan is only available to signed-in members with the link.'
          );
          return 'denied';
        }
        const peekItem = buildExploreMapItemFromActivity(detail.activity, detail.viewerAccess);
        setLinkOnlyPeekItems((prev) => {
          const rest = prev.filter((entry) => entry.id !== peekItem.id);
          return [...rest, peekItem];
        });
        const { latitude, longitude } = resolveActivityDisplayCoordinates(detail.activity);
        if (latitude != null && longitude != null) {
          handleFocusMapLocation({ lat: latitude, lng: longitude });
        }
        setSelectedId(peekItem.id);
        if (!isDesktop) {
          setListOpen(false);
        }
        return 'opened';
      } catch {
        setDemandNotice('Could not open this plan — check the link or try again.');
        return 'error';
      }
    },
    [
      items,
      openItem,
      user,
      setLinkOnlyPeekItems,
      handleFocusMapLocation,
      setSelectedId,
      isDesktop,
      setListOpen,
      setDemandNotice,
    ]
  );

  return { tryOpenActivityPinDeepLink };
};
