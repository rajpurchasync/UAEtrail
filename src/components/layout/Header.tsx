import { MEMBER_HOME_PATH, joinAuthPath } from '../../config/routingCatalog';
import { Link, useLocation } from 'react-router-dom';
import { ProductNavLink } from '../navigation/ProductNavLink';
import { Mountain } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { buildSignInRedirect } from '../../utils/authReturnContext';
import { ConsumerHeaderActions } from './ConsumerHeaderActions';
import { DesktopAccountMenu } from './desktop/DesktopAccountMenu';

export const Header = () => {
  const { user } = useAuth();
  const { pathname, search } = useLocation();
  const { href: signInHref } = buildSignInRedirect({ pathname, search });

  return (
    <header className="bg-white/80 backdrop-blur-xl shadow-sm sticky top-0 z-50 border-b border-gray-100">
      <div className="w-full px-4 sm:px-5 lg:px-5">
        <div className="flex justify-between items-center h-11 lg:h-12">
          <Link
            to={user ? MEMBER_HOME_PATH : '/'}
            className="flex items-center space-x-2 lg:min-w-[12rem]"
            aria-label="UAE Trail home"
          >
            <div className="w-7 h-7 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-lg flex items-center justify-center lg:h-8 lg:w-8">
              <Mountain className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold text-gray-900 tracking-tight lg:text-base">UAE Trail</span>
          </Link>

          <div className="flex-1" />

          <div className="flex items-center gap-2 lg:min-w-[12rem] lg:justify-end">
            <ConsumerHeaderActions notificationVariant="desktop" showOnDesktop menuClassName="md:hidden" />
            {user ? (
              <div className="hidden md:block">
                <DesktopAccountMenu />
              </div>
            ) : (
              <>
                <ProductNavLink
                  to={signInHref}
                  className="hidden md:inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-100"
                >
                  Sign in
                </ProductNavLink>
                <ProductNavLink
                  to={joinAuthPath(MEMBER_HOME_PATH)}
                  className="hidden md:inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-colors text-sm font-semibold shadow-sm shadow-emerald-200/80"
                >
                  Join free
                </ProductNavLink>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
