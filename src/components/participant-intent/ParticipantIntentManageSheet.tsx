import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ParticipantIntentDTO } from '@uaetrail/shared-types';
import { ExploreResponsiveSheet } from '../../explore/ui/ExploreResponsiveSheet';
import { exploreOfferRideshareForDemandPath, exploreSavedPinPath } from '../../explore/routing';
import { ShareButton } from '../ui/ShareButton';
import { canOfferRideshareForParticipantIntent } from '../../explore/linkActivityRideshareOffer';
import { ORGANIZE_LINK_RIDESHARE_LABEL } from '../../explore/createFlowCopy';
import { formatParticipantIntentMeta } from '../../trips/participantIntentTrips';
import { AppButton, AppButtonLink } from '../mobile/AppButton';
import { Dialog } from '../ui/Dialog';
import { api } from '../../api/index';
import { useReloadExploreMap } from '../../hooks/useReloadExploreMap';
import { useOrganisationGate } from '../../hooks/useOrganisationGate';
import { useAuth } from '../../context/AuthContext';
import { signInPathForReturn } from '../../utils/authReturnContext';
import { ParticipantIntentEditForm } from './ParticipantIntentEditForm';
import { ParticipantIntentJoinRequestsSection } from './ParticipantIntentJoinRequestsSection';

export type ParticipantIntentManageSheetProps = {
  open: boolean;
  intent: ParticipantIntentDTO | null;
  onClose: () => void;
  onChanged: () => void | Promise<void>;
};

const statusLabel: Record<ParticipantIntentDTO['status'], string> = {
  active: 'On the map',
  fulfilled: 'Linked to outing',
  cancelled: 'Removed',
};

export const ParticipantIntentManageSheet = ({
  open,
  intent,
  onClose,
  onChanged,
}: ParticipantIntentManageSheetProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const gate = useOrganisationGate({ enabled: Boolean(user) });
  const reloadExploreMap = useReloadExploreMap();
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setConfirmRemove(false);
      setEditing(false);
      setError(null);
    }
  }, [open, intent?.id]);

  if (!intent) return null;

  const mapPinId = `demand:${intent.id}`;
  const meta = formatParticipantIntentMeta(intent);
  const showRideshareOffer = canOfferRideshareForParticipantIntent(intent);

  const handleOfferRideshare = () => {
    const returnPath = exploreOfferRideshareForDemandPath(intent.id);
    if (!user) {
      navigate(signInPathForReturn(returnPath));
      return;
    }
    if (gate.loading) return;
    if (!gate.canPublish) {
      navigate(`/become-host?redirect=${encodeURIComponent(returnPath)}`);
      return;
    }
    onClose();
    navigate(returnPath);
  };

  const confirmRemoveIntent = async () => {
    setBusy(true);
    setError(null);
    try {
      await api.cancelParticipantIntent(intent.id);
      setConfirmRemove(false);
      await reloadExploreMap();
      await onChanged();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove this plan.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <ExploreResponsiveSheet
        open={open}
        onClose={onClose}
        overlayFixed
        maxWidthClass="max-w-md"
        ariaLabel="Manage your plan"
      >
        <div className="space-y-4 p-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Your plan</p>
            <h2 className="text-lg font-bold text-neutral-900">{intent.title}</h2>
            <p className="mt-1 text-sm text-neutral-600">{meta}</p>
            <span className="mt-2 inline-flex rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-semibold text-neutral-700">
              {statusLabel[intent.status]}
            </span>
          </div>

          {intent.comment ? (
            <p className="rounded-xl bg-neutral-50 px-3 py-2 text-sm text-neutral-700">{intent.comment}</p>
          ) : null}

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          {intent.status === 'active' && editing ? (
            <ParticipantIntentEditForm
              intent={intent}
              onCancel={() => setEditing(false)}
              onSaved={async () => {
                setEditing(false);
                await onChanged();
              }}
            />
          ) : null}

          {intent.status === 'active' && !editing ? (
            <div className="space-y-2">
              <ParticipantIntentJoinRequestsSection intentId={intent.id} />
              <AppButton type="button" variant="secondary" fullWidth onClick={() => setEditing(true)}>
                Edit plan
              </AppButton>
              <div className="flex items-center justify-between gap-2 rounded-xl border border-neutral-100 bg-neutral-50 px-3 py-2">
                <p className="text-xs text-neutral-600">Share your plan link</p>
                <ShareButton
                  title={intent.title}
                  text="Looking for crew on UAE Trail"
                  path={exploreSavedPinPath(mapPinId)}
                  iconOnly
                  light
                />
              </div>
              <AppButtonLink
                to={exploreSavedPinPath(mapPinId)}
                variant="secondary"
                fullWidth
                onClick={onClose}
              >
                View on map
              </AppButtonLink>
              {showRideshareOffer ? (
                <AppButton type="button" className="w-full" onClick={handleOfferRideshare}>
                  {ORGANIZE_LINK_RIDESHARE_LABEL}
                </AppButton>
              ) : null}
              <AppButton
                type="button"
                variant="destructive"
                className="w-full"
                onClick={() => setConfirmRemove(true)}
              >
                Remove from map
              </AppButton>
            </div>
          ) : null}

          {intent.status === 'fulfilled' && intent.convertedActivityId ? (
            <AppButtonLink
              to={`/activity/${intent.convertedActivityId}`}
              fullWidth
              onClick={onClose}
            >
              View outing
            </AppButtonLink>
          ) : null}

          <AppButton type="button" variant="plain" fullWidth onClick={onClose}>
            Close
          </AppButton>
        </div>
      </ExploreResponsiveSheet>

      <Dialog open={confirmRemove} onClose={() => setConfirmRemove(false)} title="Remove from map?">
        <p className="mb-4 text-sm text-neutral-600">
          Your looking-for pin will disappear from the map. You can post a new one anytime.
        </p>
        <div className="flex justify-end gap-2">
          <AppButton type="button" variant="secondary" onClick={() => setConfirmRemove(false)}>
            Keep plan
          </AppButton>
          <AppButton type="button" variant="destructive" disabled={busy} onClick={() => void confirmRemoveIntent()}>
            Remove
          </AppButton>
        </div>
      </Dialog>
    </>
  );
};
