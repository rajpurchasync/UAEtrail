import type { BrowsePosterScheduleGrid } from '../../listPosterPresentation';
import type { formatListFeedPosterTitleLines } from '../../listPosterPresentation';
import { LIST_FEED } from '../../listFeedTheme';
import { LIST_FEED_CAPTION_BOTTOM_SCRIM_CLASS, type ListFeedCaptionScrim } from '../../listFeedCaptionContrast';

type TitleLines = ReturnType<typeof formatListFeedPosterTitleLines>;

/**
 * Category / search feed — venue + title centered on image; facts at bottom (`listFeedTheme.ts`).
 */
export const ListPosterCategoryOverlay = ({
  placeLine,
  titleLines,
  schedule,
  requirementLabels = [],
  captionScrim,
}: {
  placeLine: string | null;
  titleLines: TitleLines;
  schedule: BrowsePosterScheduleGrid;
  requirementLabels?: string[];
  captionScrim: ListFeedCaptionScrim;
}) => {
  const shadow = LIST_FEED.overlayTextShadow;
  const hasSchedule =
    schedule.dateLabel || schedule.timeLabel || schedule.spotsLabel || schedule.priceLabel;
  const hasRequirements = requirementLabels.length > 0;

  const rootClass = [
    LIST_FEED.overlayRoot,
    LIST_FEED.overlayPhotoScrimBase,
    LIST_FEED.overlayPhotoScrimBottom,
    LIST_FEED_CAPTION_BOTTOM_SCRIM_CLASS[captionScrim],
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClass}>
      <div className={LIST_FEED.overlayHeroCenter}>
        <div className={LIST_FEED.overlayHeroCopy}>
          {placeLine ? (
            <p className={`${LIST_FEED.placeLine} ${LIST_FEED.placeOnPhoto} ${shadow} line-clamp-2 w-full`}>
              {placeLine}
            </p>
          ) : null}
          <h2 className={`${LIST_FEED.title} ${LIST_FEED.titleFeed} ${LIST_FEED.titleOnPhoto} ${shadow} w-full`}>
            <span className="block">{titleLines.line1}</span>
            {titleLines.line2 ? <span className="mt-0.5 block">{titleLines.line2}</span> : null}
          </h2>
        </div>
      </div>

      {hasSchedule || hasRequirements ? (
        <div
          className={`${LIST_FEED.overlayFooterStack} ${LIST_FEED.overlayFooterLift} relative z-[1] mt-auto`}
        >
          {hasSchedule ? (
            <div className={`${LIST_FEED.overlayFactsPanel} ${shadow}`}>
              <div className={LIST_FEED.overlayFactsGrid}>
                {schedule.dateLabel || schedule.timeLabel ? (
                  <>
                    <span className={LIST_FEED.overlayFactsCellLeft}>{schedule.dateLabel ?? '—'}</span>
                    <span className={LIST_FEED.overlayFactsCellRight}>{schedule.timeLabel ?? ''}</span>
                  </>
                ) : null}
                {schedule.spotsLabel || schedule.priceLabel ? (
                  <>
                    <span className={LIST_FEED.overlayFactsCellLeft}>{schedule.spotsLabel ?? ''}</span>
                    <span className={LIST_FEED.overlayFactsCellRight}>{schedule.priceLabel ?? ''}</span>
                  </>
                ) : null}
              </div>
            </div>
          ) : null}
          {hasRequirements ? (
            <div className={`${LIST_FEED.overlayLabelRow} justify-center gap-1.5 ${shadow}`}>
              {requirementLabels.slice(0, 4).map((label) => (
                <span key={label} className={`${LIST_FEED.labelRequirement} ${LIST_FEED.labelOnPhoto}`}>
                  {label}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};
