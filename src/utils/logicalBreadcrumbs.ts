export interface LogicalBreadcrumb {
  label: string;
  path: string;
}

interface BreadcrumbOptions {
  fallbackTo?: string;
  fallbackLabel?: string;
}

const prettifySegment = (segment: string) =>
  segment
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

const withHome = (items: LogicalBreadcrumb[]): LogicalBreadcrumb[] => [{ label: 'Home', path: '/' }, ...items];

const discoverSuffix = (search: string): LogicalBreadcrumb[] => {
  const params = new URLSearchParams(search);
  const region = params.get('region')?.trim();
  const activity = params.get('activity')?.trim();
  if (!region && !activity) return [];

  const parts: string[] = [];
  if (region) parts.push(region);
  if (activity) parts.push(prettifySegment(activity));

  return [{ label: parts.join(' · '), path: '' }];
};

const tripsTabLabel = (search: string): string | null => {
  const tab = new URLSearchParams(search).get('tab');
  if (!tab) return null;
  if (tab === 'mine') return 'My Trips';
  // "organized" may be rejected to explore for non-organizer roles, so keep it generic.
  return null;
};

const organizerCrumbs = (pathname: string): LogicalBreadcrumb[] => {
  const base = { label: 'Organizer', path: '/organizer/overview' };

  if (pathname === '/organizer/overview') return [base];
  if (pathname === '/organizer/profile') return [base, { label: 'Profile', path: '' }];
  if (pathname === '/organizer/events') return [base, { label: 'Events', path: '' }];
  if (pathname === '/organizer/events/new') {
    return [base, { label: 'Events', path: '/organizer/events' }, { label: 'Create', path: '' }];
  }
  if (pathname === '/organizer/requests') return [base, { label: 'Requests', path: '' }];
  if (pathname === '/organizer/messages') return [base, { label: 'Messages', path: '' }];
  if (pathname === '/organizer/team') return [base, { label: 'Team', path: '' }];
  if (pathname === '/organizer/security-privacy') return [base, { label: 'Security & Privacy', path: '' }];
  if (pathname === '/organizer/history') return [base, { label: 'History', path: '' }];
  if (pathname === '/organizer/locations') return [base, { label: 'Locations', path: '' }];

  return [base, { label: prettifySegment(pathname.replace('/organizer/', '')), path: '' }];
};

const adminCrumbs = (pathname: string): LogicalBreadcrumb[] => {
  const base = { label: 'Admin Console', path: '/admin/overview' };

  if (pathname === '/admin/overview') return [base];
  if (pathname === '/admin/users') return [base, { label: 'User Management', path: '' }];
  if (pathname === '/admin/events') return [base, { label: 'Events', path: '' }];
  if (pathname === '/admin/groups') return [base, { label: 'Groups', path: '' }];
  if (pathname === '/admin/locations') return [base, { label: 'Locations', path: '' }];
  if (pathname === '/admin/organizers') return [base, { label: 'Organizer Applications', path: '' }];
  if (pathname === '/admin/audit-log') return [base, { label: 'Audit Log', path: '' }];
  if (pathname === '/admin/settings') return [base, { label: 'Settings', path: '' }];
  if (pathname === '/admin/shop') return [base, { label: 'Shop Moderation', path: '' }];
  if (pathname === '/admin/notifications') return [base, { label: 'Notifications', path: '' }];

  return [base, { label: prettifySegment(pathname.replace('/admin/', '')), path: '' }];
};

const merchantCrumbs = (pathname: string): LogicalBreadcrumb[] | null => {
  if (!pathname.startsWith('/merchant')) return null;
  const base = { label: 'Merchant Dashboard', path: '/merchant/dashboard' };
  if (pathname === '/merchant/dashboard') return [base];
  if (pathname.startsWith('/merchant/')) {
    return [base, { label: prettifySegment(pathname.replace('/merchant/', '')), path: '' }];
  }
  return [base];
};

const accountCrumbs = (pathname: string): LogicalBreadcrumb[] | null => {
  if (pathname === '/profile') return [{ label: 'Profile', path: '' }];
  if (pathname === '/notifications') return [{ label: 'Profile', path: '/profile' }, { label: 'Notifications', path: '' }];
  if (pathname === '/favorites') return [{ label: 'Profile', path: '/profile' }, { label: 'Saved Items', path: '' }];
  if (pathname === '/my-requests') return [{ label: 'Profile', path: '/profile' }, { label: 'Requests', path: '' }];
  if (pathname.startsWith('/my-requests/')) {
    return [
      { label: 'Profile', path: '/profile' },
      { label: 'Requests', path: '/my-requests' },
      { label: 'Request', path: '' },
    ];
  }
  if (pathname === '/messages') return [{ label: 'Profile', path: '/profile' }, { label: 'Messages', path: '' }];
  if (pathname === '/groups') return [{ label: 'Profile', path: '/profile' }, { label: 'My Groups', path: '' }];
  if (pathname === '/my-rewards') return [{ label: 'Profile', path: '/profile' }, { label: 'Trail Points', path: '' }];
  if (pathname === '/security-privacy') {
    return [{ label: 'Profile', path: '/profile' }, { label: 'Security & Privacy', path: '' }];
  }

  return null;
};

