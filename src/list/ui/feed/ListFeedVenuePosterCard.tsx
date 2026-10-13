import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { ExploreCardModel } from '../../../explore/exploreCardModel';
import { EnvironmentImage } from '../../../components/ui/EnvironmentImage';
import { browsePosterFallbackClass, resolveBrowsePosterCoverUrl } from '../../browsePosterCover';
import { LIST_FEED } from '../../listFeedTheme';
import {
  resolveListFeedCaptionScrim,
  sampleImageBottomLuminance,
  type ListFeedCaptionScrim,
} from '../../listFeedCaptionContrast';
import { shouldShowListFeedImageCta } from '../../listFeedFooterActions';
import { resolveListVenuePosterCopy } from '../../listVenuePosterPresentation';
import { useListFeedActions } from '../ListFeedActionsProvider';
import { ListFeedPosterImageCta } from '../ListFeedPosterImageCta';
import { ListPosterCategoryOverlay } from '../poster/ListPosterCategoryOverlay';
import { ListFeedCatalogEntityHeader } from './ListFeedCatalogEntityHeader';
import { ListFeedPosterEngagementBar } from './ListFeedPosterEngagementBar';

interface ListFeedVenuePosterCardProps {
  card: ExploreCardModel;
  edgeToEdge?: boolean;
}

/** Places category — catalog header above image; venue / shop Like · Share · Follow. */
export const ListFeedVenuePosterCard = ({ card, edgeToEdge = false }: ListFeedVenuePosterCardProps) => {
  const { footerModel } = useListFeedActions();
  const showImageCta = shouldShowListFeedImageCta(footerModel(card));
  const coverUrl = resolveBrowsePosterCoverUrl(card);
  const [imageFailed, setImageFailed] = useState(false);
  const [captionScrim, setCaptionScrim] = useState<ListFeedCaptionScrim>('default');
  const showPhoto = Boolean(coverUrl) && !imageFailed;
  const copy = resolveListVenuePosterCopy(card);

  useEffect(() => {
    setCaptionScrim('default');
    setImageFailed(false);
  }, [coverUrl]);

  const scrim = showPhoto ? captionScrim : 'medium';

  const mediaBlock = (
    <div className={`pointer-events-none ${LIST_FEED.mediaOnly}`}>
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
        <div className={`absolute inset-0 z-0 ${browsePosterFallbackClass(card.tone)}`} aria-hidden>
          <span
            className="pointer-events-none absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2 select-none text-[4.5rem] leading-none sm:text-[6rem]"
          >
            {card.emoji}
          </span>
        </div>
      )}

      <ListPosterCategoryOverlay
        placeLine={copy.placeLine}
        titleLines={copy.titleLines}
        schedule={copy.schedule}
        requirementLabels={copy.requirementLabels}
        captionScrim={scrim}
      />
    </div>
  );

  const footerActions = (
    <div className="relative z-[3]" onClick={(event) => event.stopPropagation()}>
      {showImageCta ? <ListFeedPosterImageCta card={card} placement="stacked" /> : null}
      <ListFeedPosterEngagementBar card={card} />
    </div>
  );

  const frameClass = edgeToEdge ? LIST_FEED.feedCardFrameEdge : LIST_FEED.feedCardFrame;
  const articleClass = edgeToEdge ? LIST_FEED.articleEdge : LIST_FEED.article;
  const headerClass = edgeToEdge ? LIST_FEED.headerEdge : LIST_FEED.header;

  return (
    <article className={`relative ${articleClass}`}>
      <Link
        to={card.path}
        className="absolute inset-0 z-[1] touch-manipulation"
        aria-label={`View ${copy.heroTitle}`}
      />

      <header className={`relative z-[2] ${headerClass}`}>
        <div className={`${LIST_FEED.publisherStatic} w-full`}>
          <ListFeedCatalogEntityHeader card={card} name={copy.heroTitle} />
        </div>
      </header>

      <div className={`relative z-[2] ${frameClass}`}>
        {mediaBlock}
        {footerActions}
      </div>
    </article>
  );
};
