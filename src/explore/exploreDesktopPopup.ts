/** Centered explore / product dialogs (md+ sheets + map guest gate). */
export const exploreCenteredSheetPopupPanelClass =
  'explore-desktop-popup-panel relative mx-auto my-auto flex w-full min-h-0 max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl';

export const exploreCenteredSheetPopupBodyClass =
  'explore-desktop-popup-body min-h-0 flex-1 overflow-y-auto overscroll-contain';

/** Resting chip on white sheet panels — hover darkens one step. */
export const EXPLORE_SHEET_CLOSE_BUTTON_SURFACE =
  'rounded-full bg-neutral-100 text-neutral-600 shadow-sm ring-1 ring-black/5 hover:bg-neutral-200 hover:text-neutral-800';

/** Close control — sits on the white panel surface (not the scrim). */
export const exploreDesktopPopupCloseButtonClass =
  `absolute right-2 top-2 z-20 p-2 ${EXPLORE_SHEET_CLOSE_BUTTON_SURFACE}`;

export const EXPLORE_DESKTOP_POPUP = {
  scrimShell:
    'pointer-events-auto absolute inset-0 flex flex-col overflow-y-auto overscroll-contain p-4 sm:p-6',
  panel: exploreCenteredSheetPopupPanelClass,
  body: exploreCenteredSheetPopupBodyClass,
  closeButton: exploreDesktopPopupCloseButtonClass,
  dismissLink:
    'mt-2 block w-full py-1.5 text-center text-xs font-medium text-neutral-400 hover:text-neutral-500',
} as const;
