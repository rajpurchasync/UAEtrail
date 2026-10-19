import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ActivityDTO, ParticipantIntentDTO } from '@uaetrail/shared-types';
import { ExploreResponsiveSheet } from '../../explore/ui/ExploreResponsiveSheet';
import { LinkRidesharePanel } from '../../explore/ui/LinkRidesharePanel';
import {
  exploreOfferRideshareForSeekingPath,
  participantIntentExplorePinPath,
} from '../../explore/routing';
import { ShareButton } from '../ui/ShareButton';
import {
  canLinkRideshareToActivity,
  canOfferRideshareForParticipantIntent,
} from '../../explore/linkActivityRideshareOffer';
import { navigateToCreateLinkedRideshare } from '../../explore/navigateCreateLinkedRideshare';
import {
  HOSTING_LINK_RIDESHARE_LABEL,
  HOSTING_LINK_RIDESHARE_PASTE_CTA,
  HOSTING_RIDESHARE_LINKED_NOTICE,
} from '../../explore/createFlowCopy';
import { fetchPublicActivityDetail } from '../../hooks/publicActivityClientApi';
import { useSafeAsyncEffect } from '../../hooks/useSafeAsyncEffect';
import { resolveParticipantIntentActivityId } from '../../member-plan/resolveParticipantIntentActivityId';
import { planHostedActivityManagePath } from '../../plan/planRouting';
import { formatParticipantIntentMeta } from '../../member-plan/participantIntentPlan';
import { AppButton, AppButtonLink } from '../mobile/AppButton';
import { Dialog } from '../ui/Dialog';
import {
  cancelSeekingPost,
  invalidateMySeekingPostsQueries,
} from '../../hooks/seekingClientApi';
import { useReloadExploreMap } from '../../hooks/useReloadExploreMap';
import { useMemberStatus } from '../../hooks/useMemberStatus';
import { useAuth } from '../../context/AuthContext';
import { signInPathForReturn } from '../../utils/authReturnContext';
import {
  memberPublishGateHref,
  memberPublishGateInputFromMemberStatus,
} from '../../utils/memberPublishGate';
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
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();
  const gate = useMemberStatus({ enabled: Boolean(user) });
  const reloadExploreMap = useReloadExploreMap();
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [rideshareNotice, setRideshareNotice] = useState<string | null>(null);
  const [linkedParentActivity, setLinkedParentActivity] = useState<ActivityDTO | null>(null);
  const [canAddLinkedRide, setCanAddLinkedRide] = useState(false);

  const tenantId = gate.tenantId;
  const seekingActivityId = resolveParticipantIntentActivityId(intent);

  useSafeAsyncEffect(
    async (isActive) => {
      if (!open || !seekingActivityId) {
        if (isActive()) {
          setLinkedParentActivity(null);
          setCanAddLinkedRide(false);
        }
        return;
      }
      try {
        const detail = await fetchPublicActivityDetail(seekingActivityId);
        if (isActive()) {
          setLinkedParentActivity(detail.activity);
          setCanAddLinkedRide(detail.viewerAccess?.entitlements?.canAddLinkedRide ?? false);
        }
      } catch {
        if (isActive()) {
          setLinkedParentActivity(null);
          setCanAddLinkedRide(false);
        }
      }
    },
    [open, seekingActivityId]
  );

  useEffect(() => {
    if (!open) {
      setConfirmRemove(false);
      setEditing(false);
      setError(null);
      setPasteOpen(false);
      setRideshareNotice(null);
    }
  }, [open, intent?.id]);

  if (!intent) return null;

  const mapPinPath = participantIntentExplorePinPath(intent);
  const meta = formatParticipantIntentMeta(intent);
  const showRideshareOffer = canOfferRideshareForParticipantIntent(intent);
  const showLinkRideshare =
    showRideshareOffer &&
    Boolean(tenantId && linkedParentActivity) &&
    canLinkRideshareToActivity(linkedParentActivity) &&
    canAddLinkedRide;

  const handleOfferRideshareLegacy = () => {
    const returnPath = exploreOfferRideshareForSeekingPath(intent);
    if (!user) {
      navigate(signInPathForReturn(returnPath));
      return;
    }
    if (gate.loading) return;
    if (!gate.canPublish) {
      navigate(
        memberPublishGateHref(
          returnPath,
          memberPublishGateInputFromMemberStatus({
            viewerUserId: user.id,
            profileComplete: gate.profileComplete,
            canPublish: gate.canPublish,
            isCommunityHost: gate.isCommunityHost,
            hostTiers: gate.hostTiers,
          })
        )
      );
      return;
    }
    onClose();
    navigate(returnPath);
  };

  const handleCreateLinkedRideshare = () => {
    if (linkedParentActivity) {
      onClose();
      navigateToCreateLinkedRideshare(navigate, linkedParentActivity);
      return;
    }
    handleOfferRideshareLegacy();
  };

  const confirmRemoveIntent = async () => {
    setBusy(true);
    setError(null);
    try {
      await cancelSeekingPost(intent.id);
      invalidateMySeekingPostsQueries(queryClient);
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
                  path={mapPinPath}
                  iconOnly
                  light
                />
              </div>
              <AppButtonLink
                to={mapPinPath}
                variant="secondary"
                fullWidth
                onClick={onClose}
              >
                View on map
              </AppButtonLink>
              {seekingActivityId ? (
                <AppButtonLink
                  to={planHostedActivityManagePath(seekingActivityId)}
                  fullWidth
                  onClick={onClose}
                >
                  Manage join requests
                </AppButtonLink>
              ) : null}
              {rideshareNotice ? (
                <p
                  className={`rounded-lg px-3 py-2 text-sm leading-snug ${
                    rideshareNotice === HOSTING_RIDESHARE_LINKED_NOTICE
                      ? 'border border-emerald-200 bg-emerald-50 text-emerald-900'
                      : 'bg-red-50 text-red-700'
                  }`}
                >
                  {rideshareNotice}
                </p>
              ) : null}
              {showLinkRideshare && pasteOpen && tenantId && linkedParentActivity ? (
                <LinkRidesharePanel
                  tenantId={tenantId}
                  parentActivityId={linkedParentActivity.id}
                  variant="pasteOnly"
                  onCreateRideshare={handleCreateLinkedRideshare}
                  onLinked={() => {
                    setRideshareNotice(HOSTING_RIDESHARE_LINKED_NOTICE);
                    setPasteOpen(false);
                  }}
                  onError={(message) => setRideshareNotice(message)}
                />
              ) : null}
              {showLinkRideshare ? (
                <div className="space-y-2">
                  <AppButton type="button" className="w-full" onClick={handleCreateLinkedRideshare}>
                    {HOSTING_LINK_RIDESHARE_LABEL}
                  </AppButton>
                  <AppButton
                    type="button"
                    variant="secondary"
                    className="w-full"
                    onClick={() => setPasteOpen((value) => !value)}
                  >
                    {HOSTING_LINK_RIDESHARE_PASTE_CTA}
                  </AppButton>
                </div>
              ) : showRideshareOffer ? (
                <AppButton type="button" className="w-full" onClick={handleOfferRideshareLegacy}>
                  {HOSTING_LINK_RIDESHARE_LABEL}
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