const commerceCrumbs = (pathname: string): LogicalBreadcrumb[] | null => {
  if (pathname === '/shop') return [{ label: 'Shop', path: '' }];
  if (pathname.startsWith('/product/')) return [{ label: 'Shop', path: '/shop' }, { label: 'Product', path: '' }];
  if (pathname.startsWith('/merchant/')) return [{ label: 'Shop', path: '/shop' }, { label: 'Merchant', path: '' }];
  return null;
};

const discoveryCrumbs = (pathname: string, search: string): LogicalBreadcrumb[] | null => {
  if (pathname === '/discovery') return [{ label: 'Trails & Spots', path: '/discovery' }, ...discoverSuffix(search)];
  if (pathname.startsWith('/trail/')) return [{ label: 'Trails & Spots', path: '/discovery' }, { label: 'Trail Details', path: '' }];
  if (pathname.startsWith('/camp/')) return [{ label: 'Trails & Spots', path: '/discovery' }, { label: 'Camp Details', path: '' }];
  return null;
};

const tripCrumbs = (pathname: string, search: string): LogicalBreadcrumb[] | null => {
  if (pathname === '/trips') {
    const tabLabel = tripsTabLabel(search);
    if (!tabLabel) return [{ label: 'Trips', path: '' }];
    return [{ label: 'Trips', path: '/trips' }, { label: tabLabel, path: '' }];
  }
  if (pathname.startsWith('/trip/')) return [{ label: 'Trips', path: '/trips' }, { label: 'Trip Details', path: '' }];
  return null;
};

const communityCrumbs = (pathname: string): LogicalBreadcrumb[] | null => {
  if (pathname === '/community') return [{ label: 'Community', path: '' }];
  return null;
};

const supportCrumbs = (pathname: string): LogicalBreadcrumb[] | null => {
  if (pathname === '/faq') return [{ label: 'Help', path: '' }];
  if (pathname === '/terms') return [{ label: 'Terms & Conditions', path: '' }];
  if (pathname === '/privacy') return [{ label: 'Privacy Policy', path: '' }];
  if (pathname === '/trail-points') return [{ label: 'Trail Points', path: '' }];
  if (pathname === '/membership') return [{ label: 'Membership', path: '' }];
  if (pathname === '/become-host' || pathname === '/become-organizer') return [{ label: 'Become a Host', path: '' }];
  return null;
};

const publicDetailCrumbs = (pathname: string): LogicalBreadcrumb[] | null => {
  if (pathname.startsWith('/operator/')) return [{ label: 'Trips', path: '/trips' }, { label: 'Organizer Profile', path: '' }];
  return null;
};

const genericCrumbs = (pathname: string): LogicalBreadcrumb[] => {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return [{ label: 'Home', path: '' }];

  return segments.map((segment, index) => ({
    label: prettifySegment(segment),
    path: index === segments.length - 1 ? '' : `/${segments.slice(0, index + 1).join('/')}`,
  }));
};

export const buildLogicalBreadcrumbs = (
  pathname: string,
  search: string,
  options: BreadcrumbOptions = {}
): LogicalBreadcrumb[] => {
  if (pathname === '/') return [{ label: 'Home', path: '' }];

  if (pathname.startsWith('/organizer')) {
    return withHome(organizerCrumbs(pathname));
  }

  if (pathname.startsWith('/admin')) {
    return withHome(adminCrumbs(pathname));
  }

  const merchant = merchantCrumbs(pathname);
  if (merchant) return withHome(merchant);

  const account = accountCrumbs(pathname);
  if (account) return withHome(account);

  const discovery = discoveryCrumbs(pathname, search);
  if (discovery) return withHome(discovery);

  const trips = tripCrumbs(pathname, search);
  if (trips) return withHome(trips);

  const commerce = commerceCrumbs(pathname);
  if (commerce) return withHome(commerce);

  const community = communityCrumbs(pathname);
  if (community) return withHome(community);

  const support = supportCrumbs(pathname);
  if (support) return withHome(support);

  const publicDetails = publicDetailCrumbs(pathname);
  if (publicDetails) return withHome(publicDetails);

  const generic = genericCrumbs(pathname);
  if (generic.length > 1) {
    return withHome(generic);
  }

  return withHome([
    {
      label: options.fallbackLabel ?? prettifySegment(pathname.replace(/^\//, '')),
      path: options.fallbackTo ?? '',
    },
  ]);
};
