import { EventDTO, JoinRequestDTO, LocationDTO, NotificationDTO } from '@uaetrail/shared-types';
import { apiRequest } from './client';

export interface OrganizerApplication {
  id: string;
  applicantEmail: string;
  applicantName: string;
  requestedName: string;
  requestedType: string;
  status: string;
  createdAt: string;
}

export interface AdminMetrics {
  tenants: number;
  events: number;
  pendingApplications: number;
  pendingRequests: number;
}

export interface TeamMember {
  id: string;
  userId: string;
  email: string;
  displayName: string;
  role: string;
}

export interface EventRequestView {
  id: string;
  status: string;
  note?: string;
  organizerNote?: string;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    displayName: string;
  };
  event: {
    id: string;
    title: string;
    locationName: string;
    date?: string;
    time?: string;
    startAt?: string;
  };
}

export interface UserProfile {
  id?: string;
  email?: string;
  role?: string;
  displayName?: string;
  phone?: string;
  bio?: string;
  avatarUrl?: string;
}

export interface EventDetail extends EventDTO {
  description: string;
  participants: Array<{ id: string; name: string; avatar?: string }>;
  location: LocationDTO;
}

export interface TenantMembershipView {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  tenantType: string;
  membershipRole: string;
}

export const api = {
  getPublicLocations: () => apiRequest<{ data: LocationDTO[] }>('/locations'),
  getPublicEvents: () => apiRequest<{ data: EventDTO[] }>('/events'),
  getPublicEventDetail: (id: string) => apiRequest<{ data: EventDetail }>(`/events/${id}`),
  createJoinRequest: (eventId: string, note?: string) =>
    apiRequest<{ data: JoinRequestDTO }>(`/events/${eventId}/requests`, {
      method: 'POST',
      auth: true,
      body: JSON.stringify({ note })
    }),
  cancelJoinRequest: (eventId: string, requestId: string) =>
    apiRequest(`/events/${eventId}/requests/${requestId}/cancel`, {
      method: 'PATCH',
      auth: true
    }),
  getMeRequests: () => apiRequest<{ data: EventRequestView[] }>('/me/requests', { auth: true }),
  getMeTrips: () => apiRequest<{ data: EventDTO[] }>('/me/trips', { auth: true }),
  getMeProfile: () => apiRequest<{ data: UserProfile }>('/me/profile', { auth: true }),
  updateMeProfile: (payload: UserProfile) =>
    apiRequest<{ data: UserProfile }>('/me/profile', {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify(payload)
    }),
  getMeNotifications: () => apiRequest<{ data: NotificationDTO[] }>('/me/notifications', { auth: true }),
  getMyTenants: () => apiRequest<{ data: TenantMembershipView[] }>('/me/tenants', { auth: true }),
  getAdminMetrics: () => apiRequest<{ data: AdminMetrics }>('/admin/metrics', { auth: true }),
  getAdminLocations: () => apiRequest<{ data: LocationDTO[] }>('/admin/locations', { auth: true }),
  createAdminLocation: (payload: Partial<LocationDTO>) =>
    apiRequest<{ data: LocationDTO }>('/admin/locations', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload)
    }),
  updateAdminLocation: (id: string, payload: Partial<LocationDTO>) =>
    apiRequest<{ data: LocationDTO }>(`/admin/locations/${id}`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify(payload)
    }),
  getAdminApplications: () =>
    apiRequest<{ data: OrganizerApplication[] }>('/admin/organizer-applications', { auth: true }),
  reviewAdminApplication: (id: string, status: 'approved' | 'rejected', reviewerNote?: string) =>
    apiRequest(`/admin/organizer-applications/${id}`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify({ status, reviewerNote })
    }),
  getAdminEvents: () => apiRequest<{ data: EventDTO[] }>('/admin/events/moderation', { auth: true }),
  moderateEvent: (id: string, action: 'suspend' | 'unsuspend') =>
    apiRequest(`/admin/events/moderation/${id}`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify({ action })
    }),
  getOrganizerEvents: (tenantId: string) =>
    apiRequest<{ data: EventDTO[] }>('/organizer/events', {
      auth: true,
      headers: { 'x-tenant-id': tenantId }
    }),
  createOrganizerEvent: (tenantId: string, payload: Record<string, unknown>) =>
    apiRequest<{ data: EventDTO }>('/organizer/events', {
      method: 'POST',
      auth: true,
      headers: { 'x-tenant-id': tenantId },
      body: JSON.stringify(payload)
    }),
  publishOrganizerEvent: (tenantId: string, eventId: string) =>
    apiRequest(`/organizer/events/${eventId}/publish`, {
      method: 'POST',
      auth: true,
      headers: { 'x-tenant-id': tenantId }
    }),
  getOrganizerRequests: (tenantId: string) =>
    apiRequest<{ data: EventRequestView[] }>('/organizer/requests', {
      auth: true,
      headers: { 'x-tenant-id': tenantId }
    }),
  decideOrganizerRequest: (tenantId: string, requestId: string, status: 'approved' | 'rejected', organizerNote?: string) =>
    apiRequest(`/organizer/requests/${requestId}`, {
      method: 'PATCH',
      auth: true,
      headers: { 'x-tenant-id': tenantId },
      body: JSON.stringify({ status, organizerNote })
    }),
  getOrganizerTeam: (tenantId: string) =>
    apiRequest<{ data: TeamMember[] }>('/organizer/team', {
      auth: true,
      headers: { 'x-tenant-id': tenantId }
    }),
  createOrganizerTeamMember: (tenantId: string, payload: { email: string; displayName?: string; role: 'tenant_admin' | 'tenant_guide' }) =>
    apiRequest<{ data: TeamMember }>('/organizer/team', {
      method: 'POST',
      auth: true,
      headers: { 'x-tenant-id': tenantId },
      body: JSON.stringify(payload)
    })
};
