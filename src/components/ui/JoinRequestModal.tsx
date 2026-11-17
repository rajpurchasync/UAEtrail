import { useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  ActivityDetailDTO,
  activityJoinCtaLabel,
  activityJoinIsFull,
  formatPackingJoinNote,
  isPackingSignatureValid,
  missingRequiredPackingIds,
  parsePackingList,
  resolveParticipationMode,
  type ActivityDTO,
  joinHostProfileShareNotice,
  resolveJoinHostProfileDisclosureNeeds,
} from '@uaetrail/shared-types';
import { JoinPackingAck } from '../activity/JoinPackingAck';
import { formatDate } from '../../utils';
import { activityHostName, showTenantBrand } from '../../utils/hostLabels';
import { resolveExplorePrice } from '../../explore/explorePriceLabel';
import {
  extractJoinInstructionLines,
  JOIN_MANDATORY_AGREEMENT_TEXT,
  MEETING_POINT_LABEL,
  MANDATORY_INSTRUCTIONS_LABEL,
} from '../../utils/joinInstructions';
import { afterActivityJoinClientRefresh } from '../../hooks/activityJoinClientEffects';
import { submitActivityJoin } from '../../hooks/activityJoinClientApi';
import { ActivityFamilyPartyPicker } from '../activity/detail/ActivityFamilyPartyPicker';
import { PartyJoinModePicker } from '../../detail/shell/PartyJoinModePicker';
import { PartySizeSelect } from '../../detail/shell/PartySizeSelect';
import { resetPartyJoinIntent, usePartyJoinIntent } from '../../detail/partyJoinIntent';
import { useSharedPartySize } from '../../detail/partySizeState';
import { useAuth } from '../../context/AuthContext';
import { Dialog } from './Dialog';
import {
  JOIN_REQUEST_MODAL_IDLE,
  joinRequestModalFormError,
  joinRequestModalFormWithError,
  joinRequestModalIsSubmitting,
  joinRequestModalShowSuccess,
  type JoinRequestModalStatus,
} from './joinRequestModalStatus';

type JoinableActivity = Pick<
  ActivityDTO,
  | 'id'
  | 'locationName'
  | 'title'
  | 'date'
  | 'time'
  | 'price'
  | 'slotsAvailable'
  | 'slotsTotal'
  | 'requirements'
  | 'meetingPoint'
  | 'tenantName'
  | 'hostName'
  | 'participationMode'
  | 'audience'
>;

interface JoinRequestModalProps {
  open: boolean;
  onClose: () => void;
  activity: JoinableActivity | ActivityDetailDTO;
  isFull?: boolean;
  onSuccess?: (message: string) => void;
  /** Map list row id when known (defaults to `activity:{id}`). */
  exploreMapItemId?: string | null;
  overlayClassName?: string;
}

