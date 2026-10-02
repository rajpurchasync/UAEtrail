import { Navigate } from 'react-router-dom';
import { tripsPlansPath } from '../config/routingCatalog';

/** Wishlist lives under Trips → Wishlist. */
export const ProfileWishlist = () => <Navigate to={tripsPlansPath('wishlist')} replace />;
