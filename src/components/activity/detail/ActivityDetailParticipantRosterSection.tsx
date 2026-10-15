import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Users } from 'lucide-react';
import type { ActivityDetailDTO } from '@uaetrail/shared-types';
import { ParticipantPreview } from '../../ui';
import { ActivityInviteLauncher } from '../ActivityInviteLauncher';
import { ActivityDetailParticipantsRosterDialog } from './ActivityDetailParticipantsRosterDialog';
import { activityDetailParticipantCountLabel } from './activityDetailParticipantCountLabel';
import {
  ACTIVITY_DETAIL_PRO_ROSTER_HINT,
  ACTIVITY_DETAIL_PRO_SOCIAL_CTA,
} from '../../../content/activityDetailCopy';
import {
  ACTIVITY_PARTICIPANTS_EMPTY_LABEL,
  ACTIVITY_PARTICIPANTS_SECTION_LABEL,
} from '../../../content/activityParticipantsCopy';

const stripShell = 'rounded-xl border border-neutral-100 bg-neutral-50/80 px-3 py-2.5';
const stripLabel =
  'mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-500';

type ActivityDetailParticipantRosterSectionProps = {
  activity: ActivityDetailDTO;
  participants: NonNullable<ActivityDetailDTO['participants']>;
  rosterParticipants: NonNullable<ActivityDetailDTO['participants']>;
  showRosterProUpsell: boolean;
  proSocialMembershipPath: string;
  canInviteFriends: boolean;
  compact?: boolean;
  canOpenFullRoster?: boolean;
};

/** Joined crew — tap section to open people list (not per-person profile from the strip). */
export const ActivityDetailParticipantRosterSection = ({
  activity,
  participants,
  rosterParticipants,
  showRosterProUpsell,
  proSocialMembershipPath,
  canInviteFriends,
  compact = false,
  canOpenFullRoster = true,
}: ActivityDetailParticipantRosterSectionProps) => {
  const [rosterOpen, setRosterOpen] = useState(false);
  const countLabel = activityDetailParticipantCountLabel(activity);
  const shareActivity = {
    id: activity.id,
    title: activity.title || activity.locationName,
    activityType: activity.activityType,
    date: activity.date,
    locationName: activity.locationName,
  };

  const sectionLabel = countLabel
    ? `${ACTIVITY_PARTICIPANTS_SECTION_LABEL} (${countLabel})`
    : `${ACTIVITY_PARTICIPANTS_SECTION_LABEL} (${participants.length})`;

  const openRoster = () => {
    if (canOpenFullRoster) setRosterOpen(true);
  };

  const preview = (
    <ParticipantPreview
      participants={rosterParticipants}
      size="md"
      showNames={false}
      linkToProfile={false}
      emptyLabel={ACTIVITY_PARTICIPANTS_EMPTY_LABEL}
    />
  );

  return (
    <section className={compact ? stripShell : 'rounded-2xl border border-neutral-100 bg-white p-4'}>
      {canOpenFullRoster ? (
        <button
          type="button"
          onClick={openRoster}
          className="w-full text-left active:opacity-95"
          aria-label={`${sectionLabel}, view people list`}
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className={stripLabel}>
              <Users className="h-3.5 w-3.5" aria-hidden />
              {sectionLabel}
            </span>
            <ChevronRight className="h-4 w-4 text-neutral-400" aria-hidden />
          </div>
          {preview}
        </button>
      ) : (
        <>
          <div className={stripLabel}>
            <Users className="h-3.5 w-3.5" aria-hidden />
            {sectionLabel}
          </div>
          {preview}
        </>
      )}
      {showRosterProUpsell ? (
        <p className="mt-2 text-xs leading-relaxed text-amber-900/90">
          {ACTIVITY_DETAIL_PRO_ROSTER_HINT}{' '}
          <Link to={proSocialMembershipPath} className="font-semibold text-emerald-700 hover:underline">
            {ACTIVITY_DETAIL_PRO_SOCIAL_CTA}
          </Link>
        </p>
      ) : null}
      {canInviteFriends ? (
        <div className="mt-3">
          <ActivityInviteLauncher activity={shareActivity} canSendBuddyInvites variant="link" />
        </div>
      ) : null}
      <ActivityDetailParticipantsRosterDialog
        open={rosterOpen}
        onClose={() => setRosterOpen(false)}
        participants={participants}
        titleSuffix={countLabel ?? undefined}
      />
    </section>
  );
};
