import {
  LogOut,
  MessageCircle,
  MessageSquare,
  Settings2,
  Share2,
  UserPlus,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type {
  ActivityDetailFooterAction,
  ActivityDetailFooterButton,
} from './activityDetailFooterSlots';

const FOOTER_BTN_BASE =
  'flex flex-1 items-center justify-center text-center shadow-sm disabled:opacity-60';
const FOOTER_BTN_MOBILE = `${FOOTER_BTN_BASE} min-h-10 min-w-0 shrink-0 rounded-xl px-1.5 py-1.5 text-[11px] font-semibold leading-tight`;
const FOOTER_BTN_DESKTOP =
  'flex min-h-[3.25rem] flex-1 items-center justify-center rounded-2xl px-3 text-center text-sm font-bold shadow-sm disabled:opacity-60 lg:min-h-9 lg:rounded-lg lg:text-[13px] lg:font-semibold';

const primaryClass = `${FOOTER_BTN_DESKTOP} bg-emerald-600 text-white active:bg-emerald-700`;
const primaryClassCompact = `${FOOTER_BTN_MOBILE} bg-emerald-600 text-white active:bg-emerald-700`;

export const activityDetailFooterPrimaryButtonClass = (compact = false): string =>
  compact ? primaryClassCompact : primaryClass;

const secondaryClass = `${FOOTER_BTN_DESKTOP} border border-neutral-200 bg-white text-neutral-800 active:bg-neutral-50`;
const secondaryClassCompact = `${FOOTER_BTN_MOBILE} border border-neutral-200 bg-white text-neutral-800 active:bg-neutral-50`;

const statusClass = `${FOOTER_BTN_DESKTOP} bg-amber-100 text-amber-900 disabled:opacity-100`;
const statusClassCompact = `${FOOTER_BTN_MOBILE} bg-amber-100 text-amber-900 disabled:opacity-100`;

const mutedClass = `${FOOTER_BTN_DESKTOP} bg-neutral-200 text-neutral-500`;
const mutedClassCompact = `${FOOTER_BTN_MOBILE} bg-neutral-200 text-neutral-500`;

const dangerClass = `${FOOTER_BTN_DESKTOP} bg-red-600 text-white active:bg-red-700`;
const dangerClassCompact = `${FOOTER_BTN_MOBILE} bg-red-600 text-white active:bg-red-700`;

const toneClass = (tone: ActivityDetailFooterButton['tone'], compact: boolean): string => {
  switch (tone) {
    case 'primary':
      return compact ? primaryClassCompact : primaryClass;
    case 'secondary':
      return compact ? secondaryClassCompact : secondaryClass;
    case 'status':
      return compact ? statusClassCompact : statusClass;
    case 'muted':
      return compact ? mutedClassCompact : mutedClass;
    case 'danger':
      return compact ? dangerClassCompact : dangerClass;
  }
};

const footerActionIcon = (action: ActivityDetailFooterAction): LucideIcon | null => {
  switch (action) {
    case 'open_crew_chat':
      return MessageCircle;
    case 'message_host':
      return MessageSquare;
    case 'participant_invite':
    case 'invite_crew':
      return UserPlus;
    case 'add_family':
    case 'edit_family':
      return Users;
    case 'participant_withdraw':
      return LogOut;
    case 'share_activity':
      return Share2;
    case 'host_manage':
      return Settings2;
    case 'request_join':
    case 'open_pending_manage':
    case 'open_participation_manage':
      return null;
    default: {
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
};

const FooterButtonLabel = ({
  button,
  showDesktopIcons,
  compactButtons = false,
}: {
  button: ActivityDetailFooterButton;
  showDesktopIcons: boolean;
  compactButtons?: boolean;
}) => {
  const showIcons = showDesktopIcons || compactButtons;
  const Icon = showIcons ? footerActionIcon(button.action) : null;
  const iconClass = compactButtons
    ? 'h-3.5 w-3.5 shrink-0 opacity-90'
    : 'hidden h-4 w-4 shrink-0 md:block';
  return (
    <span
      className={`inline-flex min-w-0 items-center justify-center ${
        compactButtons ? 'max-w-full gap-1' : 'gap-1.5'
      }`}
    >
      {Icon ? <Icon className={iconClass} aria-hidden /> : null}
      <span className="min-w-0 truncate">{button.label}</span>
    </span>
  );
};

type ActivityDetailStandardFooterProps = {
  mode: string;
  left: ActivityDetailFooterButton;
  right: ActivityDetailFooterButton;
  center?: ActivityDetailFooterButton;
  fourth?: ActivityDetailFooterButton;
  onPress: (action: ActivityDetailFooterButton['action']) => void;
  /** Icon before label on large screens (desktop aside column). */
  showDesktopIcons?: boolean;
  /** Sticky aside — stack buttons vertically (no horizontal scroll). */
  stackActions?: boolean;
  /** Join CTA rendered inside party card — hide duplicate primary slot. */
  hideLeft?: boolean;
  /** Mobile sticky footer — shorter buttons in one row. */
  compactButtons?: boolean;
};

/** One row — two to four buttons on activity detail sticky footer. */
export const ActivityDetailStandardFooter = ({
  mode,
  left,
  right,
  center,
  fourth,
  onPress,
  showDesktopIcons = false,
  stackActions = false,
  hideLeft = false,
  compactButtons = false,
}: ActivityDetailStandardFooterProps) => (
  <div
    className={`flex w-full min-w-0 gap-1.5 ${stackActions ? 'flex-col gap-2' : compactButtons ? 'flex-row' : 'overflow-x-auto gap-2'}`}
    data-activity-detail-standard-footer={mode}
  >
    {!hideLeft ? (
      <button
        type="button"
        disabled={left.disabled}
        onClick={() => onPress(left.action)}
        className={toneClass(left.tone, compactButtons)}
      >
        <FooterButtonLabel
          button={left}
          showDesktopIcons={showDesktopIcons}
          compactButtons={compactButtons}
        />
      </button>
    ) : null}
    {center ? (
      <button
        type="button"
        disabled={center.disabled}
        onClick={() => onPress(center.action)}
        className={toneClass(center.tone, compactButtons)}
      >
        <FooterButtonLabel
          button={center}
          showDesktopIcons={showDesktopIcons}
          compactButtons={compactButtons}
        />
      </button>
    ) : null}
    {fourth ? (
      <button
        type="button"
        disabled={fourth.disabled}
        onClick={() => onPress(fourth.action)}
        className={toneClass(fourth.tone, compactButtons)}
      >
        <FooterButtonLabel
          button={fourth}
          showDesktopIcons={showDesktopIcons}
          compactButtons={compactButtons}
        />
      </button>
    ) : null}
    <button
      type="button"
      disabled={right.disabled}
      onClick={() => onPress(right.action)}
      className={toneClass(right.tone, compactButtons)}
    >
      <FooterButtonLabel
        button={right}
        showDesktopIcons={showDesktopIcons}
        compactButtons={compactButtons}
      />
    </button>
  </div>
);
