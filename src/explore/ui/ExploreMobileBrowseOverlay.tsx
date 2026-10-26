import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import {
  EXPLORE_BROWSE_PEEK_SHEET,
  EXPLORE_SHEET,
  EXPLORE_TYPE,
  EXPLORE_Z,
  exploreSheetPanelClass,
} from '../../config/exploreTheme';
import { X } from 'lucide-react';
import { MobileSheetDragHandle } from '../../components/mobile/MobileSheetDragHandle';
import { MobileBackButton } from '../../components/mobile/MobileBackButton';
import { useModalA11y } from '../../hooks/useModalA11y';
import { useSheetDragDismiss } from '../../hooks/useSheetDragDismiss';
import { useId, useRef } from 'react';

type ExploreMobileBrowseOverlayProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** People browse / light panels — height follows content; discover list stays tall. */
  sheetSize?: 'full' | 'content';
  /** Pull up on the sheet handle (e.g. Find crew → full screen on explore). */
  onExpand?: () => void;
  expandHint?: string;
  /** Full-viewport sheet with back control (still on explore). */
  immersive?: boolean;
  immersiveTitle?: string;
  onExitImmersive?: () => void;
  immersiveBackLabel?: string;
};

/** Discover browse panel — bottom sheet over the map (mobile explore list mode). */
export const ExploreMobileBrowseOverlay = ({
  open,
  onClose,
  children,
  sheetSize = 'full',
  onExpand,
  expandHint,
  immersive = false,
  immersiveTitle,
  onExitImmersive,
  immersiveBackLabel = 'Explore',
}: ExploreMobileBrowseOverlayProps) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const peekGestures = open && !immersive;
  const { panelRef: dragPanelRef, panelStyle, overlayStyle, dragZoneProps } = useSheetDragDismiss(
    onClose,
    {
      enabled: peekGestures,
      onExpand: peekGestures ? onExpand : undefined,
      mode: peekGestures ? 'peek' : 'default',
    }
  );
  const mergePanelRef = (node: HTMLDivElement | null) => {
    panelRef.current = node;
    dragPanelRef.current = node;
  };
  useModalA11y(open, onClose, panelRef);

  if (!open || typeof document === 'undefined') return null;

  const contentSized = sheetSize === 'content' && !immersive;
  const panelHeightClass = immersive
    ? 'h-[100dvh] max-h-[100dvh] rounded-none'
    : contentSized
      ? `h-auto ${EXPLORE_BROWSE_PEEK_SHEET.panelMaxHeight}`
      : `${EXPLORE_BROWSE_PEEK_SHEET.panelHeight} ${EXPLORE_BROWSE_PEEK_SHEET.panelMaxHeight}`;

  const dragHint = onExpand ? expandHint : undefined;

  return createPortal(
    <div
      className={`fixed inset-0 ${EXPLORE_Z.browseSheet} flex flex-col justify-end ${
        immersive ? 'pt-0' : EXPLORE_BROWSE_PEEK_SHEET.shellTopPad
      } ${immersive ? 'bg-white' : EXPLORE_SHEET.scrim}`}
      style={peekGestures ? overlayStyle : undefined}
      role="presentation"
    >
      {!immersive ? (
        <button type="button" className="absolute inset-0" aria-label="Close panel" onClick={onClose} />
      ) : null}
      <div
        ref={mergePanelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative flex w-full min-h-0 flex-col overflow-hidden bg-neutral-50 shadow-[0_-12px_48px_rgba(15,23,42,.18)] ${panelHeightClass} ${immersive ? '' : exploreSheetPanelClass}`}
        onClick={(event) => event.stopPropagation()}
        style={peekGestures ? panelStyle : undefined}
      >
        <h2 id={titleId} className="sr-only">
          {immersive && immersiveTitle
            ? immersiveTitle
            : contentSized
              ? 'People'
              : 'Discover plans and places'}
        </h2>
        {immersive && immersiveTitle ? (
          <div
            className="grid shrink-0 grid-cols-[minmax(4.5rem,auto)_1fr_2.5rem] items-center gap-1 border-b border-neutral-100 bg-white px-2 pb-1 pt-[max(0.5rem,var(--safe-top,0px))]"
          >
            <MobileBackButton
              label={immersiveBackLabel}
              onPress={onExitImmersive ?? onClose}
              className="-ml-1 text-neutral-900"
            />
            <p className={`min-w-0 truncate text-center text-base font-bold ${EXPLORE_TYPE.title}`}>
              {immersiveTitle}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-neutral-700 hover:bg-neutral-100"
              aria-label="Close"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
        ) : null}
        {!immersive ? (
          <MobileSheetDragHandle
            hint={dragHint}
            expandGestures={Boolean(onExpand)}
            onExpand={onExpand}
            dragZoneProps={dragZoneProps}
          />
        ) : null}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};
