import { Navigate } from 'react-router-dom';
import { organisationManagePath } from '../config/routingCatalog';

/** @deprecated Use `/organisation/manage?kind=shop` — kept for legacy links. */
export const ShopManage = () => <Navigate to={organisationManagePath('shop')} replace />;
