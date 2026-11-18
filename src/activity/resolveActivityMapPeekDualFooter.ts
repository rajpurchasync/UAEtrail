import type { ActivityDetailFooterButton, ActivityDetailStandardFooterModel } from '../components/activity/detail/activityDetailFooterSlots';

const ICON_FOOTER_ACTIONS = new Set<ActivityDetailFooterButton['action']>([
  'message_host',
  'host_manage',
  'participant_invite',
  'invite_crew',
  'share_activity',
  'open_crew_chat',
]);

export type ActivityMapPeekDualFooterModel = {
  primary: ActivityDetailFooterButton;
  iconButton: ActivityDetailFooterButton | null;
  extraButtons: ActivityDetailFooterButton[];
};

const collectFooterButtons = (
  footer: ActivityDetailStandardFooterModel
): ActivityDetailFooterButton[] =>
  [footer.left, footer.center, footer.right].filter(
    (button): button is ActivityDetailFooterButton => Boolean(button)
  );

/**
 * Map compact peek — wide primary CTA + optional icon tile (message host, manage, share, invite).
 */
export const resolveActivityMapPeekDualFooter = (
  footer: ActivityDetailStandardFooterModel
): ActivityMapPeekDualFooterModel => {
  const slots = collectFooterButtons(footer);

  if (footer.mode === 'host') {
    const primary = footer.right;
    const iconButton =
      slots.find(
        (button) => button !== primary && button.action === 'share_activity' && !button.disabled
      ) ?? null;
    return {
      primary,
      iconButton,
      extraButtons: slots.filter((button) => button !== primary && button !== iconButton),
    };
  }

  const primary = footer.left;
  const iconButton =
    slots.find(
      (button) =>
        button !== primary &&
        !button.disabled &&
        ICON_FOOTER_ACTIONS.has(button.action) &&
        button.action !== primary.action
    ) ?? null;

  const extraButtons = slots.filter(
    (button) =>
      button !== primary &&
      button !== iconButton &&
      !button.disabled &&
      button.action !== 'open_pending_manage' &&
      button.action !== 'open_participation_manage'
  );

  return { primary, iconButton, extraButtons };
};