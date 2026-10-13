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
  <MobileDetailShell {...shell}>
    <div className={`mx-auto ${maxWidthClass} px-4 py-6 md:py-8 pb-10`}>{children}</div>
  </MobileDetailShell>
);
