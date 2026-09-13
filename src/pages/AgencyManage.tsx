import { Navigate } from 'react-router-dom';
import { organisationManagePath } from '../utils/organisationPaths';

/** @deprecated Use `/organisation/manage?kind=agency` — kept for legacy links. */
export const AgencyManage = () => <Navigate to={organisationManagePath('agency')} replace />;
