import { Navigate, useParams } from 'react-router-dom';
import { canonicalPlaceDetailPath } from '@uaetrail/shared-types';

/** Legacy `/camp/:id` → canonical `/place/:id`. */
export const CampDetail = () => {
  const { id } = useParams<{ id: string }>();
  if (!id) return <Navigate to="/explore" replace />;
  return <Navigate to={canonicalPlaceDetailPath(id)} replace />;
};
