import { type ReactNode } from 'react';
import { ExploreDesktopBrowseRailShell } from './ExploreDesktopBrowseRailShell';
import { maxExploreBrowseRailWidth } from './exploreDesktopBrowseRailWidth';
import { useExploreDesktopBrowseRailWidth } from './useExploreDesktopBrowseRailWidth';

const CREW_PANEL_WIDTH_STORAGE_KEY = 'uaetrail:explore-crew-panel-width';

type Props = {
  children: ReactNode;
  ariaLabel: string;
  className?: string;
};

/** Left-docked map panel (Find crew) — same resize affordance as the explore list drawer. */
export const ExploreDesktopDockedPanelRail = ({ children, ariaLabel, className = '' }: Props) => {
  const { width, onHandlePointerDown, nudgeWidth } = useExploreDesktopBrowseRailWidth({
    storageKey: CREW_PANEL_WIDTH_STORAGE_KEY,
  });

  const onHandleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 32 : 16;
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      nudgeWidth(step);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      nudgeWidth(-step);
    }
  };

  const maxWidth = maxExploreBrowseRailWidth();

  return (
    <ExploreDesktopBrowseRailShell
      width={width}
      maxWidth={maxWidth}
      ariaLabel={ariaLabel}
      showResizeHandle
      resize={{
        width,
        maxWidth,
        ariaLabel: 'Resize Find crew panel',
        onPointerDown: onHandlePointerDown,
        onKeyDown: onHandleKeyDown,
      }}
    >
      <div className={className}>{children}</div>
    </ExploreDesktopBrowseRailShell>
  );
};
