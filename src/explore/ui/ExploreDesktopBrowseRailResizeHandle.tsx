import { EXPLORE_BROWSE_RAIL_MIN_WIDTH } from './exploreDesktopBrowseRailWidth';

type Props = {
  width: number;
  maxWidth: number;
  ariaLabel?: string;
  onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void;
};

/** Right-edge splitter for explore browse rails — same grip as list/map `ListSideMapResizeHandle`. */
export const ExploreDesktopBrowseRailResizeHandle = ({
  width,
  maxWidth,
  ariaLabel = 'Resize panel',
  onPointerDown,
  onKeyDown,
}: Props) => (
  <div
    role="separator"
    aria-orientation="vertical"
    aria-label={ariaLabel}
    aria-valuemin={EXPLORE_BROWSE_RAIL_MIN_WIDTH}
    aria-valuemax={maxWidth}
    aria-valuenow={width}
    title="Drag to resize"
    tabIndex={0}
    onPointerDown={onPointerDown}
    onKeyDown={onKeyDown}
    className="group/resize flex w-3 shrink-0 cursor-ew-resize touch-none items-center justify-center self-stretch border-l border-neutral-200 bg-neutral-100 hover:bg-neutral-200/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 dark:border-neutral-600 dark:bg-neutral-900 dark:hover:bg-neutral-800"
    style={{ touchAction: 'none' }}
  >
    <span className="pointer-events-none relative flex flex-col gap-[3px]" aria-hidden>
      {Array.from({ length: 6 }, (_, index) => (
        <span
          key={index}
          className="h-[3px] w-[3px] rounded-full bg-neutral-400 shadow-[0_0_0_1px_rgba(255,255,255,.85)] transition-colors group-hover/resize:bg-neutral-600 group-focus-visible/resize:bg-neutral-600 dark:bg-neutral-500"
        />
      ))}
    </span>
  </div>
);
