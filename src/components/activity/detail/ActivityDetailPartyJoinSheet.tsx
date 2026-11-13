import { useEffect, useState } from 'react';
import { ConsumerBottomSheet } from '../../mobile/ConsumerBottomSheet';
import {
  GROUP_JOIN_EDIT_HEADLINE,
  GROUP_JOIN_EDIT_LEAD,
  GROUP_JOIN_FAMILY_HEADLINE,
  GROUP_JOIN_FAMILY_LEAD,
  GROUP_JOIN_JOIN_HEADLINE,
  GROUP_JOIN_JOIN_LEAD,
} from '../../../content/groupJoinCopy';
import { PartySizeSelect } from '../../../detail/shell/PartySizeSelect';
import { activityDetailFooterPrimaryButtonClass } from './ActivityDetailStandardFooter';
import { EXPLORE_Z } from '../../../config/exploreTheme';
import { ActivityFamilyPartyPicker } from './ActivityFamilyPartyPicker';

const PARTY_SHEET_Z = Number.parseInt(EXPLORE_Z.shareSheet.replace('z-[', '').replace(']', ''), 10) || 6800;

type ActivityDetailPartyJoinSheetProps = {
  open: boolean;
  onClose: () => void;
  adults: number;
  kids: number;
  onAdults: (n: number) => void;
  onKids: (n: number) => void;
  /** Join flow — primary continues to join modal. Edit flow — saves roster / headcount. */
  variant: 'join' | 'edit';
  joinLabel?: string;
  joinDisabled?: boolean;
  onConfirmJoin?: () => void;
  /** Edit / family roster — receives selected membership ids when using the picker. */
  onSaveEdit?: (membershipIds?: string[]) => void;
  partyJoined?: boolean;
  /** Solo joiner — family roster picker (named members). */
  familyOnly?: boolean;
  kidsAllowed?: boolean;
  selectedMembershipIds?: string[];
  viewerUserId?: string | null;
  saving?: boolean;
};

/** Mobile group join — slide-up before join, or family roster edit after request. */
export const ActivityDetailPartyJoinSheet = ({
  open,
  onClose,
  adults,
  kids,
  onAdults,
  onKids,
  variant,
  joinLabel,
  joinDisabled = false,
  onConfirmJoin,
  onSaveEdit,
  partyJoined = false,
  familyOnly = false,
  kidsAllowed = true,
  selectedMembershipIds = [],
  viewerUserId,
  saving = false,
}: ActivityDetailPartyJoinSheetProps) => {
  const [localIds, setLocalIds] = useState(selectedMembershipIds);

  useEffect(() => {
    if (open) setLocalIds(selectedMembershipIds);
  }, [open, selectedMembershipIds]);

  const useRosterPicker = variant === 'edit' || familyOnly;

  const title =
    variant === 'join' && !familyOnly
      ? GROUP_JOIN_JOIN_HEADLINE
      : familyOnly
        ? GROUP_JOIN_FAMILY_HEADLINE
        : GROUP_JOIN_EDIT_HEADLINE;
  const subtitle =
    variant === 'join' && !familyOnly
      ? GROUP_JOIN_JOIN_LEAD
      : familyOnly
        ? GROUP_JOIN_FAMILY_LEAD
        : GROUP_JOIN_EDIT_LEAD;

  const primaryFooter =
    variant === 'join' && !familyOnly && joinLabel && onConfirmJoin ? (
      <button
        type="button"
        disabled={joinDisabled}
        data-activity-join-cta
        onClick={() => {
          onConfirmJoin();
          onClose();
        }}
        className={`${activityDetailFooterPrimaryButtonClass(true)} w-full`}
      >
        {joinLabel}
      </button>
    ) : (
      <button
        type="button"
        disabled={saving}
        onClick={() => {
          onSaveEdit?.(useRosterPicker ? localIds : undefined);
          onClose();
        }}
        className={`${activityDetailFooterPrimaryButtonClass(true)} w-full`}
      >
        {saving ? 'Saving…' : 'Done'}
      </button>
    );

  return (
    <ConsumerBottomSheet
      open={open}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      zIndex={PARTY_SHEET_Z}
      footer={primaryFooter}
    >
      {useRosterPicker ? (
        <ActivityFamilyPartyPicker
          enabled={open}
          kidsAllowed={kidsAllowed}
          selectedMembershipIds={localIds}
          onChange={setLocalIds}
          viewerUserId={viewerUserId}
        />
      ) : (
        <PartySizeSelect
          adults={adults}
          kids={kidsAllowed ? kids : 0}
          onAdults={onAdults}
          onKids={onKids}
          compact
          joined={partyJoined}
          kidsAllowed={kidsAllowed}
        />
      )}
    </ConsumerBottomSheet>
  );
};
