import { useCallback, useEffect, useRef, useState } from 'react';
import { GEO_CATALOG_PAGE_SIZE, geoHierarchyApi } from '../api/domains/geoHierarchy';
import type { GeoCatalogActivity, GeoCatalogPlace } from './geoHeroPhotos';

type PageState<T> = {
  items: T[];
  nextCursor: string | null;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
};

const emptyState = <T,>(): PageState<T> => ({
  items: [],
  nextCursor: null,
  loading: false,
  loadingMore: false,
  error: null,
});

const useGeoPagedList = <T,>(
  enabled: boolean,
  nodeId: string | null,
  fetchPage: (id: string, cursor?: string) => Promise<{ items: T[]; nextCursor: string | null }>
): PageState<T> & { loadMore: () => void } => {
  const [state, setState] = useState<PageState<T>>(emptyState);
  const inflight = useRef(0);
  const loadedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!nodeId || !enabled) {
      loadedFor.current = null;
      setState(emptyState());
      return;
    }
    if (loadedFor.current === nodeId) return;
    const seq = ++inflight.current;
    setState({ items: [], nextCursor: null, loading: true, loadingMore: false, error: null });
    void fetchPage(nodeId)
      .then((page) => {
        if (inflight.current !== seq) return;
        loadedFor.current = nodeId;
        setState({
          items: page.items,
          nextCursor: page.nextCursor,
          loading: false,
          loadingMore: false,
          error: null,
        });
      })
      .catch((err: unknown) => {
        if (inflight.current !== seq) return;
        setState({
          items: [],
          nextCursor: null,
          loading: false,
          loadingMore: false,
          error: err instanceof Error ? err.message : 'Could not load',
        });
      });
  }, [enabled, nodeId, fetchPage]);

  const loadMore = useCallback(() => {
    if (!enabled || !nodeId || !state.nextCursor || state.loading || state.loadingMore) return;
    const cursor = state.nextCursor;
    const seq = inflight.current;
    setState((prev) => ({ ...prev, loadingMore: true }));
    void fetchPage(nodeId, cursor)
      .then((page) => {
        if (inflight.current !== seq) return;
        setState((prev) => ({
          items: [...prev.items, ...page.items],
          nextCursor: page.nextCursor,
          loading: false,
          loadingMore: false,
          error: null,
        }));
      })
      .catch((err: unknown) => {
        if (inflight.current !== seq) return;
        setState((prev) => ({
          ...prev,
          loadingMore: false,
          error: err instanceof Error ? err.message : 'Could not load more',
        }));
      });
  }, [enabled, nodeId, fetchPage, state.nextCursor, state.loading, state.loadingMore]);

  return { ...state, loadMore };
};

const fetchPlacesPage = (id: string, cursor?: string) =>
  geoHierarchyApi.listGeoPlaces(id, { cursor, limit: GEO_CATALOG_PAGE_SIZE }).then((res) => ({
    items: (res.data.items ?? []) as GeoCatalogPlace[],
    nextCursor: res.data.nextCursor ?? null,
  }));

const fetchActivitiesPage = (id: string, cursor?: string) =>
  geoHierarchyApi.listGeoActivities(id, { cursor, limit: GEO_CATALOG_PAGE_SIZE }).then((res) => ({
    items: (res.data.items ?? []) as GeoCatalogActivity[],
    nextCursor: res.data.nextCursor ?? null,
  }));

export const useGeoPagedPlaces = (nodeId: string | null, enabled: boolean) =>
  useGeoPagedList<GeoCatalogPlace>(enabled, nodeId, fetchPlacesPage);

export const useGeoPagedActivities = (nodeId: string | null, enabled: boolean) =>
  useGeoPagedList<GeoCatalogActivity>(enabled, nodeId, fetchActivitiesPage);
