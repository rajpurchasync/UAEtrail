import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MobileBackButtonProps {
  fallbackTo?: string;
  label?: string;
  className?: string;
  tone?: 'default' | 'light';
  /** `history` uses browser back when possible; `fallback` always navigates to `fallbackTo`. */
  backBehavior?: 'history' | 'fallback';
  /** When set, skips built-in back navigation (e.g. list category → home). */
  onPress?: () => void;
}

/** Mobile back control — browser history when available, otherwise navigates to fallback. */
export const MobileBackButton = ({
  fallbackTo = '/',
  label = 'Back',
  className = '',
  tone = 'default',
  backBehavior = 'history',
  onPress,
}: MobileBackButtonProps) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backBehavior === 'fallback') {
      navigate(fallbackTo);
      return;
    }
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate(fallbackTo);
  };

  const buttonClass =
    tone === 'light' ? 'text-white/90 hover:text-white' : 'text-emerald-700/90 hover:text-emerald-800';

  return (
    <button
      type="button"
      onClick={onPress ?? handleBack}
      className={`inline-flex items-center gap-0.5 min-h-[44px] text-sm font-medium ${buttonClass} ${className}`}
      aria-label={!label || label === 'Back' ? 'Go back' : `Back to ${label}`}
    >
      <ChevronLeft className="w-5 h-5 shrink-0" strokeWidth={2.25} />
      {label ? <span className="truncate">{label}</span> : null}
    </button>
  );
};
