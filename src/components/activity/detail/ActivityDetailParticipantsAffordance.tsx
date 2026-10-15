import { useState } from 'react';
import { ChevronRight, Users } from 'lucide-react';
import type { ActivityDetailDTO } from '@uaetrail/shared-types';
import { ParticipantPreview } from '../../ui';
import { ActivityDetailParticipantsRosterDialog } from './ActivityDetailParticipantsRosterDialog';
import { activityDetailParticipantCountLabel } from './activityDetailParticipantCountLabel';
import {
  ACTIVITY_PARTICIPANTS_EMPTY_LABEL,
  ACTIVITY_PARTICIPANTS_HOST_MANAGE_HINT,
  ACTIVITY_PARTICIPANTS_SECTION_LABEL,
} from '../../../content/activityParticipantsCopy';

type ActivityDetailParticipantsAffordanceProps = {
  /** Backend roster previews from GET /activities/:id (`data.participants`). */
  participants: NonNullable<ActivityDetailDTO['participants']>;
  rosterParticipants: NonNullable<ActivityDetailDTO['participants']>;
  isHostViewer: boolean;
  activity: ActivityDetailDTO;
  canOpenFullRoster?: boolean;
};

/** Marketing fold — participant preview; crew opens full roster sheet. */
export const ActivityDetailParticipantsAffordance = ({
  participants,
  rosterParticipants,
  isHostViewer,
  activity,
  canOpenFullRoster = false,
}: ActivityDetailParticipantsAffordanceProps) => {
  const [rosterOpen, setRosterOpen] = useState(false);
  const countLabel = activityDetailParticipantCountLabel(activity);
  const sectionLabel = countLabel
    ? `${ACTIVITY_PARTICIPANTS_SECTION_LABEL} (${countLabel})`
    : `${ACTIVITY_PARTICIPANTS_SECTION_LABEL} (${rosterParticipants.length})`;

  const shell = (
    <>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
          <Users className="h-3.5 w-3.5" aria-hidden />
          {sectionLabel}
        </span>
        {canOpenFullRoster ? <ChevronRight className="h-4 w-4 text-neutral-400" aria-hidden /> : null}
      </div>
      <ParticipantPreview
        participants={rosterParticipants}
        size="sm"
        showNames={false}
        linkToProfile={false}
        emptyLabel={ACTIVITY_PARTICIPANTS_EMPTY_LABEL}
      />
      {isHostViewer ? (
        <p className="mt-2 text-xs text-neutral-500">{ACTIVITY_PARTICIPANTS_HOST_MANAGE_HINT}</p>
      ) : null}
    </>
  );

  return (
    <section className="rounded-xl border border-neutral-100 bg-neutral-50/80 px-3 py-2.5">
      {canOpenFullRoster ? (
        <button
          type="button"
          onClick={() => setRosterOpen(true)}
          className="w-full text-left active:opacity-90"
          aria-label={`${sectionLabel}, view all`}
        >
          {shell}
        </button>
      ) : (
        shell
      )}
      <ActivityDetailParticipantsRosterDialog
        open={rosterOpen}
        onClose={() => setRosterOpen(false)}
        participants={participants}
        titleSuffix={countLabel ?? undefined}
      />
    </section>
  );
};
