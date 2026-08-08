import { ChevronLeft } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { buildLogicalBreadcrumbs } from '../../utils/logicalBreadcrumbs';

interface MobileBackButtonProps {
  fallbackTo?: string;
  label?: string;
  className?: string;
}

/** Logical route breadcrumb navigation with clickable parent links. */
export const MobileBackButton = ({
  fallbackTo = '/',
  label = 'Back',
  className = '',
}: MobileBackButtonProps) => {
  const location = useLocation();
  const journey = buildLogicalBreadcrumbs(location.pathname, location.search, {
    fallbackTo,
    fallbackLabel: label,
  });

  return (
    <nav className={`flex items-center gap-1 text-sm overflow-x-auto whitespace-nowrap scrollbar-none py-1 ${className}`} aria-label="Page journey">
      {journey.map((item, index) => {
        const isLast = index === journey.length - 1;
        return (
          <div key={`${item.path}-${index}`} className="inline-flex items-center gap-1">
            {isLast ? (
              <span className="font-semibold text-emerald-700">{item.label}</span>
            ) : (
              <Link to={item.path} className="text-emerald-700/90 hover:text-emerald-800">
                {item.label}
              </Link>
            )}
            {!isLast && <ChevronLeft className="w-3.5 h-3.5 rotate-180 text-emerald-400" strokeWidth={2.25} />}
          </div>
        );
      })}
    </nav>
  );
};
