import { useHomeLandingActivities } from '../../../../hooks/useHomeLandingActivities';
import { HomeActivitiesSection } from './HomeActivitiesSection';

/** Activities rail + API — split for lazy / deferred loading on guest home. */
export const HomeActivitiesBlock = () => {
  const { activities, loading, error, refetch } = useHomeLandingActivities();
  return (
    <HomeActivitiesSection
      activities={activities}
      loading={loading}
      error={error}
      onRetry={refetch}
    />
  );
};
