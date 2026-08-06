import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ReactNode } from 'react';
import { MobileMenuButton } from '../layout/MobileMenu';
import { ProfileAvatarLink } from '../layout/ProfileAvatarLink';

interface MobileDetailShellProps {
  backTo: string;
  backLabel?: string;
  children: ReactNode;
  /** Optional right-side header action (e.g. cart button) */
  headerAction?: ReactNode;
  /** Optional fixed bottom action (e.g. join CTA) */
  footer?: ReactNode;
}

/** Mobile detail page with back navigation and optional sticky footer CTA. */
export const MobileDetailShell = ({ backTo, backLabel = 'Back', children, headerAction, footer }: MobileDetailShellProps) => (
  <div className={`min-h-screen consumer-bg md:bg-gray-50 ${footer ? 'pb-cta-safe md:pb-8' : ''}`}>
    <div className="md:hidden sticky top-0 z-30 glass-header">
      <div className="max-w-6xl mx-auto px-4 pt-safe-plus-2 pb-2 flex items-center justify-between gap-2">
        <Link
          to={backTo}
          className="inline-flex items-center gap-0.5 -ml-2 pl-1 pr-2 py-1 text-emerald-600 active:opacity-60"
          aria-label={backLabel}
        >
          <ChevronLeft className="w-6 h-6" strokeWidth={2.25} />
          <span className="text-[17px]">{backLabel}</span>
        </Link>
        <div className="flex items-center gap-2 shrink-0">
          <ProfileAvatarLink />
          {headerAction}
          <MobileMenuButton />
        </div>
      </div>
    </div>
    {children}
    {footer && (
      <div className="md:hidden fixed inset-x-0 bottom-0 z-40 px-4 pb-safe">{footer}</div>
    )}
  </div>
);
