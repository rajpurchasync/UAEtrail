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
  /** Keep `label` as declared — do not rewrite from the in-app back stack while the view loads. */
  preferDeclaredLabel?: boolean;
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
  preferDeclaredLabel = false,
}: MobileBackButtonProps) => {
  const navigate = useNavigate();
  const { key: locationKey } = useLocation();

  const effectiveLabel = useMemo(() => {
    if (!label) return label;
    // Local dismiss (sheet / overlay) — do not replace with history destination ("Explore").
    if (onPress || preferDeclaredLabel) return label;
    return resolveBackLabel(peekBackTarget(fallbackTo), fallbackTo, label);
    // Recompute whenever the router lands on a new entry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fallbackTo, label, locationKey, onPress]);

  const handleBack = () => {
    navigateBack(navigate, fallbackTo);
  };

  const buttonClass =
    tone === 'light' ? 'text-white/90 hover:text-white' : 'text-emerald-700/90 hover:text-emerald-800';

  return (
    <button
      type="button"
      onClick={onPress ?? handleBack}
      className={`mobile-back-control inline-flex items-center gap-1 min-h-[44px] text-base font-semibold ${buttonClass} ${className}`}
      aria-label={!effectiveLabel || effectiveLabel === 'Back' ? 'Go back' : `Back to ${effectiveLabel}`}
    >
      <ChevronLeft className="h-6 w-6 shrink-0" strokeWidth={2.4} />
      {effectiveLabel ? <span className="truncate">{effectiveLabel}</span> : null}
    </button>
  );
};
