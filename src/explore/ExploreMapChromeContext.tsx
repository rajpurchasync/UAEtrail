import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';

type ExploreMapChromeContextValue = {
  requestClosePeek: () => void;
  bindClosePeek: (handler: (() => void) | null) => void;
  setListHoverExploreItemId: (id: string | null) => void;
  bindListHover: (handler: ((id: string | null) => void) | null) => void;
};

const ExploreMapChromeContext = createContext<ExploreMapChromeContextValue | null>(null);

/** Lets layout chrome (mobile header) dismiss the map peek owned by ExploreExperience. */
export const ExploreMapChromeProvider = ({ children }: { children: ReactNode }) => {
  const closeRef = useRef<(() => void) | null>(null);
  const listHoverRef = useRef<((id: string | null) => void) | null>(null);
  const bindClosePeek = useCallback((handler: (() => void) | null) => {
    closeRef.current = handler;
  }, []);
  const requestClosePeek = useCallback(() => {
    closeRef.current?.();
  }, []);
  const bindListHover = useCallback((handler: ((id: string | null) => void) | null) => {
    listHoverRef.current = handler;
  }, []);
  const setListHoverExploreItemId = useCallback((id: string | null) => {
    listHoverRef.current?.(id);
  }, []);
  const value = useMemo(
    () => ({ requestClosePeek, bindClosePeek, setListHoverExploreItemId, bindListHover }),
    [requestClosePeek, bindClosePeek, setListHoverExploreItemId, bindListHover]
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

export const useBindExploreListMapHover = (onHover: (id: string | null) => void) => {
  const chrome = useExploreMapChrome();
  useEffect(() => {
    if (!chrome) return;
    chrome.bindListHover(onHover);
    return () => chrome.bindListHover(null);
  }, [chrome, onHover]);
};
