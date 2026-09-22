import { Link, useLocation } from 'react-router-dom';
import { joinAuthPath } from '../../config/platform';
import { buildSignInRedirect } from '../../utils/authReturnContext';
import { AppButtonLink } from '../../components/mobile/AppButton';
import { ExploreResponsiveSheet } from '../../explore/ui/ExploreResponsiveSheet';

interface ExploreGuestJoinSheetProps {
  open: boolean;
  onClose: () => void;
  activityTitle?: string;
}

/** Bottom sheet when a guest taps Join on an activity — softer than hard redirect. */
export const ExploreGuestJoinSheet = ({ open, onClose, activityTitle }: ExploreGuestJoinSheetProps) => {
  const location = useLocation();
  const joinHref = joinAuthPath(`${location.pathname}${location.search}`);
  const { href: signInHref } = buildSignInRedirect(location);

  return (
    <ExploreResponsiveSheet open={open} onClose={onClose} maxWidthClass="lg:max-w-md">
      <div className="px-4 pb-[calc(var(--safe-bottom)+16px)] pt-1 lg:px-6 lg:pb-6">
        <h2 className="text-lg font-bold text-neutral-900">Join to request a spot</h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          {activityTitle
            ? `Sign up free to request "${activityTitle}" and chat with the host.`
            : 'Create a free account to request activities and message hosts on UAE Trail.'}
        </p>
        <div className="mt-5 space-y-2">
          <AppButtonLink to={joinHref} fullWidth onClick={onClose}>
            Join free
          </AppButtonLink>
          <Link
            to={signInHref}
            className="block py-2 text-center text-sm font-medium text-neutral-500"
            onClick={onClose}
          >
            Already have an account? Log in
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="block w-full py-2 text-center text-sm font-medium text-neutral-400"
          >
            Keep browsing
          </button>
        </div>
      </div>
    </ExploreResponsiveSheet>
  );
};
