import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { ExploreCardModel } from '../../../explore/exploreCardModel';
import { EnvironmentImage } from '../../../components/ui/EnvironmentImage';
import { ShareButton } from '../../../components/ui/ShareButton';
import { ExploreFollowButton } from '../../../explore/ui/ExploreFollowButton';
import { SecureAvatar } from '../../../components/ui/SecureAvatar';
import { browsePosterFallbackClass, resolveBrowsePosterCoverUrl } from '../../browsePosterCover';
import { LIST_FEED, LIST_FEED_POSTER_ASPECT } from '../../listFeedTheme';
import {
  LIST_FEED_CAPTION_SCRIM_CLASS,
  resolveListFeedCaptionScrim,
  sampleImageBottomLuminance,
  type ListFeedCaptionScrim,
} from '../../listFeedCaptionContrast';
import { resolveListFeedPublisher } from '../../listFeedPublisher';
import {
  formatListFeedPosterTitleLines,
  resolveBrowsePosterHeroTitle,
  resolveBrowsePosterPlaceLine,
  resolveBrowsePosterScheduleGrid,
} from '../../listPosterPresentation';
import { shouldShowListFeedImageCta } from '../../listFeedFooterActions';
import { useListFeedActions } from '../ListFeedActionsProvider';
import { ListFeedPosterImageCta } from '../ListFeedPosterImageCta';
import { ListFeedPosterOptionsMenu } from './ListFeedPosterOptionsMenu';

export type ListFeedPosterVariant = 'feed' | 'rail';

interface ListFeedPosterCardProps {
  card: ExploreCardModel;
  variant?: ListFeedPosterVariant;
  /** Category feed — full-bleed card on mobile, inset on md+. */
  edgeToEdge?: boolean;
}

const PlanCaption = ({
  isRail,
  onPhoto,
  placeLine,
  heroTitle,
  schedule,
  scheduleOnImageWithCta,
}: {
  isRail: boolean;
  onPhoto: boolean;
  placeLine: string | null;
  heroTitle: string;
  schedule: ReturnType<typeof resolveBrowsePosterScheduleGrid>;
  scheduleOnImageWithCta?: boolean;
}) => {
  const shadow = onPhoto ? LIST_FEED.overlayTextShadow : '';
  const placeClass = onPhoto ? LIST_FEED.placeOnPhoto : LIST_FEED.placeOnFallback;
  const titleClass = onPhoto ? LIST_FEED.titleOnPhoto : LIST_FEED.titleOnFallback;
  const factsClass = onPhoto ? LIST_FEED.factsOnPhoto : LIST_FEED.factsOnFallback;
  const rowClass = `${LIST_FEED.scheduleRow} ${factsClass} ${shadow}`;
  const hasSchedule =
    schedule.dateLabel ||
    schedule.timeLabel ||
    schedule.spotsLabel ||
    schedule.priceLabel;

  const titleLines = formatListFeedPosterTitleLines(heroTitle);

  const headerBlock = (
    <div className={LIST_FEED.overlayCaptionHeader}>
      {placeLine ? (
        <p className={`${LIST_FEED.placeLine} ${placeClass} ${shadow} truncate`}>{placeLine}</p>
      ) : null}
      <h2
        className={`${isRail ? LIST_FEED.railTitle : `${LIST_FEED.title} ${LIST_FEED.titleFeed}`} ${titleClass} ${shadow}`}
      >
        <span className="block">{titleLines.line1}</span>
        {titleLines.line2 ? <span className="block">{titleLines.line2}</span> : null}
      </h2>
    </div>
  );

  const scheduleFooterClass = onPhoto
    ? `${LIST_FEED.overlayCaptionFooter}${scheduleOnImageWithCta ? ` ${LIST_FEED.overlayCaptionFooterWithCta}` : ''}`
    : 'mt-2 flex w-full flex-col gap-1';

  const scheduleBlock = hasSchedule ? (
    <div className={scheduleFooterClass}>
      {schedule.dateLabel || schedule.timeLabel ? (
        <div className={rowClass}>
          <span className={LIST_FEED.scheduleLeft}>{schedule.dateLabel ?? '—'}</span>
          <span className={LIST_FEED.scheduleRight}>{schedule.timeLabel ?? ''}</span>
        </div>
      ) : null}
      {schedule.spotsLabel || schedule.priceLabel ? (
        <div className={rowClass}>
          <span className={LIST_FEED.scheduleLeft}>{schedule.spotsLabel ?? ''}</span>
          <span className={LIST_FEED.scheduleRight}>{schedule.priceLabel ?? ''}</span>
        </div>
      ) : null}
    </div>
  ) : null;

  if (onPhoto) {
    return (
      <>
        <div className={isRail ? LIST_FEED.railOverlayCaptionHeaderSlot : LIST_FEED.overlayCaptionHeaderSlot}>
          {headerBlock}
        </div>
        <div className={LIST_FEED.overlayCaptionSpacer} aria-hidden />
        {scheduleBlock}
      </>
    );
  }

  return (
    <>
      {headerBlock}
      {scheduleBlock}
    </>
  );
};

