import { ReactNode } from 'react';
import { ConsumerShell } from '../mobile/ConsumerShell';
import { MobileBackButton } from '../mobile/MobileBackButton';
import { PAGE_BANNERS } from '../../config/pageBanners';
import { MobileMenuButton } from './MobileMenu';
import { ProfileAvatarLink } from './ProfileAvatarLink';

interface MobileScreenProps {
  title: string;
  backTo?: string;
  backLabel?: string;
  /** Hide the top nav strip (e.g. full-height chat thread). */
  hideHeader?: boolean;
  children: ReactNode;
}

/** Stacked sub-screen — banner chrome + optional back row. */
export const MobileScreen = ({
  title,
  backTo = '/profile',
  backLabel = 'Back',
  hideHeader = false,
  children,
}: MobileScreenProps) => (
  <ConsumerShell
    layout="tab"
    title={title}
    maxWidth="4xl"
    banner={{ src: PAGE_BANNERS.profile, alt: title }}
  >
    {!hideHeader && (
      <div className="mb-3 -mt-2 flex items-center justify-between gap-3">
        <MobileBackButton fallbackTo={backTo} label={backLabel} />
        <div className="flex items-center gap-2 shrink-0">
          <ProfileAvatarLink />
          <MobileMenuButton />
        </div>
      </div>
    )}
    <div className={`flex-1 flex flex-col min-h-0 ${hideHeader ? 'pt-safe-plus-2' : ''}`}>{children}</div>
  </ConsumerShell>
);
