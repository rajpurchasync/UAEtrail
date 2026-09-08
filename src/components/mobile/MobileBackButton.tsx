import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MobileBackButtonProps {
  fallbackTo?: string;
  label?: string;
  className?: string;
  tone?: 'default' | 'light';
}

/** Mobile back control — browser history when available, otherwise navigates to fallback. */
export const MobileBackButton = ({
  fallbackTo = '/',
  label = 'Back',
  className = '',
  tone = 'default',
}: MobileBackButtonProps) => {
  const navigate = useNavigate();

  const handleBack = () => {
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
      onClick={handleBack}
      className={`inline-flex items-center gap-0.5 min-h-[44px] text-sm font-medium ${buttonClass} ${className}`}
      aria-label={label === 'Back' ? 'Go back' : `Back to ${label}`}
    >
      <ChevronLeft className="w-5 h-5 shrink-0" strokeWidth={2.25} />
      <span className="truncate">Back</span>
    </button>
  );
};
