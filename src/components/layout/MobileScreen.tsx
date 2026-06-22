import { ReactNode } from 'react';
import { MobileBackButton } from '../mobile/MobileBackButton';

interface MobileScreenProps {
  title: string;
  backTo?: string;
  backLabel?: string;
  children: ReactNode;
}

/** Stacked sub-screen — compact nav bar with thin title strip. */
export const MobileScreen = ({
  title,
  backTo = '/profile',
  backLabel = 'Back',
  children,
}: MobileScreenProps) => (
  <div className="min-h-[calc(100dvh-var(--nav-height))] md:min-h-screen consumer-bg md:bg-gray-50 flex flex-col">
    <div className="sticky top-0 z-30 shrink-0 consumer-top-strip md:bg-white/90 md:border-b md:border-gray-100">
      <div className="max-w-2xl mx-auto px-4 pt-safe-plus-2 pb-2.5">
        <div className="relative flex items-center min-h-[40px]">
          <div className="absolute left-0 z-10">
            <MobileBackButton fallbackTo={backTo} label={backLabel} />
          </div>
          <h1 className="flex-1 text-center consumer-tab-title truncate px-14">{title}</h1>
        </div>
      </div>
    </div>
    <div className="flex-1 flex flex-col min-h-0 max-w-2xl mx-auto w-full px-4 py-4 md:py-6">{children}</div>
  </div>
);
