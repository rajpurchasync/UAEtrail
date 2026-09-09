import { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../../api/services';
import { getActiveTenantId } from '../../api/tenant';
import { ConsumerShell } from '../mobile/ConsumerShell';
import { FilterChips } from '../mobile/FilterChips';
import { HOST_DASHBOARD_LINKS } from '../../constants';
import { PAGE_BANNERS } from '../../config/pageBanners';
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
      banner={{ src: PAGE_BANNERS.organizer, alt: 'Host dashboard' }}
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
          <div className="hidden md:block relative overflow-hidden rounded-2xl border border-emerald-100/80 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 px-4 py-3 text-white">
            <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-white/15 blur-xl" aria-hidden />
            <p className="text-[11px] uppercase tracking-[0.18em] font-semibold text-white/80">Host dashboard</p>
            <h2 className="mt-0.5 text-lg font-bold leading-tight">{title}</h2>
            <p className="mt-0.5 text-xs text-white/90">Manage activities, team, venues, and join requests.</p>
          </div>
          {headerExtra}
          <FilterChips
            options={navOptions}
            value={activePath}
            onChange={(path) => navigate(path)}
            variant="neutral"
          />
          <div className="hidden items-center justify-between gap-3 md:flex">
            <Link
              to="/"
              className="shrink-0 text-sm font-medium text-neutral-600 hover:text-emerald-700 whitespace-nowrap"
            >
              Landing page
            </Link>
            {cta && <div className="shrink-0">{cta}</div>}
          </div>
          {cta && <div className="flex justify-end md:hidden">{cta}</div>}
        </div>
      }
    >
      <div className="mx-auto w-full max-w-5xl pb-nav-safe">{children}</div>
    </ConsumerShell>
  );
};
