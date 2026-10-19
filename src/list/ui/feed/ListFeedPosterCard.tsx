import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { DiscoveryCardModel } from '../../../discovery/discoveryCardModel';
import { EnvironmentImage } from '../../../components/ui/EnvironmentImage';
import { SecureAvatar } from '../../../components/ui/SecureAvatar';
import { browsePosterFallbackClass, resolveBrowsePosterCoverUrl } from '../../browsePosterCover';
import { LIST_FEED } from '../../listFeedTheme';
import {
  resolveListFeedCaptionScrim,
  sampleImageBottomLuminance,
  type ListFeedCaptionScrim,
} from '../../listFeedCaptionContrast';
import { resolveListFeedPublisher } from '../../listFeedPublisher';
import { shouldShowListFeedImageCta } from '../../listFeedFooterActions';
import { useListFeedActions } from '../ListFeedActionsProvider';
import { ListFeedPosterImageCta } from '../ListFeedPosterImageCta';
import { ListPosterCategoryOverlay } from '../poster/ListPosterCategoryOverlay';
import { resolveListPosterCopy } from '../poster/ListPosterHeroChrome';
import { ListFeedPosterEngagementBar } from './ListFeedPosterEngagementBar';
import { ListFeedPosterOptionsMenu } from './ListFeedPosterOptionsMenu';

interface ListFeedPosterCardProps {
  card: DiscoveryCardModel;
  edgeToEdge?: boolean;
}

/** Category / search — publisher + `LIST_FEED` on-image overlay + optional join CTA on hero. */
export const ListFeedPosterCard = ({ card, edgeToEdge = false }: ListFeedPosterCardProps) => {
  const { footerModel } = useListFeedActions();
  const showImageCta = shouldShowListFeedImageCta(footerModel(card));
  const coverUrl = resolveBrowsePosterCoverUrl(card);
  const [imageFailed, setImageFailed] = useState(false);
  const [captionScrim, setCaptionScrim] = useState<ListFeedCaptionScrim>('default');
  const showPhoto = Boolean(coverUrl) && !imageFailed;
  const copy = resolveListPosterCopy(card);

  useEffect(() => {
    setCaptionScrim('default');
    setImageFailed(false);
  }, [coverUrl]);

  const scrim = showPhoto ? captionScrim : 'medium';
  const publisher = resolveListFeedPublisher(card);

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
        {publisher.profilePath ? (
          <Link to={publisher.profilePath} className={`${LIST_FEED.publisherLink} relative z-[3]`}>
            {publisherRow}
          </Link>
        ) : (
          <div className={LIST_FEED.publisherStatic}>{publisherRow}</div>
        )}
        <ListFeedPosterOptionsMenu card={card} />
      </header>

      <div className={`relative z-[2] ${frameClass}`}>
        {mediaBlock}
        {footerActions}
      </div>
    </article>
  );
};
