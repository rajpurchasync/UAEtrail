import type { ComponentPropsWithoutRef } from 'react';
import { SHEET_DRAG_HANDLE_ATTR } from '../../hooks/useSheetDragDismiss';

type MobileSheetDragHandleProps = {
  /** Optional one-line gesture hint (e.g. people sheet on explore). */
  hint?: string;
  dragZoneProps?: Pick<
    ComponentPropsWithoutRef<'div'>,
    'onTouchStart' | 'onPointerDown' | 'onPointerMove' | 'onPointerUp' | 'onPointerCancel'
  >;
};

/** Full-width pull zone for mobile bottom sheets — pair with `useSheetDragDismiss`. */
export const MobileSheetDragHandle = ({ hint, dragZoneProps }: MobileSheetDragHandleProps) => (
  <div
    className="flex w-full shrink-0 touch-none select-none flex-col items-center justify-center gap-2 border-b border-neutral-100 bg-neutral-50/95 px-4 py-3 min-h-[60px]"
    aria-label={
      hint ? 'Drag down to close the panel or drag up for full screen' : 'Drag down to close the panel'
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
