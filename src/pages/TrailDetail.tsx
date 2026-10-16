import { Navigate, useParams } from 'react-router-dom';
import { canonicalPlaceDetailPath } from '@uaetrail/shared-types';

/** Legacy `/trail/:id` → canonical `/place/:id`. */
export const TrailDetail = () => {
  const { id } = useParams<{ id: string }>();
  if (!id) return <Navigate to="/explore" replace />;
  return <Navigate to={canonicalPlaceDetailPath(id)} replace />;
};
