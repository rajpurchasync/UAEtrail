import { Navigate } from 'react-router-dom';
import { myTripsWishlistPath } from '../trips/tripsRouting';

/** Legacy saved-map URL → profile wishlist segment. */
export const ProfileWishlist = () => <Navigate to={myTripsWishlistPath()} replace />;
