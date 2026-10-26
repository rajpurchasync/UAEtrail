import { type ReactNode, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import {
  EXPLORE_BROWSE_PEEK_SHEET,
  EXPLORE_COMPOSE_IMMERSIVE,
  EXPLORE_SHAPE,
  EXPLORE_SHEET,
  EXPLORE_Z,
  exploreSheetPanelClass,
} from '../../config/exploreTheme';
import { MobileSheetDragHandle } from '../../components/mobile/MobileSheetDragHandle';
import { useModalA11y } from '../../hooks/useModalA11y';
import { MOBILE_BROWSE_SHEET_EXPAND_HINT } from '../../hooks/useMobileBrowseSheetImmersive';
import { useSheetDragDismiss } from '../../hooks/useSheetDragDismiss';

const COMPOSE_PEEK_DRAG_HINT = MOBILE_BROWSE_SHEET_EXPAND_HINT;

interface ExploreResponsiveSheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  panelClassName?: string;
  maxWidthClass?: string;
  zClass?: string;
  /** Full-viewport overlay (needed above map peek z-index when rendered outside map stage). */
  overlayFixed?: boolean;
  showHandle?: boolean;
  /** Bottom sheet on small screens; centered dialog on lg+. */
  layout?: 'responsive' | 'centered' | 'fullscreen';
  /** Top-right dismiss control (recommended with `layout="centered"`). */
  showCloseButton?: boolean;
  /** Visible title wired to `aria-labelledby`. */
  title?: string;
  /** Fallback accessible name when `title` is omitted. */
  ariaLabel?: string;
  /** Mobile compose flows: drag handle, pull-down dismiss, optional pull-up expand (matches browse sheet). */
  mobileComposeChrome?: boolean;
  expanded?: boolean;
  onExpand?: () => void;
  expandHint?: string;
}

