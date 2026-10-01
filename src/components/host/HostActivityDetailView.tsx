import type { ReactNode } from 'react';
import type { ActivityDTO } from '@uaetrail/shared-types';
import { inferJoinModeFromRequirements } from '@uaetrail/shared-types';
import { Calendar, MapPin, MessageCircle, Shield, User, Users, Wallet } from 'lucide-react';
import { ParticipantPreview } from '../ui/ParticipantPreview';
import {
  activityTypeBadgeClass,
  formatActivityCapacity,
  formatActivityPrice,
  formatActivityType,
  resolveActivityHostLabel,
  resolveActivityTitle,
} from '../../utils/activityIdentity';
import { formatDate } from '../../utils';
import { hostActivityManageCapabilities } from '../../host/hostActivityManageCapabilities';

const DetailBlock = ({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) => (
  <div className="flex gap-3 py-3 first:pt-0 last:pb-0">
    <div className="mt-0.5 text-neutral-400" aria-hidden>{icon}</div>
    <div className="min-w-0 flex-1">
      <p className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">{label}</p>
      <div className="mt-1 text-sm text-neutral-800 leading-relaxed">{children}</div>
    </div>
  </div>
);

const SpecList = ({ title, items }: { title: string; items: string[] }) => {
  if (items.length === 0) return null;
  return (
    <section className="space-y-2">
      <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-400">{title}</h3>
      <ul className="list-disc space-y-1 pl-5 text-sm text-neutral-700">
        {items.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </section>
  );
};

const joinModeLabel = (activity: ActivityDTO) => {
  const mode = activity.joinMode ?? inferJoinModeFromRequirements(activity.requirements);
  return mode === 'private' ? 'Private — link or invite only' : 'Open on the map';
};

const participationLabel = (activity: ActivityDTO) =>
  activity.participationMode === 'rsvp' ? 'Instant RSVP (I’m going)' : 'Request to join (host approves)';

type HostActivityDetailViewProps = {
  activity: ActivityDTO;
};

/** Full host-facing outing detail — creation fields in a scannable layout. */
export const HostActivityDetailView = ({ activity }: HostActivityDetailViewProps) => {
  const caps = hostActivityManageCapabilities(activity);
  const title = resolveActivityTitle(activity);
  const participants = activity.participantPreviews ?? [];
  const whenPrimary = [formatDate(activity.date), activity.time].filter(Boolean).join(' · ');
  const whenEnd =
    activity.endDate || activity.endTime
      ? [activity.endDate ? formatDate(activity.endDate) : null, activity.endTime].filter(Boolean).join(' · ')
      : null;
  const priceLabel = formatActivityPrice(activity);
  const packages =
    activity.pricePackages && activity.pricePackages.length > 0
      ? activity.pricePackages.map((p) => `${p.label}: ${p.currency} ${p.amount}`).join(' · ')
      : null;

  return (
    <div className="space-y-5">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${activityTypeBadgeClass(activity.activityType)}`}
          >
            {formatActivityType(activity.activityType)}
          </span>
          <span className="text-[11px] font-bold uppercase tracking-wide text-neutral-400 capitalize">
            {activity.status}
          </span>
          {caps?.kindLabel ? (
            <span className="text-[11px] font-semibold text-emerald-700">{caps.kindLabel}</span>
          ) : null}
        </div>
        <h2 className="text-xl font-bold leading-snug text-neutral-900">{title}</h2>
      </header>

      {activity.bannerUrl ? (
        <div className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-neutral-100">
          <img src={activity.bannerUrl} alt="" className="max-h-40 w-full object-cover" />
        </div>
      ) : null}

      <div className="divide-y divide-neutral-100 rounded-2xl border border-neutral-200/80 bg-white px-4">
        <DetailBlock icon={<Calendar className="h-4 w-4" />} label="When">
          <p>{whenPrimary}</p>
          {whenEnd ? <p className="mt-1 text-neutral-500">Ends {whenEnd}</p> : null}
        </DetailBlock>

        <DetailBlock icon={<MapPin className="h-4 w-4" />} label="Venue">
          <p className="font-medium">{activity.locationName || '—'}</p>
          {activity.region ? <p className="mt-0.5 text-neutral-500">{activity.region}</p> : null}
          {activity.meetingPoint ? (
            <p className="mt-2 text-neutral-600">
              <span className="font-semibold text-neutral-700">Meeting: </span>
              {activity.meetingPoint}
            </p>
          ) : null}
          {activity.startPoint && activity.startPoint !== activity.meetingPoint ? (
            <p className="mt-1 text-neutral-600">
              <span className="font-semibold text-neutral-700">Start: </span>
              {activity.startPoint}
            </p>
          ) : null}
          {activity.parkingPoint ? (
            <p className="mt-1 text-neutral-600">
              <span className="font-semibold text-neutral-700">Parking: </span>
              {activity.parkingPoint}
            </p>
          ) : null}
        </DetailBlock>

        <DetailBlock icon={<Users className="h-4 w-4" />} label="Participants">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <ParticipantPreview
              participants={participants}
              max={8}
              size="sm"
              showNames
              emptyLabel="No confirmed joiners yet"
            />
            <span className="text-xs font-semibold tabular-nums text-neutral-500">
              {formatActivityCapacity(activity)} spots
            </span>
          </div>
        </DetailBlock>

        <DetailBlock icon={<Wallet className="h-4 w-4" />} label="Price">
          <p>{priceLabel}</p>
          {packages ? <p className="mt-1 text-neutral-500">{packages}</p> : null}
          {activity.paymentTerms ? (
            <p className="mt-2 text-neutral-600">{activity.paymentTerms}</p>
          ) : null}
        </DetailBlock>

        <DetailBlock icon={<Shield className="h-4 w-4" />} label="Who can join">
          <p>{joinModeLabel(activity)}</p>
          <p className="mt-1 text-neutral-600">{participationLabel(activity)}</p>
        </DetailBlock>

        <DetailBlock icon={<User className="h-4 w-4" />} label="Host on site">
          <p>{resolveActivityHostLabel(activity)}</p>
          {activity.hostBio ? <p className="mt-1 text-neutral-600">{activity.hostBio}</p> : null}
        </DetailBlock>
      </div>

      {activity.description?.trim() ? (
        <section className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-400">About</h3>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-700">{activity.description}</p>
        </section>
      ) : null}

      <SpecList title="Requirements" items={activity.requirements ?? []} />
      <SpecList title="Itinerary" items={activity.itinerary ?? []} />

      {activity.rideshareEnabled ? (
        <section className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/80 px-4 py-3 text-sm text-neutral-700">
          <div className="flex items-center gap-2 font-semibold text-neutral-800">
            <MessageCircle className="h-4 w-4" aria-hidden />
            Rideshare
          </div>
          <p className="mt-1 text-neutral-600">
            {activity.rideshareFree
              ? 'Free seats offered'
              : activity.ridesharePriceAed
                ? `AED ${activity.ridesharePriceAed} per seat`
                : 'Rideshare enabled'}
            {activity.rideshareSeats ? ` · ${activity.rideshareSeats} seats` : ''}
          </p>
          {activity.rideshareDetails ? (
            <p className="mt-1 text-neutral-600">{activity.rideshareDetails}</p>
          ) : null}
        </section>
      ) : null}

      {activity.signupUrl ? (
        <section className="space-y-1">
          <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-400">External signup</h3>
          <a
            href={activity.signupUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-emerald-700 break-all"
          >
            {activity.signupUrl}
          </a>
        </section>
      ) : null}

    </div>
  );
};
