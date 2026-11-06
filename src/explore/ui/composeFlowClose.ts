export const COMPOSE_FLOW_DISCARD_MESSAGE =
  'Discard this draft? Your progress will not be saved.';

export const confirmDiscardComposeFlow = (): boolean =>
  window.confirm(COMPOSE_FLOW_DISCARD_MESSAGE);

type ComposeDiscardConfirmHandler = (onDiscard: () => void) => void;

const COMPOSE_DISCARD_HANDLER_KEY = '__uaetrailComposeDiscardConfirm';

const getComposeDiscardConfirmHandler = (): ComposeDiscardConfirmHandler | null =>
  (globalThis as Record<string, unknown>)[COMPOSE_DISCARD_HANDLER_KEY] as
    | ComposeDiscardConfirmHandler
    | null
    | undefined ?? null;

/** Registered by {@link ComposeDiscardConfirmHost} at compose session root. */
export const setComposeDiscardConfirmHandler = (handler: ComposeDiscardConfirmHandler | null) => {
  if (handler) {
    (globalThis as Record<string, unknown>)[COMPOSE_DISCARD_HANDLER_KEY] = handler;
    return;
  }
  delete (globalThis as Record<string, unknown>)[COMPOSE_DISCARD_HANDLER_KEY];
};

/** Close a compose sheet; confirm when the member has started the flow. Returns whether the sheet closed. */
export const runComposeFlowClose = (inProgress: boolean, close: () => void): boolean => {
  if (!inProgress) {
    close();
    return true;
  }
  const composeDiscardConfirmHandler = getComposeDiscardConfirmHandler();
  if (composeDiscardConfirmHandler) {
    composeDiscardConfirmHandler(close);
    return false;
  }
  if (confirmDiscardComposeFlow()) {
    close();
    return true;
  }
  return false;
};

/** Prefer closing without confirm when the wizard has no saved draft (avoids blocked `window.confirm`). */
export const requestComposeFlowClose = (
  options: { hasDraft: boolean; inProgress: boolean },
  close: () => void
): boolean => {
  if (!options.hasDraft) {
    close();
    return true;
  }
  return runComposeFlowClose(options.inProgress, close);
};

/** Exit compose entirely. */
export const finishComposeFlowClose = (close: () => void): void => {
  close();
};

export const isPastWizardStep = (stepIndex: number): boolean => stepIndex > 0;

/** True when a compose wizard has meaningful user input (not just landing on step 0). */
export const composeWizardHasDraftContent = (fields: {
  title?: string;
  description?: string;
  notes?: string;
  placeLabel?: string;
  locationLabel?: string;
}): boolean => {
  const title = fields.title?.trim();
  if (title) return true;
  if (fields.description?.trim()) return true;
  if (fields.notes?.trim()) return true;
  if (fields.placeLabel?.trim()) return true;
  if (fields.locationLabel?.trim()) return true;
  return false;
};
