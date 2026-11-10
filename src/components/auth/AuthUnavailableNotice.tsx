import { useLocation, useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { AUTH_UNAVAILABLE_COPY } from '../../utils/authRedirect';

/** Post-auth flash when `?redirect=` pointed at a surface this account cannot use. */
export const AuthUnavailableNotice = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const show = Boolean((location.state as { authUnavailable?: boolean } | null)?.authUnavailable);
  if (!show) return null;

  const dismiss = () => {
    navigate(`${location.pathname}${location.search}${location.hash}`, { replace: true, state: {} });
  };

  return (
    <div
      role="status"
      className="shrink-0 border-b border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-800"
    >
      <div className="mx-auto flex max-w-3xl items-start justify-between gap-3">
        <p>{AUTH_UNAVAILABLE_COPY}</p>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-md p-1 text-red-700 hover:bg-red-100"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
};
