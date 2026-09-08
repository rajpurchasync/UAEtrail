import { type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, Users, MapPin, ChevronRight } from 'lucide-react';
import { ActivityListing } from '../../types';
import { formatActivityType } from '../../utils/activityIdentity';
import { tripPricingBadge } from '../../utils/tripPricing';
import { hostProfilePath } from '../../utils/hostLinks';
import { ShareButton } from './ShareButton';
import { EnvironmentImage } from './EnvironmentImage';
import { ParticipantPreview } from './ParticipantPreview';
import { HostMessageButton } from './HostMessageButton';
import { SecureAvatar } from './SecureAvatar';
import { activityHostAvatar, activityHostName, activityHostUserId, showTenantBrand } from '../../utils/hostLabels';

interface ActivityCardProps {
  activity: ActivityListing;
  /** Featured home carousel: tap opens activity detail */
  variant?: 'default' | 'featured';
}

export const ActivityCard = ({ activity, variant = 'default' }: ActivityCardProps) => {
  const navigate = useNavigate();
  const activityPath = `/activity/${activity.id}`;

  const locationImage =
    activity.images?.[0] ??
    (activity.activityType === 'camping'
      ? 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=600'
      : activity.activityType === 'event'
        ? 'https://images.unsplash.com/photo-1452626038306-9fff603b72e5?w=600'
        : 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=600');

  const participants = activity.participantPreviews ?? [];
  const isFeatured = variant === 'featured';
  const hostPath = hostProfilePath(activity.tenantSlug);
  const activityDate = new Date(activity.date);
  const monthShort = activityDate.toLocaleString('en', { month: 'short' }).toUpperCase();
  const dayNum = activityDate.getDate();

  const pricingBadge = tripPricingBadge(activity);
  const isFull = activity.status === 'full' || activity.slotsAvailable <= 0;
  const slotsPercent = Math.round(((activity.slotsTotal - activity.slotsAvailable) / activity.slotsTotal) * 100);

  const goToActivity = () => navigate(activityPath);

  const hostName = activityHostName(activity);
  const hostAvatar = activityHostAvatar(activity);
  const hostUserId = activityHostUserId(activity);
  const showOrg = showTenantBrand(activity);

  const hostBlock = hostName && (
    <div className="flex items-center gap-2 py-2 border-t border-white/50">
      {hostPath ? (
        <Link
          to={hostPath}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-2.5 min-w-0 flex-1 group/host hover:bg-white/30 -mx-1 px-1 rounded-lg transition-colors"
        >
          <SecureAvatar
            src={hostAvatar}
            name={hostName}
            className="w-8 h-8 text-xs ring-2 ring-white shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-neutral-500">Hosted by</p>
            <p className="text-sm font-semibold text-neutral-900 truncate group-hover/host:text-emerald-700">
              {hostName}
            </p>
            {showOrg && activity.tenantName && (
              <p className="text-xs text-neutral-500 truncate">{activity.tenantName}</p>
            )}
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-400 shrink-0" />
        </Link>
      ) : (
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <SecureAvatar
            src={hostAvatar}
            name={hostName}
            className="w-8 h-8 text-xs ring-2 ring-white shrink-0"
          />
          <div className="min-w-0">
            <p className="text-xs text-neutral-500">Hosted by</p>
            <p className="text-sm font-semibold text-neutral-900 truncate">{hostName}</p>
            {showOrg && activity.tenantName && (
              <p className="text-xs text-neutral-500 truncate">{activity.tenantName}</p>
            )}
          </div>
        </div>
      )}
      {!isFeatured && (
        <HostMessageButton
          organizerUserId={hostUserId}
          activityId={activity.id}
        />
      )}
    </div>
  );

  const imageBlock = (
    <div className="relative aspect-[16/9] overflow-hidden">
      <EnvironmentImage src={locationImage} alt={activity.locationName} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
      <div className="absolute top-3 left-3 glass rounded-xl px-2.5 py-1.5 text-center shadow-sm min-w-[48px]">
        <p className="text-xs font-bold text-emerald-600 leading-none">{monthShort}</p>
        <p className="text-lg font-extrabold text-neutral-900 leading-tight">{dayNum}</p>
      </div>
      <div className="absolute top-3 right-3 flex flex-row flex-wrap items-center justify-end gap-1.5 max-w-[calc(100%-4rem)]">
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-md shrink-0 ${
            activity.activityType === 'hiking'
              ? 'bg-emerald-600/90 text-white'
              : activity.activityType === 'camping'
                ? 'bg-amber-500/90 text-white'
                : 'bg-violet-600/90 text-white'
          }`}
        >
          {formatActivityType(activity.activityType)}
        </span>
      </div>
      <div className="absolute bottom-3 right-3 z-10" onClick={(e) => e.stopPropagation()}>
        <ShareButton
          title={activity.title || activity.locationName}
          text={`${activity.date} · ${formatActivityType(activity.activityType)} on UAE Trails`}
          path={`/activity/${activity.id}`}
          iconOnly
        />
      </div>
      <div className="absolute bottom-3 left-3 right-14">
        <h3 className="text-base font-bold text-white leading-snug line-clamp-2 drop-shadow-md">
          {activity.title || activity.locationName}
        </h3>
      </div>
    </div>
  );

  const detailsBlock = (
    <div className="p-4 space-y-3">
      {!isFeatured && (
        <div className="flex items-start justify-between gap-3">
          <span className={`px-2.5 py-1 rounded-xl text-xs font-bold ${pricingBadge.bg} ${pricingBadge.text}`}>
            {pricingBadge.label}
          </span>
          {isFull && (
            <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-neutral-500/10 text-neutral-500">
              Full
            </span>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <div className="inline-flex items-center gap-1.5 glass px-2.5 py-1.5 rounded-xl text-xs text-neutral-600">
          <Clock className="w-3.5 h-3.5 text-emerald-500" />
          <span className="font-semibold">{activity.time}</span>
        </div>
        {activity.meetingPoint && (
          <div className="inline-flex items-center gap-1.5 glass px-2.5 py-1.5 rounded-xl text-xs text-neutral-600">
            <MapPin className="w-3.5 h-3.5 text-emerald-500" />
            <span className="font-medium truncate max-w-[140px]">{activity.meetingPoint}</span>
          </div>
        )}
      </div>

      {hostBlock}

      <div>
        <div className="flex items-center justify-between text-xs text-neutral-500 mb-1.5">
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            <span>{activity.slotsAvailable} / {activity.slotsTotal} spots left</span>
          </div>
          <span className="font-semibold">{slotsPercent}% filled</span>
        </div>
        <div className="h-1.5 bg-neutral-200/60 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              slotsPercent >= 80 ? 'bg-red-400' : slotsPercent >= 50 ? 'bg-amber-400' : 'bg-emerald-500'
            }`}
            style={{ width: `${slotsPercent}%` }}
          />
        </div>
      </div>

      {!isFeatured && (
        <div>
          <p className="text-xs font-medium text-neutral-500 mb-1.5">
            Who&apos;s going{participants.length > 0 ? ` (${participants.length})` : ''}
          </p>
          <ParticipantPreview
            participants={participants}
            max={4}
            emptyLabel="Open spots — request to join"
          />
        </div>
      )}
    </div>
  );

  const cardShell = (children: ReactNode) => (
    <article
      role="button"
      tabIndex={0}
      onClick={goToActivity}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          goToActivity();
        }
      }}
      className="group block w-full max-w-full glass-card-interactive overflow-hidden hover:shadow-glass-lg cursor-pointer"
    >
      {children}
    </article>
  );

  return cardShell(
    <>
      {imageBlock}
      {detailsBlock}
    </>
  );
};

