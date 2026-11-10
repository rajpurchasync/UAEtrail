import type { ReactNode } from 'react';
import { ExploreDesktopBrowseRailResizeHandle } from './ExploreDesktopBrowseRailResizeHandle';

/** Resize gutter — matches Tailwind `w-3` (12px); kept out of scroll column width math in CSS. */
export const EXPLORE_BROWSE_RAIL_HANDLE_WIDTH_PX = 12;

type ResizeProps = {
  width: number;
  maxWidth: number;
  ariaLabel: string;
  onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void;
};

type Props = {
  /** Outer track width — includes resize gutter when `showResizeHandle` is true. */
  width: number;
  maxWidth: number;
  ariaLabel: string;
  children: ReactNode;
  showResizeHandle: boolean;
  resize: ResizeProps;
};

/**
 * Desktop explore left rail — scroll column and resize gutter are siblings (gutter never stacks on the scrollbar).
 */
export const ExploreDesktopBrowseRailShell = ({
  width,
  maxWidth,
  ariaLabel,
  children,
  showResizeHandle,
  resize,
}: Props) => (
  <div
    className="pointer-events-auto flex h-full min-h-0 shrink-0 flex-row overflow-hidden bg-white shadow-[16px_0_40px_rgba(15,23,42,0.12)] dark:bg-neutral-950"
    style={{ width, maxWidth }}
    role="group"
    aria-label={ariaLabel}
  >
    <div
      className="explore-desktop-browse-rail__content flex min-h-0 min-w-0 w-full flex-1 flex-col overflow-hidden"
      data-explore-browse-rail-content
    >
      {children}
    </div>
    {showResizeHandle ? (
      <ExploreDesktopBrowseRailResizeHandle
        width={width}
        maxWidth={maxWidth}
        ariaLabel={resize.ariaLabel}
        onPointerDown={resize.onPointerDown}
        onKeyDown={resize.onKeyDown}
      />
    ) : null}
  </div>
);
