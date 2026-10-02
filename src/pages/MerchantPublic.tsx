import { Navigate, useParams } from 'react-router-dom';
import { exploreShopsPath } from '../config/routingCatalog';
import { shopPublicPath } from '../utils/shopPaths';

/** Legacy alias — canonical public shop URL is `/shop/:id`. */
export const MerchantPublic = () => {
  const { id } = useParams<{ id: string }>();
  if (!id) return <Navigate to={exploreShopsPath()} replace />;
  return <Navigate to={shopPublicPath({ id })} replace />;
};
