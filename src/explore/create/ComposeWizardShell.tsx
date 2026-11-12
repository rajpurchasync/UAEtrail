import type { ReactNode } from 'react';
import { EXPLORE_Z } from '../../config/exploreTheme';
import { ExploreResponsiveSheet } from '../ui/ExploreResponsiveSheet';
import { COMPOSE_WIDE_SHEET_MAX_WIDTH } from './composeWideWizard';

export { FlowSheetChrome as ComposeWizardStepChrome } from '../ui/ExploreFlowSheetChrome';

const WIZARD_PANEL = 'pb-[calc(var(--safe-bottom)+1rem)] pt-0 lg:pb-6 lg:pt-2';

type ComposeWizardShellProps = {
  /** Map overlay takes the column; the sheet is not mounted while open. */
  mapOpen: boolean;
  mapOverlay: ReactNode | null;
  onClose: () => void;
  children: ReactNode;
  /** Host / Seek / Add use wide; facility stays compact. */
  layout?: 'wide' | 'compact';
  isMobile?: boolean;
};

/** FAB write-surface frame — map session first, then the wizard sheet. Engines stay split. */
export const ComposeWizardShell = ({
  mapOpen,
  mapOverlay,
  onClose,
  children,
  layout = 'wide',
  isMobile = false,
}: ComposeWizardShellProps) => {
  if (mapOpen && mapOverlay) return <>{mapOverlay}</>;
  return (
    <ExploreResponsiveSheet
      open
      onClose={onClose}
      zClass={EXPLORE_Z.composeFlow}
      overlayFixed
      composePresentation="wizard"
      showHandle={false}
      showCloseButton={false}
      maxWidthClass={
        layout === 'compact' ? undefined : isMobile ? 'lg:max-w-lg' : COMPOSE_WIDE_SHEET_MAX_WIDTH
      }
      panelClassName={WIZARD_PANEL}
    >
      {children}
    </ExploreResponsiveSheet>
  );
};
