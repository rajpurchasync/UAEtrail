import { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getActiveTenantId } from '../../api/tenant';
import { useOrganisationConsoleRating } from '../../hooks/usePublishingConsoleQueries';
import { ConsumerShell } from '../../components/mobile/ConsumerShell';
import { ConsumerHeaderActions } from '../../components/layout/ConsumerHeaderActions';
import { FilterChips } from '../../components/mobile/FilterChips';
import { OPERATOR_PROFILE_PATH } from '../../config/routingCatalog';
import { useProfileHubBackChrome } from '../../hooks/useProfileHubBackChrome';
import { ConsoleRatingChip } from './ConsoleRatingChip';
import { operatorDeskNavLinksForKind } from './modules';
import { useActiveOperatorDeskKind } from './useActiveOperatorDeskKind';
import {
  publishingProfileKindToDeskBrand,
  workspaceConsoleLabel,
} from '../../content/workspaceVocabulary';

interface ConsoleShellProps {
  title?: string;
  children: ReactNode;
  cta?: ReactNode;
  headerExtra?: ReactNode;
}

/** Operator desk shell — SPA `/operator/*` (HTTP tenant API stays `/publishing/*`). */
export const ConsoleShell = ({ title, children, cta, headerExtra }: ConsoleShellProps) => {
  const backChrome = useProfileHubBackChrome();
  const location = useLocation();
  const navigate = useNavigate();
  const deskKind = useActiveOperatorDeskKind();
  const deskBrand = publishingProfileKindToDeskBrand(deskKind);
  const shellTitle = title ?? workspaceConsoleLabel(deskBrand);

  const tenantId = getActiveTenantId();
  const { data: rating } = useOrganisationConsoleRating(tenantId);
  const avgRating = rating?.avgRating ?? null;
  const reviewCount = rating?.reviewCount ?? 0;

  const navLinks = operatorDeskNavLinksForKind(deskKind);
  const navOptions = navLinks.map((link) => ({
    key: link.to,
    label: link.label,
  }));

  const activePath =
    navLinks.find((link) => location.pathname === link.to)?.to ??
    navLinks.find((link) => location.pathname.startsWith(`${link.to}/`))?.to ??
    location.pathname;

  return (
    <ConsumerShell
      layout="stack"
      title={shellTitle}
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
