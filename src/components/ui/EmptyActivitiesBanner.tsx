import {
  EXPLORE_MAP_PATH,
  PRO_MEMBERSHIP_PATH,
  SIGNUP_PATH,
  planHostedSchedulePath,
} from '../../config/routingCatalog';
import { Link } from 'react-router-dom';
import { Plus, Sun } from 'lucide-react';


import { useAuth } from '../../context/AuthContext';
import { useMemberStatus } from '../../hooks/useMemberStatus';

/** Shown when there are no upcoming activities. */
export const EmptyActivitiesBanner = () => {
  const { user } = useAuth();
  const { canAccessPublishingWorkspace, canPublish } = useMemberStatus({ enabled: Boolean(user) });
  const canHost = canAccessPublishingWorkspace;
  const memberHostCtaPath = canPublish ? EXPLORE_MAP_PATH : PRO_MEMBERSHIP_PATH;

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
            to={planHostedSchedulePath()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-full text-sm font-semibold hover:bg-emerald-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Organize an outing
          </Link>
        ) : user ? (
          <Link
            to={memberHostCtaPath}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-full text-sm font-semibold hover:bg-emerald-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {canPublish ? 'Organize on the map' : 'Pro Membership'}
          </Link>
        ) : (
          <Link
            to={SIGNUP_PATH}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-full text-sm font-semibold hover:bg-emerald-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Organize an outing
          </Link>
        )}
      </div>
    </div>
  );
};

