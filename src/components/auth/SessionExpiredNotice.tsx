import { Link, useSearchParams } from 'react-router-dom';
import { X } from 'lucide-react';
import {
  SESSION_EXPIRED_QUERY_KEY,
  SIGNIN_PATH,
  hasSessionExpiredQuery,
} from '../../config/surfacePaths';
import { HOME_HEADER_NAV, HOME_SESSION_EXPIRED } from '../../content/homeMarketing';

type Props = {
  /** `header` anchors under Join free. `overlay` is the Explore map toast. */
  variant?: 'header' | 'overlay';
};

export const SessionExpiredNotice = ({ variant = 'header' }: Props) => {
  const [searchParams, setSearchParams] = useSearchParams();
  if (!hasSessionExpiredQuery(searchParams)) return null;

  const dismiss = () => {
    const next = new URLSearchParams(searchParams);
    next.delete(SESSION_EXPIRED_QUERY_KEY);
    setSearchParams(next, { replace: true });
  };

  const card = (
    <div
      role="status"
      className={
        variant === 'overlay'
          ? 'pointer-events-auto relative w-full max-w-[16.5rem] rounded-xl border border-white/15 bg-neutral-950/92 px-3 py-2.5 pr-9 text-white shadow-lg backdrop-blur-md'
          : 'pointer-events-auto w-[15.5rem] rounded-xl border border-black/10 bg-home-surface px-3 py-2.5 pr-9 text-home-ink shadow-home-card'
      }
    >
      <p className="text-[13px] font-semibold leading-snug">{HOME_SESSION_EXPIRED.title}</p>
      <p
        className={
          variant === 'overlay'
            ? 'mt-0.5 text-[12px] leading-snug text-white/75'
            : 'mt-0.5 text-[12px] leading-snug text-home-ink/70'
        }
      >
        {HOME_SESSION_EXPIRED.body}
      </p>
      <Link
        to={SIGNIN_PATH}
        className={
          variant === 'overlay'
            ? 'mt-1.5 inline-block text-[13px] font-semibold text-emerald-300 underline-offset-2 hover:underline'
            : 'mt-1.5 inline-block text-[13px] font-semibold text-emerald-700 underline-offset-2 hover:underline'
        }
      >
        {HOME_HEADER_NAV.login}
      </Link>
      <button
        type="button"
        onClick={dismiss}
        className={
          variant === 'overlay'
            ? 'absolute right-1.5 top-1.5 rounded-md p-1 text-white/70 hover:bg-white/10 hover:text-white'
            : 'home-focus-ring absolute right-1.5 top-1.5 rounded-md p-1 text-home-ink/50 hover:bg-home-muted hover:text-home-ink'
        }
        aria-label={HOME_SESSION_EXPIRED.dismissAria}
      >
        <X className="h-3.5 w-3.5" aria-hidden />
      </button>
    </div>
  );

  if (variant === 'overlay') {
    return (
      <div className="pointer-events-none absolute inset-x-0 top-[4.75rem] z-[4300] flex justify-center px-3 md:top-[5.25rem]">
        {card}
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute right-0 top-full z-[70] mt-2 flex justify-end">
      {card}
    </div>
  );
};
