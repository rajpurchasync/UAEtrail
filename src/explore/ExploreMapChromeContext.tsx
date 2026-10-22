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
};

const ExploreMapChromeContext = createContext<ExploreMapChromeContextValue | null>(null);

/** Lets layout chrome (mobile header) dismiss the map peek owned by ExploreExperience. */
export const ExploreMapChromeProvider = ({ children }: { children: ReactNode }) => {
  const closeRef = useRef<(() => void) | null>(null);
  const bindClosePeek = useCallback((handler: (() => void) | null) => {
    closeRef.current = handler;
  }, []);
  const requestClosePeek = useCallback(() => {
    closeRef.current?.();
  }, []);
  const value = useMemo(
    () => ({ requestClosePeek, bindClosePeek }),
    [requestClosePeek, bindClosePeek]
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
