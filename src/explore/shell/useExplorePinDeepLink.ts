import { useEffect, useRef } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import type { SetURLSearchParams } from 'react-router-dom';
import { exploreMapItemIsSeeking, type ExploreMapItemDTO } from '@uaetrail/shared-types';
import { buildSignInRedirect } from '../../utils/authReturnContext';
import {
  EXPLORE_JOIN_INVITE_QUERY_KEY,
  parseExploreJoinInvitePeek,
  parseExplorePinMapItemId,
} from '../routing';
import { findExploreMapItemForPinId } from '../exploreMapPinResolve';

type SelectionApi = {
  openItem: (item: ExploreMapItemDTO) => void;
  tryOpenActivityPinDeepLink: (
    pinId: string
  ) => Promise<'opened' | 'not_activity' | 'auth_required' | 'denied' | 'error'>;
};

type Args = {
  loading: boolean;
  searchParams: URLSearchParams;
  setSearchParams: SetURLSearchParams;
  selectionItems: ExploreMapItemDTO[];
  selection: SelectionApi;
  navigate: NavigateFunction;
  pathname: string;
  search: string;
  hostComposeKind: string | null | undefined;
  rideshareLinkSeeking: ExploreMapItemDTO | null;
  setRideshareLinkSeeking: (item: ExploreMapItemDTO | null) => void;
  setJoinInvitePeekActivityId: (id: string | null) => void;
};

/** `?pin=` and demand→rideshare compose deep links (R2 shell). */
export const useExplorePinDeepLink = ({
  loading,
  searchParams,
  setSearchParams,
  selectionItems,
  selection,
  navigate,
  pathname,
  search,
  hostComposeKind,
  rideshareLinkSeeking,
  setRideshareLinkSeeking,
  setJoinInvitePeekActivityId,
}: Args) => {
  const deepLinkPinId = parseExplorePinMapItemId(searchParams);
  const joinInviteFromUrl = parseExploreJoinInvitePeek(searchParams);
  const openedDeepLinkPinRef = useRef<string | null>(null);

  useEffect(() => {
    if (!deepLinkPinId?.startsWith('demand:') || rideshareLinkSeeking || loading) return;
    if (hostComposeKind !== 'rideshare') return;
    const item = findExploreMapItemForPinId(selectionItems, deepLinkPinId);
    if (item && exploreMapItemIsSeeking(item)) {
      setRideshareLinkSeeking(item);
    }
  }, [
    deepLinkPinId,
    rideshareLinkSeeking,
    loading,
    hostComposeKind,
    selectionItems,
    setRideshareLinkSeeking,
  ]);

  useEffect(() => {
    if (!deepLinkPinId || loading) return;
    if (openedDeepLinkPinRef.current === deepLinkPinId) return;

    const clearPinParam = () => {
      openedDeepLinkPinRef.current = deepLinkPinId;
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete('pin');
          next.delete(EXPLORE_JOIN_INVITE_QUERY_KEY);
          return next;
        },
        { replace: true }
      );
    };

    const captureJoinInvitePeek = () => {
      if (!joinInviteFromUrl || !deepLinkPinId.startsWith('activity:')) return;
      setJoinInvitePeekActivityId(deepLinkPinId.slice('activity:'.length));
    };

    const item = findExploreMapItemForPinId(selectionItems, deepLinkPinId);
    if (item) {
      selection.openItem(item);
      captureJoinInvitePeek();
      clearPinParam();
      return;
    }

    void selection.tryOpenActivityPinDeepLink(deepLinkPinId).then((result) => {
      if (result === 'opened') {
        captureJoinInvitePeek();
        clearPinParam();
        return;
      }
      if (result === 'auth_required') {
        navigate(buildSignInRedirect({ pathname, search }).href);
      }
    });
  }, [
    deepLinkPinId,
    loading,
    selectionItems,
    selection,
    setSearchParams,
    navigate,
    pathname,
    search,
    joinInviteFromUrl,
    setJoinInvitePeekActivityId,
  ]);
};
