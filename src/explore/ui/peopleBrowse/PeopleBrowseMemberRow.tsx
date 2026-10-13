import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { SecureAvatar } from '../../../components/ui';
import { EXPLORE_LIST_ROW, EXPLORE_TYPE } from '../../../config/exploreTheme';

export type PeopleBrowseMemberBadge = {
  label: string;
};

export type PeopleBrowseMemberRowProps = {
  profileHref: string;
  /** When set, row navigates here (e.g. explore pin) instead of `profileHref`. */
  actionHref?: string;
  displayName: string;
  avatarUrl?: string | null;
  buddyHighlight?: boolean;
  /** Primary line — usually display name or availability sentence. */
  title: ReactNode;
  /** Line 2 — city / area. */
  location?: string | null;
  /** Line 3 — role label (directory), not bio. */
  roleTitle?: string | null;
  /** Line 4 — role / tier pill. */
  badge?: PeopleBrowseMemberBadge | null;
  /** Calendar dates under availability narrative (“Oct 10–13”). */
  dateLine?: string | null;
  /** Pro lock / secondary note (Everyone). */
  footnote?: string | null;
  /** Multi-date availability only — indented list under main row. */
  scheduleDetail?: ReactNode;
  /** `wrap` — full narrative (Available tab); default `truncate` for short titles. */
  titleClamp?: 'truncate' | 'line-clamp-2' | 'wrap';
};

const avatarClass = (buddyHighlight: boolean) =>
  `h-14 w-14 shrink-0 rounded-xl text-base ${
    buddyHighlight ? 'ring-2 ring-emerald-500' : 'ring-1 ring-neutral-200/80'
  }`;

const badgeClass =
  'shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-neutral-700 ring-1 ring-neutral-200/80';

/**
 * People list row — same shell as `ExploreListRow`; profile fields stack in the text column.
 */
export const PeopleBrowseMemberRow = ({
  profileHref,
  actionHref,
  displayName,
  avatarUrl,
  buddyHighlight = false,
  title,
  location,
  roleTitle,
  badge,
  dateLine,
  footnote,
  scheduleDetail,
  titleClamp = 'truncate',
}: PeopleBrowseMemberRowProps) => {
  const linkTo = actionHref ?? profileHref;
  const titleClass =
    titleClamp === 'wrap'
      ? `${EXPLORE_LIST_ROW.title} leading-snug`
      : `${titleClamp} ${EXPLORE_LIST_ROW.title}`;
  const mainRowClass = `${EXPLORE_LIST_ROW.main} items-start`;

  const textColumn = (
    <span className="min-w-0 flex-1 space-y-0.5">
      <p className={titleClass}>{title}</p>
      {dateLine ? (
        <p className={`${EXPLORE_LIST_ROW.meta} !mt-0.5 leading-snug`}>{dateLine}</p>
      ) : null}
      {location ? <p className={`truncate ${EXPLORE_LIST_ROW.meta} !mt-0`}>{location}</p> : null}
      {roleTitle ? (
        <p className={`truncate text-xs font-semibold leading-snug ${EXPLORE_TYPE.muted}`}>{roleTitle}</p>
      ) : null}
      {badge ? (
        <p className="!mt-0.5">
          <span className={badgeClass}>{badge.label}</span>
        </p>
      ) : null}
      {footnote ? (
        <p className={`truncate text-xs font-medium leading-snug ${EXPLORE_TYPE.caption}`}>{footnote}</p>
      ) : null}
    </span>
  );

  const mainInner = (
    <>
      <SecureAvatar src={avatarUrl} name={displayName} className={avatarClass(buddyHighlight)} />
      {textColumn}
      <ChevronRight className="h-4 w-4 shrink-0 self-center text-gray-300" aria-hidden />
    </>
  );

  if (scheduleDetail) {
    return (
      <div className={EXPLORE_LIST_ROW.shell}>
        <Link
          to={linkTo}
          className={`${mainRowClass} rounded-t-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/80`}
        >
          {mainInner}
        </Link>
        <div className={`${EXPLORE_LIST_ROW.bodyIndent} ${EXPLORE_LIST_ROW.footer}`}>{scheduleDetail}</div>
      </div>
    );
  }

  return (
    <Link
      to={linkTo}
      className={`${EXPLORE_LIST_ROW.shell} ${mainRowClass} focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/80`}
    >
      {mainInner}
    </Link>
  );
};
