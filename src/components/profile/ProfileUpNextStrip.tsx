import { Link, useNavigate } from 'react-router-dom';
import { UpcomingPlanCard } from '../../pages/activities/UpcomingPlanCard';
import { EXPLORE_MAP_PATH } from '../../config/platform';
import {
  PRODUCT_EXPLORE_CTA,
  PRODUCT_PROFILE_UP_NEXT_EMPTY_BODY,
  PRODUCT_PROFILE_UP_NEXT_EMPTY_TITLE,
} from '../../content/productNorthStar';
import type { UpcomingPlanRow } from '../../utils/activityHubSections';
import { GlassCard } from '../mobile/GlassCard';

type ProfileUpNextStripProps = {
  plans: UpcomingPlanRow[];
  loading: boolean;
};

/** Compact upcoming rail on profile — deep link to My trips for the full list. */
export const ProfileUpNextStrip = ({ plans, loading }: ProfileUpNextStripProps) => {
  const navigate = useNavigate();

  if (loading) return null;

  const preview = plans.slice(0, 3);

  return (
    <section aria-label="Up next">
      <div className="mb-2 flex items-center justify-between gap-2 px-0.5">
        <h2 className="text-sm font-bold text-neutral-900">Up next</h2>
        <Link
          to="/trips?segment=upcoming&tab=joined"
          className="text-xs font-semibold text-emerald-700"
        >
          My trips
        </Link>
      </div>

      {preview.length === 0 ? (
        <GlassCard padding className="text-center">
          <p className="text-sm font-semibold text-neutral-900">{PRODUCT_PROFILE_UP_NEXT_EMPTY_TITLE}</p>
          <p className="mt-1 text-xs text-neutral-500 leading-relaxed">{PRODUCT_PROFILE_UP_NEXT_EMPTY_BODY}</p>
          <Link
            to={EXPLORE_MAP_PATH}
            className="mt-3 inline-block text-sm font-semibold text-emerald-700"
          >
            {PRODUCT_EXPLORE_CTA}
          </Link>
        </GlassCard>
      ) : (
        <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 scrollbar-none snap-x snap-mandatory">
          {preview.map((row) => (
            <UpcomingPlanCard
              key={row.kind === 'confirmed' ? row.activity.id : row.request.id}
              row={row}
              onClick={() =>
                navigate(
                  row.kind === 'confirmed'
                    ? `/activity/${row.activity.id}`
                    : `/activity/${row.request.activity.id}`
                )
              }
            />
          ))}
        </div>
      )}
    </section>
  );
};