/** Bottom sheet on mobile; centered dialog on desktop (lg+). */
export const ExploreResponsiveSheet = ({
  open,
  onClose,
  children,
  panelClassName = '',
  maxWidthClass = 'lg:max-w-lg',
  zClass = 'z-[1400]',
  overlayFixed = false,
  showHandle = true,
  layout = 'responsive',
  showCloseButton = false,
  title,
  ariaLabel = 'Panel',
  mobileComposeChrome = false,
  expanded = false,
  onExpand,
  expandHint,
}: ExploreResponsiveSheetProps) => {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const composePeekGestures = mobileComposeChrome && !expanded;
  const { panelRef: dragPanelRef, panelStyle, overlayStyle, dragZoneProps } = useSheetDragDismiss(
    onClose,
    {
      enabled: open && composePeekGestures,
      onExpand: composePeekGestures ? onExpand : undefined,
      mode: composePeekGestures ? 'peek' : 'default',
    }
  );
  const [immersiveEnter, setImmersiveEnter] = useState(false);
  useEffect(() => {
    if (!mobileComposeChrome || !expanded) {
      setImmersiveEnter(false);
      return;
    }
    setImmersiveEnter(true);
    const timer = window.setTimeout(() => setImmersiveEnter(false), 360);
    return () => window.clearTimeout(timer);
  }, [expanded, mobileComposeChrome]);
  const mergePanelRef = (node: HTMLDivElement | null) => {
    panelRef.current = node;
    dragPanelRef.current = node;
  };
  useModalA11y(open, onClose, panelRef);

  if (!open) return null;

  const overlayPosition = overlayFixed ? 'fixed' : 'absolute';
  const centered = layout === 'centered';
  const fullscreen = layout === 'fullscreen';
  const composeExpanded = mobileComposeChrome && expanded;
  const composePeek = mobileComposeChrome && !expanded;
  const composeImmersiveMobile = composeExpanded;

  const effectiveZClass = composeImmersiveMobile ? EXPLORE_Z.composeFlowImmersive : zClass;

  const shellClass = fullscreen || composeExpanded
    ? 'items-stretch justify-stretch p-0'
    : centered
      ? `items-center justify-center p-4 sm:p-6`
      : composePeek
        ? `flex-col items-center justify-end ${EXPLORE_BROWSE_PEEK_SHEET.shellTopPad} sm:justify-center sm:p-4 lg:p-6`
        : `flex-col items-center justify-end sm:justify-center sm:p-4 lg:p-6`;

  const composeMobilePanelClass = mobileComposeChrome
    ? composeExpanded
      ? `fixed inset-0 z-[1] flex w-full max-w-none flex-col overflow-hidden bg-white ${panelClassName}`
      : `relative flex w-full min-h-0 flex-col overflow-hidden explore-sheet-panel ${exploreSheetPanelClass} ${maxWidthClass} ${panelClassName} shadow-[0_-8px_40px_rgba(15,23,42,.12)] sm:shadow-2xl lg:max-h-[min(78dvh,720px)] lg:h-auto lg:overflow-y-auto ${EXPLORE_BROWSE_PEEK_SHEET.panelPeekMobile}`
    : '';

  const showBackdropDismiss = !fullscreen && !composeExpanded;

  const panelSurfaceClass = fullscreen
    ? `relative flex h-[100dvh] max-h-[100dvh] w-full max-w-none flex-col overflow-hidden rounded-none bg-neutral-50 shadow-none ${panelClassName}`
    : mobileComposeChrome
      ? composeMobilePanelClass
      : `relative w-full max-h-[min(90dvh,640px)] overflow-y-auto explore-sheet-panel ${exploreSheetPanelClass} ${maxWidthClass} ${panelClassName} ${
          centered
            ? 'rounded-2xl shadow-2xl'
            : 'shadow-[0_-8px_40px_rgba(15,23,42,.12)] sm:shadow-2xl'
        }`;

  const composeScrollClass = mobileComposeChrome
    ? composeExpanded
      ? `flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain ${EXPLORE_COMPOSE_IMMERSIVE.scrollPadTop} ${EXPLORE_COMPOSE_IMMERSIVE.scrollPadBottom} lg:overflow-visible lg:flex-none lg:pt-0 lg:pb-0`
      : 'flex min-h-0 flex-1 flex-col overflow-y-auto lg:overflow-visible lg:flex-none'
    : undefined;

  const dragHandle = composePeekGestures ? (
    <div className="shrink-0 sm:hidden">
      <MobileSheetDragHandle
        hint={expandHint ?? COMPOSE_PEEK_DRAG_HINT}
        expandGestures={Boolean(onExpand)}
        onExpand={onExpand}
        dragZoneProps={dragZoneProps}
      />
    </div>
  ) : showHandle && !centered ? (
    <div className={`mb-2 mt-3 sm:hidden ${EXPLORE_SHAPE.sheetHandle}`} />
  ) : null;

  const sheetTree = (
    <div
      className={`${overlayPosition} inset-0 ${effectiveZClass} flex ${shellClass} ${
        composeExpanded ? 'bg-white' : EXPLORE_SHEET.scrim
      } ${overlayFixed || fullscreen || composeExpanded ? '' : 'lg:fixed'}`}
      style={composePeekGestures ? overlayStyle : undefined}
    >
      {showBackdropDismiss ? (
        <button
          type="button"
          className="absolute inset-0 z-0"
          aria-label="Close"
          onClick={onClose}
        />
      ) : null}
      <div
        ref={mobileComposeChrome ? mergePanelRef : panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : ariaLabel}
        className={`relative z-10 ${panelSurfaceClass}${
          immersiveEnter ? ' compose-sheet-immersive-enter max-lg:compose-sheet-immersive-enter' : ''
        }`}
        style={composePeekGestures ? panelStyle : undefined}
        onClick={(event) => event.stopPropagation()}
      >
        {title ? (
          <h2 id={titleId} className="sr-only">
            {title}
          </h2>
        ) : null}
        {showCloseButton ? (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 z-10 rounded-full p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
            aria-label="Close"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        ) : null}
        {composeExpanded ? (
          <div className={composeScrollClass}>{children}</div>
        ) : (
          <>
            {dragHandle}
            <div className={composeScrollClass}>{children}</div>
          </>
        )}
      </div>
    </div>
  );

  if (mobileComposeChrome && typeof document !== 'undefined') {
    return createPortal(sheetTree, document.body);
  }

  return sheetTree;
};
