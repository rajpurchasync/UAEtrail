import { useLocation, useNavigate } from 'react-router-dom';
import { useProductSearchParams } from '../../routing/useEffectiveLocation';
import { useExploreSearchParamRedirect } from '../shell/useExploreSearchParamRedirect';

/** Map + list inbound `?search=1` → `/explore/search?searchHome=1`. */
export const ExploreSearchInboundRedirectHost = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useProductSearchParams();
  useExploreSearchParamRedirect(searchParams, pathname, navigate, setSearchParams);
  return null;
};