import { ReactNode, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../../api/services';
import { getActiveTenantId } from '../../api/tenant';
import { ConsumerShell } from '../mobile/ConsumerShell';
import { FilterChips } from '../mobile/FilterChips';
import { HOST_DASHBOARD_LINKS } from '../../constants';
import { HostRatingChip } from './HostRatingChip';

interface HostShellProps {
  title: string;
  children: ReactNode;
  cta?: ReactNode;
  headerExtra?: ReactNode;
}

export const HostShell = ({ title, children, cta, headerExtra }: HostShellProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState(0);

  const navOptions = HOST_DASHBOARD_LINKS.map((link) => ({
    key: link.to,
    label: link.label,
  }));

  const activePath =
    HOST_DASHBOARD_LINKS.find((link) => location.pathname === link.to)?.to ??
    HOST_DASHBOARD_LINKS.find((link) => location.pathname.startsWith(`${link.to}/`))?.to ??
    location.pathname;

  useEffect(() => {
    const tenantId = getActiveTenantId();
    if (!tenantId) return;
    api.getReviews('tenant', tenantId)
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
      back={{ fallbackTo: '/profile', label: 'Profile' }}
      action={
        avgRating !== null ? (
          <HostRatingChip
            rating={avgRating}
            reviewCount={reviewCount}
            onClick={() => navigate('/host/profile')}
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
