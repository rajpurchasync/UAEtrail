import type { ReactNode } from 'react';
import { MobileDetailShell } from '../mobile/MobileDetailShell';

type EntityPublicDetailShellProps = {
  backTo: string;
  backLabel?: string;
  children: ReactNode;
  headerAction?: ReactNode;
  showMenu?: boolean;
  footer?: ReactNode;
  banner?: {
    src: string;
    alt?: string;
    title?: string;
    eyebrow?: string;
    linkTo?: string;
    desktopChromeOnly?: boolean;
    desktopAction?: ReactNode;
    showMobileChrome?: boolean;
    showJourney?: boolean;
    journeyFallbackTo?: string;
    journeyLabel?: string;
  };
  maxWidthClass?: string;
};

/**
 * Shared chrome for public catalog entities (shop, guide/agency storefront).
 * Body components stay tenant-specific; shell matches activity/place detail (S9 Phase 5).
 */
export const EntityPublicDetailShell = ({
  children,
  maxWidthClass = 'max-w-3xl',
  ...shell
}: EntityPublicDetailShellProps) => (
  <MobileDetailShell {...shell} lockBodyScroll>
    <div
      className={`mx-auto flex h-full min-h-0 flex-1 flex-col overflow-x-clip overflow-y-auto ${maxWidthClass} px-4 py-4 pb-6 md:px-6 md:py-3 md:pb-3 lg:px-6 lg:py-2`}
    >
      {children}
    </div>
  </MobileDetailShell>
);
