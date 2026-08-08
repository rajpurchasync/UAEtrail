import { ReactNode, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../../api/services';
import { getActiveTenantId } from '../../api/tenant';
import { ConsumerShell } from '../mobile/ConsumerShell';
import { FilterChips } from '../mobile/FilterChips';
import { ORGANIZER_DASHBOARD_LINKS } from '../../constants';
import { PAGE_BANNERS } from '../../config/pageBanners';
import { OrganizerRatingChip } from './OrganizerRatingChip';

interface OrganizerShellProps {
  title: string;
  children: ReactNode;
  /** CTA button placed alongside the section nav (e.g. "Create" link). */
  cta?: ReactNode;
  /** Rendered above section nav (e.g. tenant switcher). */
  headerExtra?: ReactNode;
}

/** Unified organizer console chrome — banner with profile/bell/menu chrome + section nav. */
export const OrganizerShell = ({ title, children, cta, headerExtra }: OrganizerShellProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState(0);

  const navOptions = ORGANIZER_DASHBOARD_LINKS.map((link) => ({
    key: link.to,
    label: link.label,
  }));

  const activePath =
    ORGANIZER_DASHBOARD_LINKS.find((link) => location.pathname === link.to)?.to ??
    ORGANIZER_DASHBOARD_LINKS.find((link) => location.pathname.startsWith(`${link.to}/`))?.to ??
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
      layout="tab"
      title={title}
      showJourney={false}
      banner={{ src: PAGE_BANNERS.organizer, alt: 'Organizer console' }}
      action={
        avgRating !== null ? (
          <OrganizerRatingChip
            rating={avgRating}
            reviewCount={reviewCount}
            onClick={() => navigate('/organizer/profile')}
          />
        ) : undefined
      }
      toolbar={
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-2xl border border-emerald-100/80 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 px-4 py-3 text-white">
            <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-white/15 blur-xl" aria-hidden />
            <p className="text-[11px] uppercase tracking-[0.18em] font-semibold text-white/80">Organizer hub</p>
            <h2 className="text-lg font-bold leading-tight mt-0.5">{title}</h2>
            <p className="text-xs text-white/90 mt-0.5">Manage organization context, events, team, and requests.</p>
          </div>
          {headerExtra}
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <FilterChips
                options={navOptions}
                value={activePath}
                onChange={(path) => navigate(path)}
                variant="neutral"
              />
            </div>
            {cta && <div className="shrink-0">{cta}</div>}
          </div>
        </div>
      }
    >
      <div className="max-w-5xl mx-auto w-full">{children}</div>
    </ConsumerShell>
  );
};
