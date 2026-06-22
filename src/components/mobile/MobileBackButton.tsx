import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MobileBackButtonProps {
  fallbackTo?: string;
  label?: string;
  className?: string;
}

/** Back control — uses browser history when available, else fallback route. */
export const MobileBackButton = ({
  fallbackTo = '/profile',
  label = 'Back',
  className = '',
}: MobileBackButtonProps) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate(fallbackTo);
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className={`inline-flex items-center gap-0.5 -ml-2 pl-1 pr-2 py-1 text-emerald-600 active:opacity-60 min-h-[44px] ${className}`}
      aria-label={label}
    >
      <ChevronLeft className="w-6 h-6" strokeWidth={2.25} />
      <span className="text-[17px] font-medium">{label}</span>
    </button>
  );
};
