import type { ComponentPropsWithoutRef } from 'react';
import { SHEET_DRAG_HANDLE_ATTR } from '../../hooks/useSheetDragDismiss';

type MobileSheetDragHandleProps = {
  /** One-line gesture hint (tooltip pill, not a control). */
  hint?: string;
  /** Pill matches full-screen collapse; caption is plain text on half-height peek. */
  hintAppearance?: 'pill' | 'caption';
  hideHint?: boolean;
  /** Pull-up expands the sheet (updates aria label). */
  expandGestures?: boolean;
  /** Full-screen compose — pull down returns to half height. */
  collapseGestures?: boolean;
  /** @deprecated Pull up on the handle expands; no separate tap control. */
  onExpand?: () => void;
  dragZoneProps?: Pick<
    ComponentPropsWithoutRef<'div'>,
    'onPointerDown' | 'onPointerMove' | 'onPointerUp' | 'onPointerCancel'
  >;
};

/** Peek bottom sheets — pull down to close, pull up to expand (no tap target). */
export const MobileSheetDragHandle = ({
  hint,
  hintAppearance = 'pill',
  hideHint = false,
  expandGestures = false,
  collapseGestures = false,
  dragZoneProps,
}: MobileSheetDragHandleProps) => (
  <div
    className="flex w-full shrink-0 touch-none select-none flex-col items-center justify-center gap-2 bg-transparent px-4 py-2.5 min-h-[48px]"
    aria-label={
      collapseGestures
        ? 'Drag down for half screen'
        : expandGestures
          ? 'Drag down to close or drag up for full screen'
          : 'Drag down to close'
    }
    {...dragZoneProps}
    {...{ [SHEET_DRAG_HANDLE_ATTR]: true }}
  >
    <div className="sheet-drag-handle-bar shrink-0" aria-hidden />
    {hint && !hideHint ? (
      hintAppearance === 'pill' ? (
        <span className="sheet-gesture-hint pointer-events-none" role="note">
          {hint}
        </span>
      ) : (
        <span
          className="sheet-gesture-caption pointer-events-none max-w-[calc(100vw-2.5rem)] truncate text-center text-[11px] font-medium leading-snug"
          role="note"
        >
          {hint}
        </span>
      )
    ) : null}
  </div>
);
