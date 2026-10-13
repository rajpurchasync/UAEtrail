import { Navigate } from 'react-router-dom';
import { myTripsWishlistPath } from '../member-plan/tripsRouting';

/** Legacy saved-map URL → profile wishlist segment. */
export const ProfileWishlist = () => <Navigate to={myTripsWishlistPath()} replace />;
