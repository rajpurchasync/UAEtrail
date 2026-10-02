import { EXPLORE_MAP_PATH } from '../config/routingCatalog';
import { Navigate } from 'react-router-dom';

/** Legacy membership marketing — rewards wallet removed; send guests to the map. */
export const Membership = () => <Navigate to={EXPLORE_MAP_PATH} replace />;
