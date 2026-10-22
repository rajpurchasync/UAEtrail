export interface ReviewCardProps {
  quote: string;
  name: string;
  emirate: string;
  avatarUrl?: string;
  rating?: number;
  className?: string;
}

const Stars = ({ count = 5 }: { count?: number }) => (
  <span className="text-amber-500" aria-label={`${count} out of 5 stars`}>
    {'★'.repeat(count)}
  </span>
);

export const ReviewCard = ({
  quote,
  name,
  emirate,
  avatarUrl,
  rating = 5,
  className = ''
}: ReviewCardProps) => (
  <figure
    className={[
      'home-v2-font home-marketing-card home-marketing-soft-tile flex flex-col gap-3 p-5',
      className
    ].join(' ')}
  >
    <Stars count={rating} />
    <blockquote className="min-w-0 flex-1 text-[length:var(--text-base)] leading-[var(--leading-body)] text-home-ink line-clamp-5">
      “{quote}”
    </blockquote>
    <figcaption className="flex items-center gap-3">
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
      ) : (
        <span
          className="flex h-10 w-10 items-center justify-center rounded-full bg-home-muted text-[length:var(--text-sm)] font-bold text-home-ink"
          aria-hidden
        >
          {name.charAt(0)}
        </span>
      )}
      <div>
        <p className="text-[length:var(--text-base)] font-bold text-home-ink">{name}</p>
        <p className="text-[length:var(--text-sm)] text-home-ink/70">{emirate}</p>
      </div>
    </figcaption>
  </figure>
);
