import { Suspense, lazy } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { GuestGatedSurfaceLayout } from '../components/auth/GuestGatedSurfaceLayout';
import { useAuth } from '../context/AuthContext';
import { PRODUCT_PLAN_SURFACE_TITLE } from '../content/productNorthStar';
import {
  explorePath,
  inboundCreateParamToHostPath,
  parseActivityListFilter,
} from '../discovery/discoveryPortExploreRouting';
import { AsyncLoadingState } from '../components/ui/AsyncLoadingState';

const PlanPage = lazy(() => import('../plan/PlanPage').then((m) => ({ default: m.PlanPage })));

const PlanRouteFallback = () => <AsyncLoadingState variant="page" label="Loading your plan" />;

/** `/plan` — signed-in My Plans hub, or a guest handoff. Not part of the home bundle. */
export const PlanBrowseRoute = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab');
  const inboundCreatePath = inboundCreateParamToHostPath(searchParams.get('create'));
  if (inboundCreatePath) {
    return <Navigate to={inboundCreatePath} replace />;
  }
  if (user) {
    return (
      <Suspense fallback={<PlanRouteFallback />}>
        <PlanPage />
      </Suspense>
    );
  }
  if (tab === 'joined' || tab === 'hosted' || searchParams.get('checkin') || !tab) {
    return <GuestGatedSurfaceLayout title={PRODUCT_PLAN_SURFACE_TITLE} feature="plan" />;
  }
  const activity = parseActivityListFilter(searchParams.get('activity'), searchParams.get('filter'));
  return (
    <Navigate
      to={explorePath({
        activity: activity !== 'all' ? activity : undefined,
      })}
      replace
    />
  );
};
