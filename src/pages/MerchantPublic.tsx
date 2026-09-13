import { Navigate, useParams } from 'react-router-dom';
import { shopPublicPath } from '../utils/shopPaths';

/** Legacy alias — canonical public shop URL is `/shop/:id`. */
export const MerchantPublic = () => {
  const { id } = useParams<{ id: string }>();
  if (!id) return <Navigate to="/explore?panel=shops&list=1&filter=shops" replace />;
  return <Navigate to={shopPublicPath({ id })} replace />;
};
