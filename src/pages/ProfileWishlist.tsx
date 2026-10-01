import { Navigate } from 'react-router-dom';

/** Wishlist lives under Trips → Wishlist. */
export const ProfileWishlist = () => <Navigate to="/trips?segment=wishlist&tab=joined" replace />;
