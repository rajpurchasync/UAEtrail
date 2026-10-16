import { Link } from 'react-router-dom';
import { planJoinedSchedulePath } from '../../plan/planRouting';
import { explorePath } from '../routing';

/** Shown when explore is filtered to the signed-in member's activities + wishlist pins. */
export const ExploreMyPlanMapNotice = () => (
  <div className="mb-2 shrink-0 rounded-xl border border-emerald-200/80 bg-emerald-50/90 px-3 py-2.5 text-xs text-emerald-950">
    <p className="font-semibold">Your plan on the map</p>
    <p className="mt-0.5 leading-snug text-emerald-900/85">
      Saved places and activities you&apos;re in or waiting to join.
    </p>
    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
      <Link
        to={planJoinedSchedulePath()}
        className="font-semibold text-emerald-800 underline underline-offset-2"
      >
        My Plans
      </Link>
      <Link
        to={explorePath()}
        className="font-semibold text-emerald-800 underline underline-offset-2"
      >
        Full explore map
      </Link>
    </div>
  </div>
);

/** @deprecated Use {@link ExploreMyPlanMapNotice}. */
export const ExploreMyTripsModeNotice = ExploreMyPlanMapNotice;
