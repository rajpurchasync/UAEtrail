import { ChevronLeft } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { buildLogicalBreadcrumbs } from '../../utils/logicalBreadcrumbs';

interface MobileBackButtonProps {
  fallbackTo?: string;
  label?: string;
  className?: string;
  tone?: 'default' | 'light';
}

/** Logical route breadcrumb navigation with clickable parent links. */
export const MobileBackButton = ({
  fallbackTo = '/',
  label = 'Back',
  className = '',
  tone = 'default',
}: MobileBackButtonProps) => {
  const location = useLocation();
  const journey = buildLogicalBreadcrumbs(location.pathname, location.search, {
    fallbackTo,
    fallbackLabel: label,
  });

  const linkClass =
    tone === 'light' ? 'text-white/85 hover:text-white' : 'text-emerald-700/90 hover:text-emerald-800';
  const currentClass = tone === 'light' ? 'font-semibold text-white' : 'font-semibold text-emerald-700';
  const separatorClass = tone === 'light' ? 'text-white/45' : 'text-emerald-400';

  return (
    <nav
      className={`flex items-center gap-1 text-xs sm:text-sm overflow-x-auto whitespace-nowrap scrollbar-none py-1 ${className}`}
      aria-label="Page journey"
    >
      {journey.map((item, index) => {
        const isLast = index === journey.length - 1;
        return (
          <div key={`${item.path}-${index}`} className="inline-flex items-center gap-1">
            {isLast ? (
              <span className={currentClass}>{item.label}</span>
            ) : (
              <Link to={item.path} className={linkClass}>
                {item.label}
              </Link>
            )}
            {!isLast && <ChevronLeft className={`w-3.5 h-3.5 rotate-180 ${separatorClass}`} strokeWidth={2.25} />}
          </div>
        );
      })}
    </nav>
  );
};
