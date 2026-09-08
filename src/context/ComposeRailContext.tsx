import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useLocation } from 'react-router-dom';

export interface ComposeRailPayload {
  title?: string;
  content: ReactNode;
}

interface ComposeRailContextValue {
  isOpen: boolean;
  title?: string;
  content: ReactNode | null;
  openRail: (payload: ComposeRailPayload) => void;
  closeRail: () => void;
}

const ComposeRailContext = createContext<ComposeRailContextValue | null>(null);

export const ComposeRailProvider = ({ children }: { children: ReactNode }) => {
  const { pathname } = useLocation();
  const [state, setState] = useState<ComposeRailPayload | null>(null);

  const closeRail = useCallback(() => setState(null), []);

  const openRail = useCallback((payload: ComposeRailPayload) => {
    setState(payload);
  }, []);

  useEffect(() => {
    closeRail();
  }, [pathname, closeRail]);

  const value = useMemo(
    () => ({
      isOpen: state != null,
      title: state?.title,
      content: state?.content ?? null,
      openRail,
      closeRail,
    }),
    [state, openRail, closeRail]
  );

  return <ComposeRailContext.Provider value={value}>{children}</ComposeRailContext.Provider>;
};

export const useComposeRail = () => {
  const ctx = useContext(ComposeRailContext);
  if (!ctx) {
    throw new Error('useComposeRail must be used within ComposeRailProvider');
  }
  return ctx;
};
