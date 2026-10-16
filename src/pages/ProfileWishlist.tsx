import { Navigate } from 'react-router-dom';
import { planWishlistRedirectPath } from '../config/routingCatalog';

/** Legacy saved-map URL → profile wishlist segment. */
export const ProfileWishlist = () => <Navigate to={planWishlistRedirectPath()} replace />;
