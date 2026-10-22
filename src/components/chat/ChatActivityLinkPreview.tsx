import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { activityDetailQueryKey } from '../../hooks/clientQueryKeys';
import { fetchPublicActivityDetail } from '../../hooks/publicActivityClientApi';
import { activitySharePath } from '../../utils/activityShare';
import { resolveActivityHeroImage } from '../../utils/activityHeroImage';
import { formatActivityType } from '../../utils/activityIdentity';
import { SITE_TITLE_BRAND } from '../../config/seo';

const CHAT_ACTIVITY_PREVIEW_BRAND_MARK = '/icons/icon.svg';

const formatWhen = (date?: string | null, time?: string | null): string | null => {
  if (!date?.trim()) return time?.trim() || null;
  const formatted = new Date(date).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  return time?.trim() ? `${formatted} · ${time.trim()}` : formatted;
};

type ChatActivityLinkPreviewProps = {
  activityId: string;
  tone?: 'default' | 'onPrimary';
};

/** Rich peek card for shared `/activity/:id` links in chat. */
export const ChatActivityLinkPreview = ({ activityId, tone = 'default' }: ChatActivityLinkPreviewProps) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: activityDetailQueryKey(activityId),
    queryFn: () => fetchPublicActivityDetail(activityId),
    staleTime: 60_000,
  });

  const shellClass =
    tone === 'onPrimary'
      ? 'border-white/25 bg-white/10 hover:bg-white/15'
      : 'border-emerald-200/80 bg-white hover:bg-emerald-50/40';

  if (isLoading) {
    return (
      <div
        className={`mt-2 w-full max-w-[min(100%,20rem)] overflow-hidden rounded-xl border ${shellClass} animate-pulse`}
        aria-hidden
      >
        <div className="aspect-[16/9] bg-neutral-200/80" />
        <div className="space-y-2 p-3">
          <div className="h-3 w-2/3 rounded bg-neutral-200/90" />
          <div className="h-2 w-1/2 rounded bg-neutral-200/70" />
        </div>
      </div>
    );
  }

  if (isError || !data?.activity) {
    return (
      <Link
        to={activitySharePath(activityId)}
        className={`relative z-[1] mt-2 block w-full max-w-[min(100%,20rem)] rounded-xl border px-3 py-2 text-sm font-medium underline-offset-2 ${shellClass} ${
          tone === 'onPrimary' ? 'text-white' : 'text-emerald-900'
        }`}
      >
        View outing on UAE Trail
      </Link>
    );
  }

  const activity = data.activity;
  const title = activity.title?.trim() || activity.locationName?.trim() || 'Outdoor plan';
  const when = formatWhen(activity.date, activity.time);
  const meta = [formatActivityType(activity.activityType), activity.region?.trim(), when]
    .filter(Boolean)
    .join(' · ');
  const image = resolveActivityHeroImage({
    id: activity.id,
    activityType: activity.activityType,
    images: activity.images,
    bannerUrl: activity.bannerUrl,
    location: activity.location,
  });
  return (
    <Link
      to={activitySharePath(activity.id)}
      className={`relative z-[1] mt-2 block w-full max-w-[min(100%,20rem)] overflow-hidden rounded-xl border text-left shadow-sm transition-colors ${shellClass}`}
      onClick={(event) => event.stopPropagation()}
      onTouchStart={(event) => event.stopPropagation()}
    >
      <div className="relative aspect-[16/9] w-full bg-neutral-200">
        <img src={image} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
        <span
          className={`absolute left-2 top-2 flex h-7 w-7 items-center justify-center overflow-hidden rounded-lg shadow-sm ring-1 ${
            tone === 'onPrimary' ? 'bg-white/95 ring-white/40' : 'bg-white ring-black/10'
          }`}
          aria-hidden
        >
          <img src={CHAT_ACTIVITY_PREVIEW_BRAND_MARK} alt="" className="h-full w-full object-cover" />
        </span>
        <span
          className={`absolute bottom-2 left-2 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
            tone === 'onPrimary' ? 'bg-black/50 text-white' : 'bg-white/95 text-emerald-900'
          }`}
        >
          Outing
        </span>
      </div>
      <div className="space-y-1 p-3">
        <p className={`line-clamp-2 text-sm font-semibold leading-snug ${tone === 'onPrimary' ? 'text-white' : 'text-neutral-900'}`}>
          {title}
        </p>
        {meta ? (
          <p className={`text-xs ${tone === 'onPrimary' ? 'text-emerald-50/90' : 'text-neutral-600'}`}>{meta}</p>
        ) : null}
        <p className={`text-xs font-medium ${tone === 'onPrimary' ? 'text-emerald-50/85' : 'text-neutral-500'}`}>
          {SITE_TITLE_BRAND}
        </p>
      </div>
    </Link>
  );
};
