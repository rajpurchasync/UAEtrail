import { Navigate, useSearchParams } from 'react-router-dom';
import { OPERATOR_PROFILE_PATH, parseOrganisationKind } from '../../config/routingCatalog';

/** Inbound only — live manage UI lives on `/operator/profile`. */
export const Manage = () => {
  const [searchParams] = useSearchParams();
  const kind = parseOrganisationKind(searchParams.get('kind'));
  const target =
    kind != null ? `${OPERATOR_PROFILE_PATH}?kind=${encodeURIComponent(kind)}` : OPERATOR_PROFILE_PATH;
  return <Navigate to={target} replace />;
};