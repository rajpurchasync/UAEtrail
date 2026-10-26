import { useCallback, useEffect, useState } from 'react';
import {
  clearComposeSheetExpandedSession,
  readComposeSheetExpandedSession,
  writeComposeSheetExpandedSession,
} from '../explore/create/composeSheetExpandedSession';

export const MOBILE_BROWSE_SHEET_EXPAND_HINT = 'Pull down to close · Pull up for full screen';

/** FAB create flows — pull down to close, pull up (or tap) for full screen. */
export const COMPOSE_SHEET_DRAG_HINT = MOBILE_BROWSE_SHEET_EXPAND_HINT;

/** Full-screen step for mobile explore browse sheets (pull up on handle). */
export const useMobileBrowseSheetImmersive = (sheetOpen: boolean) => {
  const [immersive, setImmersive] = useState(false);

  useEffect(() => {
    if (!sheetOpen) setImmersive(false);
  }, [sheetOpen]);

  const enterImmersive = useCallback(() => setImmersive(true), []);
  const exitImmersive = useCallback(() => setImmersive(false), []);

  return { immersive, enterImmersive, exitImmersive };
};

/** Pull-up full screen for FAB compose sheets; survives brief leave (e.g. profile → back). */
export const useComposeSheetExpanded = (sheetOpen: boolean) => {
  const [expanded, setExpanded] = useState(() =>
    sheetOpen ? readComposeSheetExpandedSession() : false
  );

  useEffect(() => {
    if (sheetOpen) {
      setExpanded(readComposeSheetExpandedSession());
    } else {
      setExpanded(false);
    }
  }, [sheetOpen]);

  const expandSheet = useCallback(() => {
    setExpanded(true);
    writeComposeSheetExpandedSession(true);
  }, []);

  const collapseSheet = useCallback(() => {
    setExpanded(false);
    writeComposeSheetExpandedSession(false);
  }, []);

  return {
    sheetExpanded: expanded,
    expandSheet,
    collapseSheet,
    clearExpandedSession: clearComposeSheetExpandedSession,
  };
};
