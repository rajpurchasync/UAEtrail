import { Link, useLocation } from 'react-router-dom';
import {
  guestBrowseGateIntentToFeatureKey,
  guestFeatureUnlockCopy,
  type GuestFeatureUnlockKey,
} from '../../content/guestFeatureUnlockCopy';
import type { GuestBrowseGateIntent } from '../../content/guestBrowseGateCopy';
import { buildAuthGateUrls } from '../../utils/authReturnContext';
import { AppButtonLink } from '../../components/mobile/AppButton';

type Props = {
  feature: GuestFeatureUnlockKey;
  className?: string;
  authReturnPath?: string;
  authFocusSelector?: string;
  /**
   * `dialog` — inline Join / Log in + viewport-height adaptive spacing (desktop popups).
   * `card` — stacked CTAs (mobile sheets, marketing-style cards).
   * `inline` — same actions as dialog, without a second card frame (inside an existing sheet).
   */
  presentation?: 'card' | 'dialog' | 'inline';
};

type FromIntentProps = Omit<Props, 'feature'> & {
  intent: GuestBrowseGateIntent;
};

const loginLinkClass = (dialog: boolean) =>
  dialog
    ? 'ios-btn flex min-h-11 min-w-0 flex-1 items-center justify-center rounded-xl border border-emerald-200/90 bg-white px-3 py-2.5 text-center text-sm font-semibold text-emerald-800 shadow-sm hover:bg-emerald-50/80 active:bg-emerald-50'
    : 'block py-2.5 text-center text-sm font-semibold text-emerald-800 hover:text-emerald-950';

/** Aesthetic guest gate — what this area is for, then sign up / log in. */
export const GuestFeatureUnlockPanel = ({
  feature,
  className = '',
  authReturnPath,
  authFocusSelector,
  presentation = 'card',
}: Props) => {
  const location = useLocation();
  const returnPath = authReturnPath ?? `${location.pathname}${location.search}`;
  const { signInHref, signUpHref } = buildAuthGateUrls(location, {
    returnPath,
    focusSelector: authFocusSelector,
  });
  const copy = guestFeatureUnlockCopy(feature);
  const dialog = presentation === 'dialog' || presentation === 'inline';
  const framed = presentation !== 'inline';

  return (
    <div
      className={`flex flex-col text-left ${
        framed
          ? `rounded-3xl border border-emerald-100/80 bg-gradient-to-b from-emerald-50/90 via-white to-white shadow-sm dark:border-emerald-900/50 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-950 ${
              dialog ? 'explore-popup-adaptive p-5' : 'p-6'
            }`
          : 'explore-popup-adaptive'
      } ${className}`}
    >
      <div
        className={`explore-popup-adaptive-emoji flex shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-emerald-100/90 ${
          dialog ? 'mb-3 h-12 w-12 text-2xl' : 'mb-4 h-14 w-14 text-3xl'
        }`}
        aria-hidden
      >
        {copy.emoji}
      </div>
      <h2
        className={`explore-popup-adaptive-title font-bold tracking-tight text-neutral-900 ${
          dialog ? 'text-lg' : 'text-xl'
        }`}
      >
        {copy.title}
      </h2>
      <p
        className={`explore-popup-adaptive-lead leading-relaxed text-neutral-600 ${
          dialog ? 'mt-1.5 text-sm' : 'mt-2 text-sm'
        }`}
      >
        {copy.lead}
      </p>
      <ul
        className={`explore-popup-adaptive-bullets text-neutral-700 ${
          dialog ? 'mt-3 space-y-1.5 text-sm' : 'mt-4 space-y-2 text-sm'
        }`}
      >
        {copy.bullets.map((line) => (
          <li key={line} className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
            <span>{line}</span>
          </li>
        ))}
      </ul>
      <div
        className={
          dialog
            ? 'explore-popup-adaptive-actions mt-4 flex flex-row gap-2'
            : 'mt-6 flex flex-col items-stretch gap-2 md:flex-row md:items-center'
        }
      >
        <AppButtonLink
          to={signUpHref}
          fullWidth={!dialog}
          className={
            dialog
              ? 'min-h-11 min-w-0 flex-1 px-3 py-2.5 text-sm'
              : 'md:!w-auto md:min-w-[9.5rem] md:px-5 md:py-2 md:text-sm'
          }
        >
          {copy.signUpLabel}
        </AppButtonLink>
        <Link to={signInHref} className={loginLinkClass(dialog)}>
          Log in
        </Link>
      </div>
    </div>
  );
};

export const GuestFeatureUnlockPanelFromIntent = ({
  intent,
  ...rest
}: FromIntentProps) => (
  <GuestFeatureUnlockPanel feature={guestBrowseGateIntentToFeatureKey(intent)} {...rest} />
);
