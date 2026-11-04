import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useComposeSheetExpanded } from '../../hooks/useMobileBrowseSheetImmersive';
import { ComposeDiscardConfirmHost } from '../ui/ComposeDiscardConfirmHost';
import { useComposeImmersiveChrome } from './ComposeImmersiveChromeContext';

type ComposeSheetExpandedValue = ReturnType<typeof useComposeSheetExpanded>;

const ComposeSheetExpandedContext = createContext<ComposeSheetExpandedValue | null>(null);

/** One peek/full-screen height for the whole FAB compose session (menu → wizard handoffs). */
export const ComposeSheetExpandedProvider = ({
  composeSessionOpen,
  children,
}: {
  composeSessionOpen: boolean;
  children: ReactNode;
}) => {
  const value = useComposeSheetExpanded(composeSessionOpen);
  const { setImmersiveCompose } = useComposeImmersiveChrome();

  useEffect(() => {
    setImmersiveCompose(composeSessionOpen && value.sheetExpanded);
    return () => setImmersiveCompose(false);
  }, [composeSessionOpen, value.sheetExpanded, setImmersiveCompose]);

  return (
    <ComposeSheetExpandedContext.Provider value={value}>
      {children}
      <ComposeDiscardConfirmHost />
    </ComposeSheetExpandedContext.Provider>
  );
};

export const useComposeSheetExpandedState = (): ComposeSheetExpandedValue => {
  const ctx = useContext(ComposeSheetExpandedContext);
  if (!ctx) {
    throw new Error('useComposeSheetExpandedState requires ComposeSheetExpandedProvider');
  }
  return ctx;
};

/** Explore FAB compose uses provider; Plan manage edit / other hosts use isolated sheet expand state. */
export const useComposeSheetExpandedStateOrLocal = (
  sheetOpen: boolean
): ComposeSheetExpandedValue => {
  const ctx = useContext(ComposeSheetExpandedContext);
  const [expanded, setExpanded] = useState(
    () => typeof window !== 'undefined' && !window.matchMedia('(max-width: 767px)').matches
  );

  useEffect(() => {
    if (!sheetOpen) {
      setExpanded(false);
      return;
    }
    if (!window.matchMedia('(max-width: 767px)').matches) setExpanded(true);
  }, [sheetOpen]);

  const expandSheet = useCallback(() => setExpanded(true), []);
  const collapseSheet = useCallback(() => setExpanded(false), []);
  const clearExpandedSession = useCallback(() => setExpanded(false), []);

  const local: ComposeSheetExpandedValue = {
    sheetExpanded: expanded,
    expandSheet,
    collapseSheet,
    clearExpandedSession,
  };

  return ctx ?? local;
};
