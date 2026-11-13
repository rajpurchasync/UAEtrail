import { type ReactNode, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import {
  EXPLORE_COMPOSE_IMMERSIVE,
  EXPLORE_SHAPE,
  EXPLORE_SHEET,
  exploreSheetPanelClass,
} from '../../config/exploreTheme';
import { COMPOSE_DESKTOP_INSET_FIXED, CONSUMER_MAIN_OVERLAY_INSET } from '../../config/consumerOverlayInset';
import {
  exploreCenteredSheetPopupBodyClass,
  exploreCenteredSheetPopupPanelClass,
  exploreDesktopPopupCloseButtonClass,
} from '../exploreDesktopPopup';
import { MobileSheetDragHandle } from '../../components/mobile/MobileSheetDragHandle';
import { useModalA11y } from '../../hooks/useModalA11y';
import { useSheetDragDismiss } from '../../hooks/useSheetDragDismiss';

interface ExploreResponsiveSheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  panelClassName?: string;
  maxWidthClass?: string;
  zClass?: string;
  /** Full-viewport overlay (needed above map peek z-index when rendered outside map stage). */
  overlayFixed?: boolean;
  /** Keep overlay `absolute` within the map pane (sidebar stays interactive). */
  overlayContained?: boolean;
  showHandle?: boolean;
  /** Bottom sheet on small screens; centered dialog on lg+. */
  layout?: 'responsive' | 'centered' | 'fullscreen';
  /** Top-right dismiss control (recommended with `layout="centered"`). */
  showCloseButton?: boolean;
  /** Visible title wired to `aria-labelledby`. */
  title?: string;
  /** Fallback accessible name when `title` is omitted. */
  ariaLabel?: string;
  /** FAB create wizard — full screen on mobile/tablet; desktop inset beside side nav. */
  mobileComposeChrome?: boolean;
  /** Bottom sheet with drag handle: pull down to dismiss (non-compose sheets). */
  pullToDismiss?: boolean;
  /** Centered dialogs: shared max-height + short-viewport typography (see `.explore-desktop-popup-panel`). */
  viewportAdaptive?: boolean;
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
  overlayContained = false,
  showHandle = true,
  layout = 'responsive',
  showCloseButton = false,
  title,
  ariaLabel = 'Panel',
  mobileComposeChrome = false,
  pullToDismiss = false,
  viewportAdaptive = false,
}: ExploreResponsiveSheetProps) => {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const pullDismissGestures = pullToDismiss && showHandle && layout !== 'centered' && layout !== 'fullscreen';
  const { panelRef: dragPanelRef, panelStyle, overlayStyle, dragZoneProps } = useSheetDragDismiss(
    onClose,
    {
      enabled: open && pullDismissGestures,
      mode: 'default',
    }
  );
  const mergePanelRef = (node: HTMLDivElement | null) => {
    panelRef.current = node;
    dragPanelRef.current = node;
  };
  useModalA11y(open, onClose, panelRef);

  if (!open) return null;

  const overlayPosition =
    overlayFixed && !overlayContained ? 'fixed' : 'absolute';
  const centered = layout === 'centered';
  const fullscreen = layout === 'fullscreen';
  const centeredPopup = centered && viewportAdaptive;
  /** Dialog max height minus overlay padding (p-4 / sm:p-6). */
  const centeredPanelMaxHeight =
    '!max-h-[min(calc(100dvh-2rem),640px)] sm:!max-h-[min(calc(100dvh-3rem),640px)] lg:!max-h-[min(calc(100dvh-3rem),640px)]';

  const shellClass = fullscreen || mobileComposeChrome
    ? 'items-stretch justify-stretch p-0'
    : centered
      ? overlayContained
        ? `flex min-h-full flex-col items-center justify-center overflow-y-auto overscroll-contain p-4 sm:p-6`
        : `flex flex-col overflow-y-auto overscroll-contain p-4 sm:p-6`
      : `flex-col items-center justify-end sm:justify-center sm:p-4 lg:p-6`;

  const composePanelClass = mobileComposeChrome
    ? `fixed inset-0 z-[1] flex w-full max-w-none flex-col overflow-hidden bg-white !px-0 ${panelClassName}`
    : '';

  const showBackdropDismiss = !fullscreen && !mobileComposeChrome;

  const panelSurfaceClass = fullscreen
    ? `relative flex h-[100dvh] max-h-[100dvh] w-full max-w-none flex-col overflow-hidden rounded-none bg-neutral-50 shadow-none ${panelClassName}`
    : mobileComposeChrome
      ? composePanelClass
      : pullDismissGestures
        ? `relative flex w-full max-h-[min(90dvh,640px)] flex-col overflow-hidden explore-sheet-panel max-md:animate-fade-up ${exploreSheetPanelClass} ${maxWidthClass} ${panelClassName} ${
            centered
              ? 'rounded-2xl shadow-2xl'
              : 'shadow-[0_-8px_40px_rgba(15,23,42,.12)] sm:shadow-2xl'
          }`
        : centered
          ? centeredPopup
            ? `${exploreCenteredSheetPopupPanelClass}${overlayContained ? ' explore-map-pane-popup-panel' : ''} ${maxWidthClass} ${panelClassName}`
            : `relative mx-auto my-auto flex w-full flex-col overflow-hidden explore-sheet-panel ${exploreSheetPanelClass} ${maxWidthClass} ${centeredPanelMaxHeight} rounded-2xl shadow-2xl ${panelClassName}`
          : `relative w-full max-h-[min(90dvh,640px)] overflow-y-auto explore-sheet-panel ${exploreSheetPanelClass} ${maxWidthClass} ${panelClassName} shadow-[0_-8px_40px_rgba(15,23,42,.12)] sm:shadow-2xl`;

  const centeredBodyScroll =
    centered && !mobileComposeChrome && !fullscreen
      ? centeredPopup
        ? exploreCenteredSheetPopupBodyClass
        : 'min-h-0 flex-1 overflow-y-auto overscroll-contain'
      : undefined;

  const composeScrollClass = mobileComposeChrome
    ? `compose-sheet-scroll compose-form-shell flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-y-auto overscroll-contain px-5 lg:px-6 ${EXPLORE_COMPOSE_IMMERSIVE.scrollPadBottom} lg:overflow-y-auto lg:flex-1 lg:pt-0`
    : pullDismissGestures && !panelClassName.includes('overflow-hidden')
      ? 'flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overscroll-contain'
      : undefined;

  const dragHandle = pullDismissGestures ? (
    <div className="shrink-0 sm:hidden">
      <MobileSheetDragHandle dragZoneProps={dragZoneProps} />
    </div>
  ) : showHandle && !centered && !mobileComposeChrome ? (
    <div className={`mb-2 mt-3 sm:hidden ${EXPLORE_SHAPE.sheetHandle}`} />
  ) : null;

  const overlayInsetClass = mobileComposeChrome
    ? COMPOSE_DESKTOP_INSET_FIXED
    : overlayFixed && !overlayContained
      ? CONSUMER_MAIN_OVERLAY_INSET
      : `${overlayPosition} inset-0`;

  const sheetTree = (
    <div
      className={`${overlayInsetClass} ${zClass} flex ${shellClass} ${
        mobileComposeChrome ? 'bg-white' : EXPLORE_SHEET.scrim
      } ${overlayContained ? 'pointer-events-auto' : ''} ${overlayFixed || fullscreen || mobileComposeChrome || overlayContained ? '' : 'lg:fixed'}`}
      style={pullDismissGestures ? overlayStyle : undefined}
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
        ref={mobileComposeChrome || pullDismissGestures ? mergePanelRef : panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : ariaLabel}
        className={`relative z-10 ${panelSurfaceClass}`}
        style={pullDismissGestures ? panelStyle : undefined}
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
            className={exploreDesktopPopupCloseButtonClass}
            aria-label="Close"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        ) : null}
        {dragHandle}
        {composeScrollClass ? (
          <div className={composeScrollClass}>{children}</div>
        ) : centeredBodyScroll ? (
          <div className={centeredBodyScroll}>{children}</div>
        ) : (
          children
        )}
      </div>
    </div>
  );

  const portalToBody =
    typeof document !== 'undefined' && (mobileComposeChrome || overlayFixed);

  if (portalToBody) {
    return createPortal(sheetTree, document.body);
  }

  return sheetTree;
};
