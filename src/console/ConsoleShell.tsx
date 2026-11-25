import { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getActiveTenantId } from '../api/tenant';
import { useOrganisationConsoleRating } from '../hooks/usePublishingConsoleQueries';
import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { ConsumerHeaderActions } from '../components/layout/ConsumerHeaderActions';
import { FilterChips } from '../components/mobile/FilterChips';
import { OPERATOR_CONSOLE_LINKS } from '../constants';
import { OPERATOR_PROFILE_PATH } from '../config/routingCatalog';
import { useProfileHubBackChrome } from '../hooks/useProfileHubBackChrome';
import { ConsoleRatingChip } from './ConsoleRatingChip';

interface ConsoleShellProps {
  title: string;
  children: ReactNode;
  cta?: ReactNode;
  headerExtra?: ReactNode;
}

/** Layout for `/publishing/*` publishing workspace (tenant scope header). */
export const ConsoleShell = ({ title, children, cta, headerExtra }: ConsoleShellProps) => {
  const backChrome = useProfileHubBackChrome();
  const location = useLocation();
  const navigate = useNavigate();

  const tenantId = getActiveTenantId();
  const { data: rating } = useOrganisationConsoleRating(tenantId);
  const avgRating = rating?.avgRating ?? null;
  const reviewCount = rating?.reviewCount ?? 0;

  const navOptions = OPERATOR_CONSOLE_LINKS.map((link) => ({
    key: link.to,
    label: link.label,
  }));

  const activePath =
    OPERATOR_CONSOLE_LINKS.find((link) => location.pathname === link.to)?.to ??
    OPERATOR_CONSOLE_LINKS.find((link) => location.pathname.startsWith(`${link.to}/`))?.to ??
    location.pathname;

  return (
    <ConsumerShell
      layout="stack"
      title={title}
      showJourney={false}
      back={backChrome}
      action={
        <div className="flex shrink-0 items-center gap-0.5">
          {avgRating !== null ? (
            <ConsoleRatingChip
              rating={avgRating}
              reviewCount={reviewCount}
              onClick={() => navigate(OPERATOR_PROFILE_PATH)}
            />
          ) : null}
          {/* Publishing chrome hides global consumer hamburger — keep drawer on console headers. */}
          <ConsumerHeaderActions showOnDesktop={false} />
        </div>
      }
      toolbar={
        <div className="space-y-3">
          {headerExtra}
          <FilterChips
            options={navOptions}
            value={activePath}
            onChange={(path) => navigate(path)}
            variant="neutral"
          />
          {cta && <div className="flex justify-end">{cta}</div>}
        </div>
      }
    >
      <div className="mx-auto w-full max-w-5xl pb-nav-safe">{children}</div>
    </ConsumerShell>
  );
};
