import { Link } from 'react-router-dom';
import { Plus, Sun } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { isHostRole } from '../../utils/roles';

/** Shown when there are no upcoming activities. */
export const EmptyActivitiesBanner = () => {
  const { user } = useAuth();
  const canHost = isHostRole(user?.role);

  return (
    <div className="rounded-[22px] glass-card px-6 py-10 text-center shadow-glass">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white shadow-sm mb-4">
        <Sun className="w-7 h-7 text-amber-500" strokeWidth={1.75} />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">It&apos;s off season — for now</h3>
      <p className="text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
        Hosts are planning the next hiking and camping adventures. Be the first to put something on the
        calendar.
      </p>
      <div className="mt-6 flex justify-center">
        {canHost ? (
          <Link
            to="/host/activities"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-full text-sm font-semibold hover:bg-emerald-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Host an activity
          </Link>
        ) : user ? (
          <Link
            to="/become-host"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-full text-sm font-semibold hover:bg-emerald-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Become a host
          </Link>
        ) : (
          <Link
            to="/signup"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-full text-sm font-semibold hover:bg-emerald-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Host an activity
          </Link>
        )}
      </div>
    </div>
  );
};

/** @deprecated Use EmptyActivitiesBanner */
export const EmptyTripsBanner = EmptyActivitiesBanner;
