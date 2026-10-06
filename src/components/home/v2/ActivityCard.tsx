import { Link } from 'react-router-dom';
import { formatActivityTime } from '../../../utils/formatActivityTime';
import { InfoPopover } from './InfoPopover';
import { PriceTag, type PriceTagVariant } from './PriceTag';

export interface ActivityCardProps {
  href: string;
  title: string;
  imageUrl: string;
  imageAlt: string;
  emirate: string;
  startsAt: string | Date;
  priceVariant: PriceTagVariant;
  priceLabel: string;
  priceDefinition: string;
  priceLearnMoreHref?: string;
  fixedTime?: boolean;
}

export const ActivityCard = ({
  href,
  title,
  imageUrl,
  imageAlt,
  emirate,
  startsAt,
  priceVariant,
  priceLabel,
  priceDefinition,
  priceLearnMoreHref,
  fixedTime
}: ActivityCardProps) => {
  const timeLabel = formatActivityTime(startsAt);

  return (
    <Link
      to={href}
      className="home-v2-font home-focus-ring group flex flex-col overflow-hidden rounded-home-md bg-home-surface shadow-home-card transition-[transform,box-shadow] duration-[var(--duration-ui)] ease-[var(--ease-out)] motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-home-card-hover"
    >
      <div className="relative aspect-video overflow-hidden bg-home-muted">
        <img
          src={imageUrl}
          alt={imageAlt}
          className="h-full w-full object-cover transition-transform duration-[var(--duration-ui)] motion-safe:group-hover:scale-[1.03]"
          loading="lazy"
        />
        <span
          className="absolute bottom-2 left-2 rounded-home-sm bg-home-ink/80 px-2 py-1 text-[length:var(--text-xs)] font-medium text-white"
        >
          {emirate}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 text-[length:var(--text-lg)] font-bold leading-[var(--leading-heading)] text-home-ink">
          {title}
        </h3>
        <p className="flex flex-wrap items-center gap-2 text-[length:var(--text-sm)] text-home-ink/80">
          <span aria-hidden>🕐</span>
          <span>{timeLabel}</span>
          {fixedTime ? (
            <span className="rounded-home-sm bg-home-muted px-1.5 py-0.5 text-[length:var(--text-xs)]">
              Fixed time
            </span>
          ) : null}
        </p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <div className="flex items-center gap-1">
            <PriceTag variant={priceVariant}>{priceLabel}</PriceTag>
            <InfoPopover definition={priceDefinition} learnMoreHref={priceLearnMoreHref} />
          </div>
          <span
            className="text-home-green-600 transition-transform duration-[var(--duration-hover)] motion-safe:group-hover:translate-x-0.5"
            aria-hidden
          >
            →
          </span>
        </div>
      </div>
    </Link>
  );
};

export const ActivityCardSkeleton = () => (
  <div
    className="flex flex-col overflow-hidden rounded-home-md bg-home-surface shadow-home-card"
    aria-hidden
  >
    <div className="aspect-video animate-pulse bg-home-muted" />
    <div className="space-y-3 p-4">
      <div className="h-5 w-4/5 animate-pulse rounded bg-home-muted" />
      <div className="h-4 w-1/2 animate-pulse rounded bg-home-muted" />
      <div className="h-6 w-1/3 animate-pulse rounded bg-home-muted" />
    </div>
  </div>
);
