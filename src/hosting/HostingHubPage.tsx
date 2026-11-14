import { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { PullToRefresh } from '../components/mobile/PullToRefresh';
import { PageMeta } from '../components/seo/PageMeta';
import { HOSTING_HUB_PATH, PLAN_PATH } from '../config/routingCatalog';
import {
  PRODUCT_HOSTING_SCHEDULE_NAV_HINT,
  PRODUCT_HOSTING_SCHEDULE_NAV_LABEL,
} from '../content/productNorthStar';
import { exploreHostPath } from '../explore/routing';
import { useMemberStatus } from '../hooks/useMemberStatus';
import { memberCanManageHostedActivities } from '../utils/hostedActivitiesGate';
import { signInPathForReturn } from '../utils/authReturnContext';
import { HostingHubView } from './HostingHubView';
import { PlanHostingManageProvider } from '../plan/PlanHostingManageContext';
import { planJoinedSchedulePath } from '../plan/planRouting';

/** Dedicated community hosting hub — `/hosting` (not My Plans). */
export const HostingHubPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);
  const gate = useMemberStatus({ enabled: Boolean(user) });
  const canHost = memberCanManageHostedActivities(user, gate.canAccessPublishingWorkspace);

  const handleRefresh = useCallback(async () => {
    setRefreshKey((key) => key + 1);
  }, []);

  const handleOpenCompose = useCallback(() => {
    if (!user) {
      navigate(signInPathForReturn(HOSTING_HUB_PATH));
      return;
    }
    navigate(exploreHostPath());
  }, [navigate, user]);

  return (
    <>
      <PageMeta
        title={`${PRODUCT_HOSTING_SCHEDULE_NAV_LABEL} — UAE Trail`}
        description={PRODUCT_HOSTING_SCHEDULE_NAV_HINT}
        path={HOSTING_HUB_PATH}
      />

      <ConsumerShell
        layout="tab"
        title={PRODUCT_HOSTING_SCHEDULE_NAV_LABEL}
        suppressMobileHeader
        suppressMobileToolbarBorder
        maxWidth="4xl"
      >
        <PullToRefresh onRefresh={handleRefresh}>
          <div className="space-y-3 pt-0.5 pb-bottom-nav-safe md:space-y-1.5">
            {!user ? (
              <div className="glass-card space-y-3 p-6 text-center text-sm text-neutral-600">
                <p>Sign in to manage the outings you host.</p>
                <Link to={signInPathForReturn(HOSTING_HUB_PATH)} className="font-semibold text-emerald-700">
                  Sign in
                </Link>
              </div>
            ) : !canHost ? (
              <div className="glass-card space-y-3 p-6 text-center text-sm text-neutral-600">
                <p>Finish your host profile to open the Hosting hub.</p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Link to={PLAN_PATH} className="font-semibold text-emerald-700">
                    My Plans
                  </Link>
                  <Link to={planJoinedSchedulePath()} className="font-semibold text-emerald-700">
                    Joined outings
                  </Link>
                </div>
              </div>
            ) : (
              <PlanHostingManageProvider
                refreshKey={refreshKey}
                canHost={canHost}
                active
                scopedActivityLists
              >
                <HostingHubView refreshKey={refreshKey} onCreateNew={handleOpenCompose} />
              </PlanHostingManageProvider>
            )}
          </div>
        </PullToRefresh>
      </ConsumerShell>
    </>
  );
};
