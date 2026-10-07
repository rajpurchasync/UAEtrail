import { Navigate } from 'react-router-dom';
import { tripsPlansPath } from '../trips/tripsRouting';

/** Legacy saved-map URL → trips plans. */
export const ProfileWishlist = () => <Navigate to={tripsPlansPath('all')} replace />;
