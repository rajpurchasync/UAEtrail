import type { ComponentPropsWithoutRef } from 'react';
import { SHEET_DRAG_HANDLE_ATTR } from '../../hooks/useSheetDragDismiss';

type MobileSheetDragHandleProps = {
  /** Optional one-line gesture hint (peek sheets only). */
  hint?: string;
  /** Pull-up expands the sheet (updates aria label). */
  expandGestures?: boolean;
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
  expandGestures = false,
  dragZoneProps,
}: MobileSheetDragHandleProps) => (
  <div
    className="flex w-full shrink-0 touch-none select-none flex-col items-center justify-center gap-1.5 border-b border-neutral-100 bg-neutral-50/95 px-4 py-3 min-h-[52px]"
    aria-label={
      expandGestures
        ? 'Drag down to close or drag up for full screen'
        : 'Drag down to close'
    }
    {...dragZoneProps}
    {...{ [SHEET_DRAG_HANDLE_ATTR]: true }}
  >
    <div className="h-1 w-11 rounded-full bg-neutral-300" aria-hidden />
    {hint ? (
      <p className="pointer-events-none text-center text-[11px] font-medium leading-snug text-neutral-500">
        {hint}
      </p>
    ) : null}
  </div>
);
