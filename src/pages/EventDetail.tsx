import { Navigate, useParams } from 'react-router-dom';
import { canonicalPlaceDetailPath } from '@uaetrail/shared-types';

/** Legacy `/venue/:id` → canonical `/place/:id`. */
export const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  if (!id) return <Navigate to="/explore" replace />;
  return <Navigate to={canonicalPlaceDetailPath(id)} replace />;
};
