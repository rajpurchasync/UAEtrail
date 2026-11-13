import { COMPOSE_QUERY_KEY } from '../compose';

const readComposeWire = (search: string): string | null => {
  const raw = search.startsWith('?') ? search.slice(1) : search;
  return new URLSearchParams(raw).get(COMPOSE_QUERY_KEY);
};

/** Keep compose picker mounted when router or the address bar carries the same `?compose=` wire. */
export const composeWireMatchesBrowserLocation = (
  wire: string | null,
  options?: { routerSearch?: string }
): boolean => {
  if (!wire) return false;
  if (typeof window === 'undefined') return true;

  if (readComposeWire(window.location.search) === wire) return true;
  if (options?.routerSearch && readComposeWire(options.routerSearch) === wire) return true;
  return false;
};
