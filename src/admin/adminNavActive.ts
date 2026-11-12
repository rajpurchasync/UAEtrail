import { ADMIN_INBOX_PATH } from '../config/adminSurfacePaths';

/** Whether an admin console sidebar/drawer link matches the current route. */
export const isAdminConsoleNavActive = (
  pathname: string,
  linkTo: string,
  options?: { exact?: boolean }
): boolean => {
  if (pathname === linkTo) return true;
  if (options?.exact) return false;
  // Inbox hub must not stay active on `/admin/inbox/submissions`.
  if (linkTo === ADMIN_INBOX_PATH) return false;
  return pathname.startsWith(`${linkTo}/`);
};
