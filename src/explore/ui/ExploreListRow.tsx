import { Link } from 'react-router-dom';
import { ChevronRight, Users } from 'lucide-react';
import { SecureAvatar } from '../../components/ui';
import { formatExploreRelativeScheduleLabel } from '@uaetrail/shared-types';
import type { ExploreCardModel } from '../exploreCardModel';
import { buildExploreListMeta, exploreCardToneTextClass } from '../exploreCardModel';
import { EnvironmentImage } from '../../components/ui/EnvironmentImage';
import { EXPLORE_LIST_ROW, EXPLORE_TYPE } from '../../config/exploreTheme';
import { ExploreCardDetailList, ExploreCardLocationLink, ExploreCardRatingRow } from './ExploreCardPresentation';
import { ExploreCardTypeIcon } from './ExploreCardTypeIcon';
import { ExploreListRowWireFooter } from './ExploreListRowWireFooter';
import { memberProfileLink } from '@/member/memberProfileLink';

interface ExploreListRowProps {
  card: ExploreCardModel;
  onClick: () => void;
  onPointerEnter?: () => void;
  /** Two-line title/meta — better on Trips suggested list. */
  multiline?: boolean;
  showJoining?: boolean;
  /** Highlight accepted buddies on participant previews. */
  buddyUserIds?: Set<string>;
}

const rowShellClass = EXPLORE_LIST_ROW.shell;
const rowMainClass = EXPLORE_LIST_ROW.main;

const JoiningIndicator = ({
  card,
  buddyUserIds,
}: {
  card: ExploreCardModel;
  buddyUserIds?: Set<string>;
}) => {
  const previews = card.participantPreviews ?? [];
  const joined =
    card.activity?.slotsTotal != null && card.activity.slotsAvailable != null
      ? card.activity.slotsTotal - card.activity.slotsAvailable
      : previews.length;
  if (joined <= 0 && previews.length === 0 && !card.spotsLabel) return null;

  return (
    <div className="mt-1.5 flex items-center gap-2">
      {previews.length > 0 ? (
        <div className="flex -space-x-1.5">
          {previews.slice(0, 4).map((p) => {
            const isBuddy = buddyUserIds?.has(p.id);
            return (
              <Link
                key={p.id}
                to={memberProfileLink(p.id)}
                onClick={(event) => event.stopPropagation()}
                title={isBuddy ? p.name : `${p.name} — connect to message`}
                className={`inline-block rounded-full ${isBuddy ? 'ring-2 ring-emerald-500' : 'ring-2 ring-white opacity-90'}`}
              >
                <SecureAvatar src={p.avatar} name={p.name} className="h-6 w-6" />
              </Link>
            );
          })}
        </div>
      ) : (
        <Users className="h-4 w-4 text-gray-400" aria-hidden />
      )}
      <span className={`text-xs font-semibold ${EXPLORE_TYPE.muted}`}>
        {joined > 0 ? `${joined} joining` : card.spotsLabel}
        {card.spotsLabel && joined > 0 ? ` · ${card.spotsLabel}` : null}
      </span>
    </div>
  );
};

export const ExploreListRow = ({
  card,
  onClick,
  onPointerEnter,
  multiline = false,
  showJoining = false,
  buddyUserIds,
}: ExploreListRowProps) => {
  const titleClamp = multiline ? 'line-clamp-2' : 'truncate';
  const metaClamp = multiline ? 'line-clamp-2' : 'truncate';
  const { listTitle, details, highlightName, suffix, activityHighlight, dateHighlight } = card.sections;
  const meta = buildExploreListMeta(card);
  const toneTextClass = exploreCardToneTextClass[card.tone];
  const isCatalogRow = card.source === 'shop' || card.source === 'agency' || card.source === 'venue';
  const scheduleChipLabel =
    !isCatalogRow && card.activity?.date
      ? formatExploreRelativeScheduleLabel(card.activity.date)
      : null;

  const iconCell = card.coverImage ? (
    <div className="relative h-14 w-14 shrink-0">
      <EnvironmentImage
        src={card.coverImage}
        alt=""
        className="h-14 w-14 rounded-xl object-cover ring-1 ring-neutral-200/80"
        loading="lazy"
      />
      <span className="absolute -bottom-1 -right-1 rounded-full shadow-sm ring-2 ring-white">
        <ExploreCardTypeIcon
          tone={card.tone}
          source={card.source}
          kind={card.kind}
          emoji={card.emoji}
          size="overlay"
        />
      </span>
    </div>
  ) : (
    <ExploreCardTypeIcon tone={card.tone} source={card.source} kind={card.kind} emoji={card.emoji} size="sm" />
  );

  const titleBlock = highlightName ? (
    <p className={`${titleClamp} text-[15px] font-bold leading-snug ${EXPLORE_TYPE.title}`}>
      <span>{highlightName}</span>
      {suffix && <span>{suffix}</span>}
      {activityHighlight && <span className={toneTextClass}>{activityHighlight}</span>}
      {dateHighlight && <span>{dateHighlight}</span>}
    </p>
  ) : (
    <p className={`${titleClamp} text-[15px] font-bold leading-snug ${EXPLORE_TYPE.title}`}>{listTitle}</p>
  );

  if (isCatalogRow) {
    return (
      <div className={rowShellClass} onMouseEnter={onPointerEnter}>
        <button type="button" onClick={onClick} className={`${rowMainClass} rounded-t-2xl`}>
          {iconCell}
          <span className="min-w-0 flex-1">{titleBlock}</span>
          <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" aria-hidden />
        </button>
        <div className={EXPLORE_LIST_ROW.bodyIndent}>
          {card.subtitle ? (
            <ExploreCardLocationLink
              label={card.subtitle}
              latitude={card.mapLatitude}
              longitude={card.mapLongitude}
              className="text-sm text-gray-600"
            />
          ) : null}
          <ExploreCardRatingRow card={card} compact />
        </div>
      </div>
    );
  }

  return (
    <div className={rowShellClass} onMouseEnter={onPointerEnter}>
      <button type="button" onClick={onClick} className={`${rowMainClass} rounded-t-2xl`}>
        {iconCell}
        <span className="min-w-0 flex-1">
          {scheduleChipLabel ? (
            <span
              className={`mb-1 inline-block rounded-md bg-neutral-100 px-1.5 py-0.5 text-[11px] font-semibold tracking-wide ${EXPLORE_TYPE.caption}`}
            >
              {scheduleChipLabel}
            </span>
          ) : null}
          {titleBlock}
          {meta ? (
            <p className={`mt-0.5 ${metaClamp} text-sm font-medium leading-snug ${EXPLORE_TYPE.muted}`}>{meta}</p>
          ) : (
            <ExploreCardDetailList details={details} compact />
          )}
          {showJoining ? <JoiningIndicator card={card} buddyUserIds={buddyUserIds} /> : null}
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" aria-hidden />
      </button>
      <ExploreListRowWireFooter card={card} />
    </div>
  );
};
