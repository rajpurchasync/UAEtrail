import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';

export type ExploreMapHoverPoint = {
  lat: number;
  lng: number;
  /** Used when injecting a temporary hover pin not yet in the map cluster. */
  activityType?: import('../components/ui/mapPinTypes').MapPinKind;
};

/** `point` is the hovered card's map coordinate, so the map can pan before that pin is loaded. */
type ListHoverHandler = (id: string | null, point?: ExploreMapHoverPoint | null) => void;

type ExploreMapChromeContextValue = {
  requestClosePeek: () => void;
  bindClosePeek: (handler: (() => void) | null) => void;
  setListHoverExploreItemId: (id: string | null, point?: ExploreMapHoverPoint | null) => void;
  /** Subscribe to list hover; returned cleanup removes only this listener. */
  subscribeListHover: (handler: ListHoverHandler) => () => void;
};

const ExploreMapChromeContext = createContext<ExploreMapChromeContextValue | null>(null);

/** Lets layout chrome (mobile header) dismiss the map peek owned by ExploreExperience. */
export const ExploreMapChromeProvider = ({ children }: { children: ReactNode }) => {
  const closeRef = useRef<(() => void) | null>(null);
  const listHoverHandlersRef = useRef(new Set<ListHoverHandler>());
  const bindClosePeek = useCallback((handler: (() => void) | null) => {
    closeRef.current = handler;
  }, []);
  const requestClosePeek = useCallback(() => {
    closeRef.current?.();
  }, []);
  const subscribeListHover = useCallback((handler: ListHoverHandler) => {
    listHoverHandlersRef.current.add(handler);
    return () => {
      listHoverHandlersRef.current.delete(handler);
    };
  }, []);
  const setListHoverExploreItemId = useCallback((id: string | null, point?: ExploreMapHoverPoint | null) => {
    for (const handler of listHoverHandlersRef.current) {
      handler(id, point ?? null);
    }
  }, []);
  const value = useMemo(
    () => ({ requestClosePeek, bindClosePeek, setListHoverExploreItemId, subscribeListHover }),
    [requestClosePeek, bindClosePeek, setListHoverExploreItemId, subscribeListHover]
  );
  return (
    <ExploreMapChromeContext.Provider value={value}>{children}</ExploreMapChromeContext.Provider>
  );
};

export const useExploreMapChrome = () => useContext(ExploreMapChromeContext);

export const useBindExploreMapClosePeek = (closePeek: () => void) => {
  const chrome = useExploreMapChrome();
  useEffect(() => {
    if (!chrome) return;
    chrome.bindClosePeek(closePeek);
    return () => chrome.bindClosePeek(null);
  }, [chrome, closePeek]);
};

export const useBindExploreListMapHover = (onHover: ListHoverHandler | null | undefined) => {
  const chrome = useExploreMapChrome();
  useEffect(() => {
    if (!chrome || !onHover) return;
    return chrome.subscribeListHover(onHover);
  }, [chrome, onHover]);
};
