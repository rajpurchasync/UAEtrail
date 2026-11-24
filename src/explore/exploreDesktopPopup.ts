import { CONSUMER_MODAL_CLOSE } from '../config/consumerSurfaceTypography';

/** Centered explore / product dialogs (md+ sheets + map guest gate). */
export const exploreCenteredSheetPopupPanelClass =
  'explore-desktop-popup-panel relative mx-auto my-auto flex w-full min-h-0 max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl';

export const exploreCenteredSheetPopupBodyClass =
  'explore-desktop-popup-body min-h-0 flex-1 overflow-y-auto overscroll-contain';

/** @deprecated Use {@link EXPLORE_COMPOSE.pickerBody} in exploreTheme. */
export const exploreComposeMenuPopupBodyClass =
  'flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-6 pb-6 pt-3';

/** @deprecated Use {@link CONSUMER_MODAL_CLOSE.button}. */
export const EXPLORE_SHEET_CLOSE_BUTTON_SURFACE = CONSUMER_MODAL_CLOSE.button;

/** Close control — panel top-right (search modal, guest gate, centered sheets). */
export const exploreDesktopPopupCloseButtonClass = `${CONSUMER_MODAL_CLOSE.corner} ${CONSUMER_MODAL_CLOSE.button}`;

/** Host · Seek · Add — same subtle dismiss everywhere. */
export const exploreComposeFlowCloseIconClass = CONSUMER_MODAL_CLOSE.button;

/** FAB compose picker — panel corner. */
export const exploreComposeMenuCloseButtonClass = `${CONSUMER_MODAL_CLOSE.cornerLoose} ${CONSUMER_MODAL_CLOSE.button}`;

export const EXPLORE_DESKTOP_POPUP = {
  scrimShell:
    'pointer-events-auto absolute inset-0 flex flex-col overflow-y-auto overscroll-contain p-4 sm:p-6',
  panel: exploreCenteredSheetPopupPanelClass,
  body: exploreCenteredSheetPopupBodyClass,
  closeButton: exploreDesktopPopupCloseButtonClass,
  dismissLink:
    'mt-2 block w-full py-1.5 text-center text-xs font-medium text-neutral-400 hover:text-neutral-500',
} as const;