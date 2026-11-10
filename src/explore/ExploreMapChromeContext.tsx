import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';

type ListHoverHandler = (id: string | null) => void;

type ExploreMapChromeContextValue = {
  requestClosePeek: () => void;
  bindClosePeek: (handler: (() => void) | null) => void;
  setListHoverExploreItemId: (id: string | null) => void;
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
  const setListHoverExploreItemId = useCallback((id: string | null) => {
    for (const handler of listHoverHandlersRef.current) {
      handler(id);
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