/** Category / search feed post — publisher · image facts · CTAs below image. */
export const ListFeedPosterCard = ({ card, variant = 'feed', edgeToEdge = false }: ListFeedPosterCardProps) => {
  const { footerModel } = useListFeedActions();
  const showImageCta = variant === 'feed' && shouldShowListFeedImageCta(footerModel(card));
  const coverUrl = resolveBrowsePosterCoverUrl(card);
  const [imageFailed, setImageFailed] = useState(false);
  const [captionScrim, setCaptionScrim] = useState<ListFeedCaptionScrim>('default');
  const showPhoto = Boolean(coverUrl) && !imageFailed;
  const isRail = variant === 'rail';

  useEffect(() => {
    setCaptionScrim('default');
    setImageFailed(false);
  }, [coverUrl]);

  const publisher = resolveListFeedPublisher(card);
  const placeLine = resolveBrowsePosterPlaceLine(card);
  const heroTitle = resolveBrowsePosterHeroTitle(card);
  const schedule = resolveBrowsePosterScheduleGrid(card);

  const captionBlock = (
    <PlanCaption
      isRail={isRail}
      onPhoto={showPhoto}
      placeLine={placeLine}
      heroTitle={heroTitle}
      schedule={schedule}
      scheduleOnImageWithCta={showImageCta}
    />
  );

  const publisherRow = (
    <>
      <SecureAvatar
        src={publisher.avatarUrl}
        name={publisher.name}
        className="h-10 w-10 shrink-0 text-sm ring-2 ring-white"
      />
      <span className="min-w-0 flex-1">
        <span className={LIST_FEED.publisherName}>{publisher.name}</span>
        <span className={`mt-0.5 block ${LIST_FEED.publisherType}`}>{publisher.typeLabel}</span>
      </span>
    </>
  );

  const topActions = (
    <div
      className="pointer-events-auto absolute inset-x-0 top-0 z-[3] flex items-start justify-between gap-2 p-2.5"
      onClick={(event) => event.stopPropagation()}
    >
      <ShareButton
        title={card.shareTitle}
        text={card.shareText ?? undefined}
        path={card.sharePath}
        iconOnly
        bare
        className="relative shrink-0"
      />
      <ExploreFollowButton card={card} bare />
    </div>
  );

  const mediaBlock = showPhoto || isRail ? (
    <div className={`pointer-events-none ${isRail ? LIST_FEED.railMedia : LIST_FEED.mediaOnly}`}>
      {showPhoto ? (
        <EnvironmentImage
          src={coverUrl ?? undefined}
          alt=""
          className="absolute inset-0 z-0 block h-full w-full object-cover object-center"
          loading="lazy"
          decoding="async"
          onLoad={(event) => {
            const lum = sampleImageBottomLuminance(event.currentTarget);
            setCaptionScrim(resolveListFeedCaptionScrim(lum));
          }}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div
          className={`absolute inset-0 z-0 flex items-center justify-center ${browsePosterFallbackClass(card.tone)}`}
          aria-hidden
        >
          <span className={`select-none leading-none ${isRail ? 'text-5xl' : 'text-[5rem] sm:text-[6rem]'}`}>
            {card.emoji}
          </span>
        </div>
      )}

      {topActions}

      <div
        className={`${isRail ? LIST_FEED.railOverlayBottom : LIST_FEED.overlayBottom} ${
          showPhoto ? `${LIST_FEED.overlayPhotoScrimBase} ${LIST_FEED_CAPTION_SCRIM_CLASS[captionScrim]}` : ''
        } ${showImageCta ? 'pb-[3.25rem]' : ''}`}
      >
        {captionBlock}
      </div>
      {showImageCta ? <ListFeedPosterImageCta card={card} /> : null}
    </div>
  ) : (
    <div className="pointer-events-none relative w-full overflow-hidden">
      <div
        className={`relative ${LIST_FEED_POSTER_ASPECT} w-full ${browsePosterFallbackClass(card.tone)} flex items-center justify-center`}
      >
        <span className="select-none text-[4.5rem] leading-none">{card.emoji}</span>
        {topActions}
      </div>
      <div className="border-t border-neutral-100 bg-white px-4 py-3">{captionBlock}</div>
    </div>
  );

  const frameClass = edgeToEdge ? LIST_FEED.feedCardFrameEdge : LIST_FEED.feedCardFrame;

  return (
    <article
      className={`relative ${isRail ? LIST_FEED.railArticle : edgeToEdge ? LIST_FEED.articleEdge : LIST_FEED.article}`}
    >
      {!isRail ? (
        <Link
          to={card.path}
          className="absolute inset-0 z-[1] touch-manipulation"
          aria-label={`View ${heroTitle}`}
        />
      ) : null}

      {!isRail ? (
        <header className={`relative z-[2] ${edgeToEdge ? LIST_FEED.headerEdge : LIST_FEED.header}`}>
          {publisher.profilePath ? (
            <Link to={publisher.profilePath} className={`${LIST_FEED.publisherLink} relative z-[3]`}>
              {publisherRow}
            </Link>
          ) : (
            <div className={LIST_FEED.publisherStatic}>{publisherRow}</div>
          )}
          <ListFeedPosterOptionsMenu card={card} />
        </header>
      ) : null}

      {!isRail ? <div className={`relative z-[2] ${frameClass}`}>{mediaBlock}</div> : mediaBlock}
    </article>
  );
};