export const JoinRequestModal = ({
  open,
  onClose,
  activity,
  isFull,
  onSuccess,
  exploreMapItemId,
  overlayClassName,
}: JoinRequestModalProps) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [note, setNote] = useState('');
  const { adults, kids, setAdults, setKids } = useSharedPartySize();
  const { mode, teamId, membershipIds, setMode, setTeam } = usePartyJoinIntent();
  const [agreed, setAgreed] = useState(false);
  const [packingCheckedIds, setPackingCheckedIds] = useState<string[]>([]);
  const [packingSignature, setPackingSignature] = useState('');
  const [status, setStatus] = useState<JoinRequestModalStatus>(JOIN_REQUEST_MODAL_IDLE);
  const closeTimerRef = useRef<number | null>(null);
  const submitting = joinRequestModalIsSubmitting(status);
  const submitted = joinRequestModalShowSuccess(status);
  const error = joinRequestModalFormError(status);

  const participationMode = useMemo(
    () => resolveParticipationMode(activity.participationMode, activity.requirements),
    [activity.participationMode, activity.requirements]
  );
  const isRsvp = participationMode === 'rsvp';
  const instructions = extractJoinInstructionLines(activity.requirements);
  const packing = parsePackingList(activity.requirements);
  const hasInstructions = instructions.length > 0;
  const hasPacking = packing.items.length > 0;
  const packingStrict = hasPacking && packing.mode === 'strict';
  const full =
    isFull ??
    activityJoinIsFull({
      slotsTotal: activity.slotsTotal,
      slotsAvailable: activity.slotsAvailable,
    });
  const needsAgreement = hasInstructions;
  const packingReady =
    !packingStrict ||
    (missingRequiredPackingIds(packing.items, packingCheckedIds).length === 0 &&
      isPackingSignatureValid(packingSignature));
  const kidsAllowed =
    activity.audience?.kidsWelcome !== false &&
    !activity.requirements?.some((line) => line.trim().toLowerCase() === 'no children');

  const hostProfileDisclosure = useMemo(() => {
    const needs = resolveJoinHostProfileDisclosureNeeds(activity.requirements);
    return joinHostProfileShareNotice(needs);
  }, [activity.requirements]);

  const priceInfo = resolveExplorePrice({
    isRideshare: false,
    price: activity.price,
  });

  const dialogTitle = activityJoinCtaLabel({
    participationMode,
    requirements: activity.requirements,
    isFull: full,
  });

  useEffect(() => {
    return () => {
      if (closeTimerRef.current != null) window.clearTimeout(closeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    if (closeTimerRef.current != null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setNote('');
    setAgreed(false);
    setPackingCheckedIds([]);
    setPackingSignature('');
    setStatus(JOIN_REQUEST_MODAL_IDLE);
    resetPartyJoinIntent();
  }, [open, activity.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (full) return;

    if (submitting || submitted) return;

    if (needsAgreement && !agreed) {
      setStatus(joinRequestModalFormWithError('Please read the mandatory instructions and confirm before joining.'));
      return;
    }
    if (packingStrict && missingRequiredPackingIds(packing.items, packingCheckedIds).length > 0) {
      setStatus(joinRequestModalFormWithError('Tick every must-have item before joining.'));
      return;
    }
    if (packingStrict && !isPackingSignatureValid(packingSignature)) {
      setStatus(joinRequestModalFormWithError('Type your first and last name to confirm.'));
      return;
    }
    if (mode === 'team' && membershipIds.length === 0) {
      setStatus(joinRequestModalFormWithError('Pick at least one team member to bring on this outing.'));
      return;
    }

    setStatus({ kind: 'submitting' });
    try {
      const packedNote = hasPacking
        ? formatPackingJoinNote({
            items: packing.items,
            checkedIds: packingCheckedIds,
            signature: packingSignature,
            note: note.trim(),
          })
        : note.trim();
      const teamJoin = mode === 'team' && membershipIds.length > 0;
      const headcountJoin = mode === 'headcount';
      const { successMessage } = await submitActivityJoin(activity.id, {
        participationMode,
        note: packedNote || undefined,
        packingCheckedIds: hasPacking ? packingCheckedIds : undefined,
        packingSignature: packingStrict ? packingSignature.trim() : undefined,
        ...(teamJoin
          ? { partyMemberIds: membershipIds, sourceTeamId: teamId ?? undefined }
          : headcountJoin
            ? { adults, kids: kidsAllowed ? kids : 0 }
            : { adults: 1, kids: 0 }),
      });
      afterActivityJoinClientRefresh(queryClient, {
        activityId: activity.id,
        participationMode,
        exploreMapItemId,
      });
      setStatus({ kind: 'success' });
      onSuccess?.(successMessage);
      closeTimerRef.current = window.setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setStatus(
        joinRequestModalFormWithError(
          err instanceof Error ? err.message : 'We couldn\'t complete that — sign in and try again.'
        )
      );
    }
  };

  const hostName = activityHostName(activity);
  const submitLabel = submitting
    ? isRsvp
      ? 'Saving…'
      : 'Sending…'
    : activityJoinCtaLabel({ participationMode, requirements: activity.requirements, isFull: full });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={dialogTitle}
      className="max-w-md"
      overlayClassName={overlayClassName ?? 'z-50'}
    >
      {!submitted ? (
        <>
          <div className="p-4 -mx-2 mb-4 bg-gray-50 border border-gray-100 rounded-xl dark:border-neutral-700 dark:bg-neutral-800">
            <h3 className="font-semibold text-gray-900 dark:text-neutral-50">{activity.title || activity.locationName}</h3>
            <p className="text-sm text-gray-600">
              {formatDate(activity.date)} at {activity.time}
            </p>
            <div className="flex items-center gap-3 mt-2">
              <p
                className={`text-sm font-semibold ${
                  priceInfo.kind === 'free' ? 'text-emerald-600' : 'text-gray-800'
                }`}
              >
                {priceInfo.badge}
              </p>
              <span className="text-xs text-gray-500">•</span>
              <p className="text-sm text-gray-600">
                {activity.slotsAvailable} / {activity.slotsTotal} slots available
              </p>
            </div>
            {hostName && (
              <p className="text-xs text-gray-500 mt-1">
                Hosted by {hostName}
                {showTenantBrand(activity) && activity.tenantName ? ` · ${activity.tenantName}` : ''}
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              <PartyJoinModePicker mode={mode} onChange={setMode} />
              {mode === 'headcount' ? (
                <PartySizeSelect
                  adults={adults}
                  kids={kidsAllowed ? kids : 0}
                  onAdults={setAdults}
                  onKids={setKids}
                  compact
                  kidsAllowed={kidsAllowed}
                />
              ) : null}
              {mode === 'team' ? (
                <ActivityFamilyPartyPicker
                  enabled={open}
                  kidsAllowed={kidsAllowed}
                  selectedMembershipIds={membershipIds}
                  onChange={(ids) => setTeam(teamId, ids)}
                  onTeamIdChange={(id) => setTeam(id, [])}
                  viewerUserId={user?.id}
                />
              ) : null}
            </div>
            {hasPacking ? (
              <JoinPackingAck
                mode={packing.mode}
                items={packing.items}
                checkedIds={packingCheckedIds}
                signature={packingSignature}
                onToggle={(id, next) =>
                  setPackingCheckedIds((current) =>
                    next ? [...new Set([...current, id])] : current.filter((value) => value !== id)
                  )
                }
                onSignatureChange={setPackingSignature}
              />
            ) : null}

            {hostProfileDisclosure ? (
              <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 dark:border-sky-900/50 dark:bg-sky-950/40">
                <p className="text-sm font-semibold text-sky-900 dark:text-sky-100">Shared with host</p>
                <p className="mt-1 text-xs leading-relaxed text-sky-900/90 dark:text-sky-100/90">
                  {hostProfileDisclosure}
                </p>
              </div>
            ) : null}

            {hasInstructions ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-amber-900 mb-1">{MANDATORY_INSTRUCTIONS_LABEL}</p>
                <p className="text-xs text-amber-900/80 mb-2">
                  {isRsvp
                    ? 'Please read these before confirming.'
                    : 'You must agree to these before requesting to join.'}
                </p>
                <ul className="text-sm text-amber-900/90 list-disc list-inside space-y-1.5">
                  {instructions.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : !isRsvp ? (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-sm text-gray-700">
                  The host has not added mandatory instructions for this outing. You can still send a request — use the
                  note below if you want to introduce yourself or ask a question.
                </p>
              </div>
            ) : null}

            {activity.meetingPoint && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                <p className="text-xs font-medium text-gray-700 mb-1">{MEETING_POINT_LABEL}</p>
                <p className="text-xs text-gray-500 mb-1">For reference only — not a join requirement.</p>
                <p className="text-sm text-gray-600">{activity.meetingPoint}</p>
              </div>
            )}

            {!isRsvp && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note to host (optional)</label>
                <textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. I have prior hiking experience, dietary needs, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                />
              </div>
            )}

            {hasInstructions && (
              <label className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-800 leading-relaxed">
                  {JOIN_MANDATORY_AGREEMENT_TEXT}
                </span>
              </label>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || full || (needsAgreement && !agreed) || !packingReady}
              className="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-60"
            >
              {submitLabel}
            </button>
            <p className="text-xs text-gray-500 text-center">
              {isRsvp ? 'You\'ll show up on Plan right away.' : 'The host will review your request'}
            </p>
          </form>
        </>
      ) : (
        <div className="py-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {isRsvp ? "You're going!" : 'Request sent!'}
          </h3>
          <p className="text-gray-600">
            {isRsvp ? 'See it on Plan.' : 'We\'ll let you know as soon as the host replies.'}
          </p>
        </div>
      )}
    </Dialog>
  );
};
