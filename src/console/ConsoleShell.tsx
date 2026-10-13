import { ReactNode, useState } from 'react';
import { useSafeAsyncEffect } from '../hooks/useSafeAsyncEffect';
import { useLocation, useNavigate } from 'react-router-dom';
import { fetchOrganisationReviews } from '../hooks/organisationConsoleApi';
import { getActiveTenantId } from '../api/tenant';
import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { FilterChips } from '../components/mobile/FilterChips';
import { OPERATOR_CONSOLE_LINKS } from '../constants';
import { OPERATOR_PROFILE_PATH, PROFILE_PATH } from '../config/routingCatalog';
import { ConsoleRatingChip } from './ConsoleRatingChip';

interface ConsoleShellProps {
  title: string;
  children: ReactNode;
  cta?: ReactNode;
  headerExtra?: ReactNode;
}

/** Layout for `/operator/*` publishing workspace (tenant scope header). */
export const ConsoleShell = ({ title, children, cta, headerExtra }: ConsoleShellProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState(0);

  const navOptions = OPERATOR_CONSOLE_LINKS.map((link) => ({
    key: link.to,
    label: link.label,
  }));

  const activePath =
    OPERATOR_CONSOLE_LINKS.find((link) => location.pathname === link.to)?.to ??
    OPERATOR_CONSOLE_LINKS.find((link) => location.pathname.startsWith(`${link.to}/`))?.to ??
    location.pathname;

  useSafeAsyncEffect(async (isActive) => {
    const tenantId = getActiveTenantId();
    if (!tenantId) return;
    try {
      const reviews = await fetchOrganisationReviews(tenantId);
      if (!isActive()) return;
      setReviewCount(reviews.length);
      if (reviews.length > 0) {
        setAvgRating(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length);
      }
    } catch {
      // omit rating chip when reviews fail to load
    }
  }, []);

  return (
    <ConsumerShell
      layout="stack"
      title={title}
      showJourney={false}
      back={{ fallbackTo: PROFILE_PATH, label: 'Profile' }}
      action={
        avgRating !== null ? (
          <ConsoleRatingChip
            rating={avgRating}
            reviewCount={reviewCount}
            onClick={() => navigate(OPERATOR_PROFILE_PATH)}
          />
        ) : undefined
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
