import { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ConsumerShell } from '../mobile/ConsumerShell';
import { FilterChips } from '../mobile/FilterChips';
import { ORGANIZER_DASHBOARD_LINKS } from '../../constants';
import { PAGE_BANNERS } from '../../config/pageBanners';

interface OrganizerShellProps {
  title: string;
  children: ReactNode;
  action?: ReactNode;
  /** Rendered above section nav (e.g. tenant switcher). */
  headerExtra?: ReactNode;
}

/** Unified organizer console chrome — consumer shell + horizontal section nav. */
export const OrganizerShell = ({ title, children, action, headerExtra }: OrganizerShellProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const navOptions = ORGANIZER_DASHBOARD_LINKS.map((link) => ({
    key: link.to,
    label: link.label,
  }));

  const activePath =
    ORGANIZER_DASHBOARD_LINKS.find((link) => location.pathname === link.to)?.to ??
    ORGANIZER_DASHBOARD_LINKS.find((link) => location.pathname.startsWith(`${link.to}/`))?.to ??
    location.pathname;

  return (
    <ConsumerShell
      layout="stack"
      title={title}
      banner={{ src: PAGE_BANNERS.organizer, alt: 'Organizer console' }}
      action={action}
      toolbar={
        <div className="space-y-2">
          {headerExtra}
          <FilterChips
            options={navOptions}
            value={activePath}
            onChange={(path) => navigate(path)}
            variant="neutral"
          />
        </div>
      }
    >
      <div className="max-w-5xl mx-auto w-full">{children}</div>
    </ConsumerShell>
  );
};
