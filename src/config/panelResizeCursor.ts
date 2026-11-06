/** Horizontal stretch cursor while hovering or dragging a split panel. */
export const PANEL_RESIZE_CURSOR = 'ew-resize' as const;
const RESIZING_CLASS = 'uaetrail-panel-resizing';

export const applyPanelResizeCursor = (): void => {
  document.documentElement.classList.add(RESIZING_CLASS);
  document.body.style.cursor = PANEL_RESIZE_CURSOR;
  document.body.style.userSelect = 'none';
};

export const clearPanelResizeCursor = (): void => {
  document.documentElement.classList.remove(RESIZING_CLASS);
  document.body.style.removeProperty('cursor');
  document.body.style.removeProperty('user-select');
};
