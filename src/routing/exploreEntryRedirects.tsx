import { Navigate } from 'react-router-dom';
import { explorePath } from '../explore/routing';
import { listPeopleDiscoveryPath } from '../list/browse/browseListRouting';

/** Legacy shop browse → explore shops panel. Loaded only when that route matches. */
export const ShopBrowseRoute = () => (
  <Navigate to={explorePath({ panel: 'shops', filter: 'shops' })} replace />
);

export const CalendarRedirect = () => (
  <Navigate to={explorePath({ panel: 'activities' })} replace />
);

export const PeopleRedirect = () => <Navigate to={listPeopleDiscoveryPath()} replace />;
