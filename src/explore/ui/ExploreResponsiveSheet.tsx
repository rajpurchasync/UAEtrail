import { type ReactNode, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import {
  EXPLORE_COMPOSE,
  EXPLORE_COMPOSE_IMMERSIVE,
  EXPLORE_SHAPE,
  EXPLORE_SHEET,
  exploreSheetPanelClass,
} from '../../config/exploreTheme';
import { CONSUMER_MAIN_OVERLAY_INSET } from '../../config/consumerOverlayInset';
import { CONSUMER_MODAL_LAYOUT } from '../../config/consumerSurfaceTypography';
import {
  exploreCenteredSheetPopupBodyClass,
  exploreCenteredSheetPopupPanelClass,
  exploreComposeMenuCloseButtonClass,
  exploreDesktopPopupCloseButtonClass,
} from '../exploreDesktopPopup';
import { MobileSheetDragHandle } from '../../components/mobile/MobileSheetDragHandle';
import { useModalA11y } from '../../hooks/useModalA11y';
import { useSheetDragDismiss } from '../../hooks/useSheetDragDismiss';

/** FAB compose — picker steps vs multi-step create wizards. */
export type ComposeFabPresentation = 'menu' | 'wizard';

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
  /**
   * FAB compose layout on mobile: centered picker (`menu`) or half-height+ bottom wizard (`wizard`).
   * Desktop uses the consumer main-column inset.
   */
  composePresentation?: ComposeFabPresentation;
  /** Bottom sheet with drag handle: pull down to dismiss (non-compose sheets). */
  pullToDismiss?: boolean;
  /** Centered dialogs: shared max-height + short-viewport typography (see `.explore-desktop-popup-panel`). */
  viewportAdaptive?: boolean;
  /** Icon-only close (Host · Seek · Add sheets without chip background). */
  composePlainClose?: boolean;
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
  composePresentation,
  pullToDismiss = false,
  viewportAdaptive = false,
  composePlainClose = false,
}: ExploreResponsiveSheetProps) => {
  const composeMenu = composePresentation === 'menu';
  const composeWizard = composePresentation === 'wizard';
  const composeFab = composeMenu || composeWizard;

  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const wizardPullDismiss = composeWizard || pullToDismiss;
  const wizardShowHandle = composeWizard ? true : showHandle;
  const pullDismissGestures =
    wizardPullDismiss &&
    wizardShowHandle &&
    layout !== 'centered' &&
    layout !== 'fullscreen' &&
    !composeMenu;
  const { panelRef: dragPanelRef, panelStyle, overlayStyle, dragZoneProps } = useSheetDragDismiss(
    onClose,
    {
      enabled: open && pullDismissGestures,
      mode: composeWizard ? 'default' : 'default',
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
  const centered = layout === 'centered' || composeMenu;
  const fullscreen = layout === 'fullscreen';
  const centeredPopup = (centered && viewportAdaptive) || composeMenu;
  /** Dialog max height minus overlay padding (p-4 / sm:p-6). */
  const centeredPanelMaxHeight =
    '!max-h-[min(calc(100dvh-2rem),640px)] sm:!max-h-[min(calc(100dvh-3rem),640px)] lg:!max-h-[min(calc(100dvh-3rem),640px)]';

  const shellClass = fullscreen
    ? 'items-stretch justify-stretch p-0'
    : composeMenu
      ? 'flex min-h-full flex-col items-center justify-center overflow-y-auto overscroll-contain p-4 sm:p-6'
      : composeWizard
        ? 'max-md:flex-col max-md:items-stretch max-md:justify-end max-md:p-0 md:flex md:flex-col md:items-stretch md:justify-stretch md:p-0'
        : centered
          ? overlayContained
            ? `flex min-h-full flex-col items-center justify-center overflow-y-auto overscroll-contain p-4 sm:p-6`
            : `flex flex-col overflow-y-auto overscroll-contain p-4 sm:p-6`
          : `flex-col items-center justify-end sm:justify-center sm:p-4 lg:p-6`;

  const showBackdropDismiss = !fullscreen && !composeWizard;

  const composeWizardPanelClass = composeWizard
    ? `relative z-10 w-full bg-white max-md:compose-sheet-immersive-enter max-md:h-[min(62dvh,720px)] max-md:min-h-[50dvh] max-md:max-h-[min(92dvh,720px)] max-md:rounded-t-3xl max-md:shadow-[0_-8px_40px_rgba(15,23,42,.12)] md:min-h-0 md:max-h-none md:flex-1 md:h-full md:w-full md:max-w-none md:rounded-none md:shadow-none ${CONSUMER_MODAL_LAYOUT.shell} ${maxWidthClass} ${panelClassName}`
    : '';

  const composeMenuPanelClass = composeMenu
    ? `${exploreCenteredSheetPopupPanelClass} w-full shrink-0 ${maxWidthClass} ${panelClassName}`
    : '';

  const exploreSheetPanelShell = `${CONSUMER_MODAL_LAYOUT.shell} ${CONSUMER_MODAL_LAYOUT.panelMaxHeightClass} max-h-[min(90dvh,640px)]`;

  const panelSurfaceClass = fullscreen
    ? `relative flex h-[100dvh] max-h-[100dvh] w-full max-w-none flex-col overflow-hidden rounded-none bg-neutral-50 shadow-none ${panelClassName}`
    : composeWizard
      ? composeWizardPanelClass
      : composeMenu
        ? composeMenuPanelClass
        : pullDismissGestures
          ? `relative w-full explore-sheet-panel ${exploreSheetPanelShell} ${exploreSheetPanelClass} ${maxWidthClass} ${panelClassName} ${
              centered
                ? 'rounded-2xl shadow-2xl'
                : 'shadow-[0_-8px_40px_rgba(15,23,42,.12)] sm:shadow-2xl'
            }`
          : centered
            ? centeredPopup
              ? `${exploreCenteredSheetPopupPanelClass}${overlayContained ? ' explore-map-pane-popup-panel' : ''} ${maxWidthClass} ${panelClassName}`
              : `relative mx-auto my-auto w-full explore-sheet-panel ${CONSUMER_MODAL_LAYOUT.shell} ${exploreSheetPanelClass} ${maxWidthClass} ${centeredPanelMaxHeight} rounded-2xl shadow-2xl ${panelClassName}`
            : `relative w-full explore-sheet-panel ${exploreSheetPanelShell} ${exploreSheetPanelClass} ${maxWidthClass} ${panelClassName} shadow-[0_-8px_40px_rgba(15,23,42,.12)] sm:shadow-2xl`;

  const centeredBodyScroll =
    centered && !composeWizard && !fullscreen
      ? composeMenu
        ? EXPLORE_COMPOSE.pickerBody
        : centeredPopup
          ? exploreCenteredSheetPopupBodyClass
          : CONSUMER_MODAL_LAYOUT.scrollBody
      : undefined;

  const composeScrollClass = composeWizard
    ? `compose-sheet-scroll compose-form-shell ${CONSUMER_MODAL_LAYOUT.scrollBody} w-full min-w-0 flex-col ${EXPLORE_COMPOSE.wizardScrollPadX} ${EXPLORE_COMPOSE_IMMERSIVE.scrollPadBottom} md:overflow-y-auto md:flex-1 md:pt-0`
    : pullDismissGestures && !panelClassName.includes('overflow-hidden')
      ? `${CONSUMER_MODAL_LAYOUT.scrollBody} min-w-0 flex-col`
      : undefined;

  const defaultBodyScroll =
    !fullscreen && !composeFab && !composeScrollClass && !centeredBodyScroll
      ? CONSUMER_MODAL_LAYOUT.scrollBody
      : undefined;
  const panelBodyScrollClass = composeScrollClass ?? centeredBodyScroll ?? defaultBodyScroll;

  const dragHandle = pullDismissGestures ? (
    <div className="shrink-0 max-md:block md:hidden">
      <MobileSheetDragHandle dragZoneProps={dragZoneProps} />
    </div>
  ) : showHandle && !centered && !composeFab ? (
    <div className={`mb-2 mt-3 sm:hidden ${EXPLORE_SHAPE.sheetHandle}`} />
  ) : composeWizard ? (
    <div className={`mb-2 mt-3 max-md:block md:hidden ${EXPLORE_SHAPE.sheetHandle}`} />
  ) : null;

  const overlayInsetClass = composeFab
    ? CONSUMER_MAIN_OVERLAY_INSET
    : overlayFixed && !overlayContained
      ? CONSUMER_MAIN_OVERLAY_INSET
      : `${overlayPosition} inset-0`;

  const overlayScrimClass = composeWizard
    ? `${EXPLORE_SHEET.scrim} md:!bg-white`
    : EXPLORE_SHEET.scrim;

  const sheetTree = (
    <div
      className={`${overlayInsetClass} ${zClass} flex ${shellClass} ${
        fullscreen ? '' : overlayScrimClass
      } ${overlayFixed || overlayContained || composeFab ? 'pointer-events-auto' : ''} ${
        overlayFixed || fullscreen || composeFab || overlayContained ? '' : 'lg:fixed'
      }`}
      style={pullDismissGestures ? overlayStyle : undefined}
    >
      {showBackdropDismiss ? (
        <button
          type="button"
          className="absolute inset-0 z-0"
          aria-label="Close"
          onClick={onClose}
        />
      ) : composeWizard ? (
        <button
          type="button"
          className="absolute inset-0 z-0 max-md:block md:hidden"
          aria-label="Close"
          onClick={onClose}
        />
      ) : null}
      <div
        ref={composeFab || pullDismissGestures ? mergePanelRef : panelRef}
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
            className={
              composeMenu || composePlainClose
                ? exploreComposeMenuCloseButtonClass
                : exploreDesktopPopupCloseButtonClass
            }
            aria-label="Close"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        ) : null}
        {dragHandle}
        {panelBodyScrollClass ? <div className={panelBodyScrollClass}>{children}</div> : children}
      </div>
    </div>
  );

  if ((composeFab || (overlayFixed && !overlayContained)) && typeof document !== 'undefined') {
    return createPortal(sheetTree, document.body);
  }

  return sheetTree;
};
