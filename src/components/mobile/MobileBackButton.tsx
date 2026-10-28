import { useMemo } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { navigateBack, peekBackTarget } from '../../utils/backStack';
import { resolveBackLabel } from '../../utils/backLabel';

interface MobileBackButtonProps {
  fallbackTo?: string;
  label?: string;
  className?: string;
  tone?: 'default' | 'light';
  /** Kept for callers. Back always resolves through the in-app back stack. */
  backBehavior?: 'history' | 'fallback';
  /** When set, skips built-in back navigation (e.g. list category → home). */
  onPress?: () => void;
}

/**
 * Mobile back control — returns to the screen the member came from (in-app
 * history, scroll + focus restored) or opens `fallbackTo` as the parent when
 * there is nothing underneath (deep link / fresh tab).
 */
export const MobileBackButton = ({
  fallbackTo = '/',
  label = 'Back',
  className = '',
  tone = 'default',
  onPress,
}: MobileBackButtonProps) => {
  const navigate = useNavigate();
  const { key: locationKey } = useLocation();

  const effectiveLabel = useMemo(
    () => (label ? resolveBackLabel(peekBackTarget(fallbackTo), fallbackTo, label) : label),
    // Recompute whenever the router lands on a new entry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fallbackTo, label, locationKey]
  );

  const handleBack = () => {
    navigateBack(navigate, fallbackTo);
  };

  const buttonClass =
    tone === 'light' ? 'text-white/90 hover:text-white' : 'text-emerald-700/90 hover:text-emerald-800';

  return (
    <button
      type="button"
      onClick={onPress ?? handleBack}
      className={`inline-flex items-center gap-0.5 min-h-[44px] text-sm font-medium ${buttonClass} ${className}`}
      aria-label={!effectiveLabel || effectiveLabel === 'Back' ? 'Go back' : `Back to ${effectiveLabel}`}
    >
      <ChevronLeft className="w-5 h-5 shrink-0" strokeWidth={2.25} />
      {effectiveLabel ? <span className="truncate">{effectiveLabel}</span> : null}
    </button>
  );
};
