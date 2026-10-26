const COMPOSE_SHEET_EXPANDED_KEY = 'uaetrail.composeSheetExpanded';

export const readComposeSheetExpandedSession = (): boolean => {
  try {
    return sessionStorage.getItem(COMPOSE_SHEET_EXPANDED_KEY) === '1';
  } catch {
    return false;
  }
};

export const writeComposeSheetExpandedSession = (expanded: boolean): void => {
  try {
    if (expanded) {
      sessionStorage.setItem(COMPOSE_SHEET_EXPANDED_KEY, '1');
    } else {
      sessionStorage.removeItem(COMPOSE_SHEET_EXPANDED_KEY);
    }
  } catch {
    /* private mode / quota */
  }
};

export const clearComposeSheetExpandedSession = (): void => {
  writeComposeSheetExpandedSession(false);
};
