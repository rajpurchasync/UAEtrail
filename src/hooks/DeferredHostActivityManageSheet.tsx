import { lazy, Suspense, useCallback, useState } from 'react';
import type { ActivityDTO } from '@uaetrail/shared-types';
import type { ActivityManageInitialView } from '../components/activity/activityManageViews';

const LazyHostActivityManageSheet = lazy(() =>
  import('./HostActivityManageSheetMount').then((module) => ({
    default: module.HostActivityManageSheetMount,
  }))
);

type SheetProps = {
  tenantId: string;
  manageActivity: ActivityDTO;
  manageInitialView: ActivityManageInitialView;
  onClose: () => void;
  onMapDataChanged: () => void | Promise<void>;
  onOpenPublicPage: (activity: ActivityDTO) => void;
  onShare: (activity: ActivityDTO) => void;
};

const HostManageSheetLazy = (props: SheetProps) => (
  <Suspense fallback={null}>
    <LazyHostActivityManageSheet {...props} />
  </Suspense>
);

export const useDeferredHostManageSheet = (input: {
  tenantId: string | null | undefined;
  onMapDataChanged: () => void | Promise<void>;
  onOpenPublicPage: (activity: ActivityDTO) => void;
  onShare: (activity: ActivityDTO) => void;
}) => {
  const [manageActivity, setManageActivity] = useState<ActivityDTO | null>(null);
  const [manageInitialView, setManageInitialView] =
    useState<ActivityManageInitialView>('overview');

  const openHostManage = useCallback(
    (activity: ActivityDTO, initialView: ActivityManageInitialView = 'participants') => {
      setManageActivity(activity);
      setManageInitialView(initialView);
    },
    []
  );

  const closeManage = useCallback(() => {
    setManageActivity(null);
    setManageInitialView('overview');
  }, []);

  const hostManageSheet =
    input.tenantId && manageActivity ? (
      <HostManageSheetLazy
        tenantId={input.tenantId}
        manageActivity={manageActivity}
        manageInitialView={manageInitialView}
        onClose={closeManage}
        onMapDataChanged={input.onMapDataChanged}
        onOpenPublicPage={input.onOpenPublicPage}
        onShare={input.onShare}
      />
    ) : null;

  return { openHostManage, closeManage, hostManageSheet };
};
