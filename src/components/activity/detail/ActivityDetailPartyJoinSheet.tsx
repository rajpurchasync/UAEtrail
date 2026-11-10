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

const PARTY_SHEET_Z = Number.parseInt(EXPLORE_Z.shareSheet.replace('z-[', '').replace(']', ''), 10) || 6800;

type ActivityDetailPartyJoinSheetProps = {
  open: boolean;
  onClose: () => void;
  adults: number;
  kids: number;
  onAdults: (n: number) => void;
  onKids: (n: number) => void;
  /** Join flow — primary continues to join modal. Edit flow — saves on dismiss. */
  variant: 'join' | 'edit';
  joinLabel?: string;
  joinDisabled?: boolean;
  onConfirmJoin?: () => void;
  partyJoined?: boolean;
  /** Solo joiner — kids / family only (no adult counter). */
  familyOnly?: boolean;
};

/** Mobile group join — slide-up before join, or edit after request. */
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
  partyJoined = false,
  familyOnly = false,
}: ActivityDetailPartyJoinSheetProps) => {
  const title =
    variant === 'join'
      ? GROUP_JOIN_JOIN_HEADLINE
      : familyOnly
        ? GROUP_JOIN_FAMILY_HEADLINE
        : GROUP_JOIN_EDIT_HEADLINE;
  const subtitle =
    variant === 'join'
      ? GROUP_JOIN_JOIN_LEAD
      : familyOnly
        ? GROUP_JOIN_FAMILY_LEAD
        : GROUP_JOIN_EDIT_LEAD;

  const primaryFooter =
    variant === 'join' && joinLabel && onConfirmJoin ? (
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
        onClick={onClose}
        className={`${activityDetailFooterPrimaryButtonClass(true)} w-full`}
      >
        Done
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
      <PartySizeSelect
        adults={adults}
        kids={kids}
        onAdults={onAdults}
        onKids={onKids}
        compact
        joined={partyJoined || familyOnly}
      />
    </ConsumerBottomSheet>
  );
};
