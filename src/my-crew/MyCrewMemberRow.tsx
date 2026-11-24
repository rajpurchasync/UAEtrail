import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { SecureAvatar } from '@/components/ui/SecureAvatar';
import { EXPLORE_LIST_ROW, EXPLORE_TYPE } from '@/config/exploreTheme';

export type MyCrewRowCta =
  | {
      kind: 'link';
      label: string;
      to: string;
      state?: Record<string, unknown>;
      variant?: 'primary' | 'neutral';
    }
  | {
      kind: 'button';
      label: string;
      onClick: () => void;
      disabled?: boolean;
      variant?: 'primary' | 'neutral';
    };

type MyCrewMemberRowProps = {
  displayName: string;
  avatarUrl?: string | null;
  href: string;
  linkState?: Record<string, unknown>;
  locationLabel?: string | null;
  statusLabel?: ReactNode;
  presenceFootnote?: ReactNode;
  primaryCta?: MyCrewRowCta;
  secondaryCta?: MyCrewRowCta;
  ariaLabel?: string;
};

const ctaClass = (variant: 'primary' | 'neutral' = 'primary') =>
  [
    'inline-flex h-9 shrink-0 items-center justify-center rounded-xl px-3 text-xs font-semibold transition active:scale-[0.98] disabled:opacity-50',
    variant === 'primary'
      ? 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700'
      : 'border border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50',
  ].join(' ');

const renderCta = (cta: MyCrewRowCta, key: string) => {
  const variant = cta.variant ?? (cta.kind === 'link' ? 'primary' : 'neutral');
  if (cta.kind === 'link') {
    return (
      <Link key={key} to={cta.to} state={cta.state} className={ctaClass(variant)}>
        {cta.label}
      </Link>
    );
  }
  return (
    <button
      key={key}
      type="button"
      disabled={cta.disabled}
      className={ctaClass(variant)}
      onClick={(event) => {
        event.stopPropagation();
        cta.onClick();
      }}
    >
      {cta.label}
    </button>
  );
};

/** My crew people row — profile tap target + labeled primary CTA (Chat, Withdraw, Unfollow). */
export const MyCrewMemberRow = ({
  displayName,
  avatarUrl,
  href,
  linkState,
  locationLabel,
  statusLabel,
  presenceFootnote,
  primaryCta,
  secondaryCta,
  ariaLabel,
}: MyCrewMemberRowProps) => {
  const showFoot = Boolean(presenceFootnote);

  return (
    <div className={EXPLORE_LIST_ROW.shell}>
      <div className={`${EXPLORE_LIST_ROW.main} items-center gap-2 ${showFoot ? 'rounded-t-2xl' : 'rounded-2xl'}`}>
        <Link
          to={href}
          state={linkState}
          aria-label={ariaLabel ?? displayName}
          className="flex min-w-0 flex-1 items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/80 rounded-xl"
        >
          <SecureAvatar
            src={avatarUrl}
            name={displayName}
            className="h-12 w-12 shrink-0 rounded-xl text-sm ring-1 ring-neutral-200/80"
          />
          <span className="min-w-0 flex-1 text-left">
            <p className={`truncate ${EXPLORE_LIST_ROW.title}`}>{displayName}</p>
            {locationLabel ? (
              <p className={`mt-0.5 flex min-w-0 items-center gap-0.5 truncate ${EXPLORE_LIST_ROW.meta}`}>
                <MapPin className="h-3 w-3 shrink-0 text-emerald-600" aria-hidden />
                <span className="truncate">{locationLabel}</span>
              </p>
            ) : null}
            {statusLabel ? (
              <p className={`mt-0.5 truncate text-xs font-medium leading-snug ${EXPLORE_TYPE.caption}`}>
                {statusLabel}
              </p>
            ) : null}
          </span>
        </Link>
        <div className="flex shrink-0 items-center gap-1.5">
          {primaryCta ? renderCta(primaryCta, 'primary') : null}
          {secondaryCta ? renderCta(secondaryCta, 'secondary') : null}
        </div>
      </div>
      {showFoot ? (
        <div className={`${EXPLORE_LIST_ROW.bodyIndent} pb-3.5 pt-0`}>
          <p className="text-xs font-medium leading-snug text-neutral-500">{presenceFootnote}</p>
        </div>
      ) : null}
    </div>
  );
};