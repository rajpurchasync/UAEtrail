import { Dialog, SecureAvatar } from '../../ui';
import { ACTIVITY_PARTICIPANTS_SECTION_LABEL } from '../../../content/activityParticipantsCopy';

type ParticipantRow = {
  id: string;
  name?: string | null;
  avatar?: string | null;
};

type ActivityDetailParticipantsRosterDialogProps = {
  open: boolean;
  onClose: () => void;
  participants: ParticipantRow[];
  titleSuffix?: string;
};

/** Roster list for an outing — names only (not profile deep links). */
export const ActivityDetailParticipantsRosterDialog = ({
  open,
  onClose,
  participants,
  titleSuffix,
}: ActivityDetailParticipantsRosterDialogProps) => (
  <Dialog
    open={open}
    onClose={onClose}
    title={`${ACTIVITY_PARTICIPANTS_SECTION_LABEL}${titleSuffix ? ` · ${titleSuffix}` : ''}`}
  >
    {participants.length === 0 ? (
      <p className="text-sm text-neutral-500">No one confirmed yet.</p>
    ) : (
      <ul className="max-h-[min(60dvh,420px)] space-y-2 overflow-y-auto">
        {participants.map((row) => (
          <li
            key={row.id}
            className="flex items-center gap-3 rounded-xl border border-neutral-100 bg-neutral-50/80 px-3 py-2.5"
          >
            <SecureAvatar
              src={row.avatar ?? undefined}
              name={row.name ?? 'Member'}
              className="h-9 w-9 shrink-0 text-sm"
            />
            <span className="min-w-0 truncate text-sm font-medium text-neutral-900">
              {row.name ?? 'Member'}
            </span>
          </li>
        ))}
      </ul>
    )}
  </Dialog>
);
