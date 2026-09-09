import { Navigate } from 'react-router-dom';

/**
 * Paid membership checkout is disabled — Trail Points tiers replace this route.
 * Restore the full page from git history when `membershipEnabled` is turned on.
 */
export const Membership = () => <Navigate to="/trail-points" replace />;
