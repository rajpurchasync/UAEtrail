import { ReactNode, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api/index';
import { getActiveTenantId } from '../api/tenant';
import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { FilterChips } from '../components/mobile/FilterChips';
import { HOST_CONSOLE_LINKS } from '../constants';
import { HOST_PROFILE_PATH, PROFILE_PATH } from '../config/routingCatalog';
import { ConsoleRatingChip } from './ConsoleRatingChip';

interface ConsoleShellProps {
  title: string;
  children: ReactNode;
  cta?: ReactNode;
  headerExtra?: ReactNode;
}

/** Layout for `/host/*` publishing console (tenant scope header; host is a user kind). */
export const ConsoleShell = ({ title, children, cta, headerExtra }: ConsoleShellProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState(0);

  const navOptions = HOST_CONSOLE_LINKS.map((link) => ({
    key: link.to,
    label: link.label,
  }));

  const activePath =
    HOST_CONSOLE_LINKS.find((link) => location.pathname === link.to)?.to ??
    HOST_CONSOLE_LINKS.find((link) => location.pathname.startsWith(`${link.to}/`))?.to ??
    location.pathname;

  useEffect(() => {
    const tenantId = getActiveTenantId();
    if (!tenantId) return;
    api.getOrganisationReviews(tenantId)
      .then((res) => {
        const reviews = res.data;
        setReviewCount(reviews.length);
        if (reviews.length > 0) {
          setAvgRating(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length);
        }
      })
      .catch(() => undefined);
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
            onClick={() => navigate(HOST_PROFILE_PATH)}
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
