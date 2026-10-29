/** Whether an admin console sidebar/drawer link matches the current route. */
export const isAdminConsoleNavActive = (pathname: string, linkTo: string): boolean =>
  pathname === linkTo || pathname.startsWith(`${linkTo}/`);
