import { Navigate } from 'react-router-dom';
import { EXPLORE_MAP_PATH } from '../config/platform';

/** Legacy membership marketing — rewards wallet removed; send guests to the map. */
export const Membership = () => <Navigate to={EXPLORE_MAP_PATH} replace />;
