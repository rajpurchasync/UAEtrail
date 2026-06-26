import { Link } from 'react-router-dom';
import { Mountain } from 'lucide-react';
import { MobileMenuButton } from './MobileMenu';

interface MobileBrandBarProps {
  tone?: 'light' | 'default';
  className?: string;
}

/** Logo + hamburger row for mobile banner headers (PWA). */
export const MobileBrandBar = ({ tone = 'light', className = '' }: MobileBrandBarProps) => (
  <div className={`flex justify-between items-center gap-3 ${className}`}>
    <Link to="/" className="flex items-center gap-2 min-w-0">
      <div className="w-8 h-8 shrink-0 bg-gradient-to-br from-emerald-400 to-emerald-700 rounded-lg flex items-center justify-center">
        <Mountain className="w-4 h-4 text-white" />
      </div>
      <span
        className={`text-base font-bold tracking-tight truncate ${
          tone === 'light' ? 'text-white' : 'text-gray-900'
        }`}
      >
        UAE Trail
      </span>
    </Link>
    <MobileMenuButton tone={tone} />
  </div>
);
