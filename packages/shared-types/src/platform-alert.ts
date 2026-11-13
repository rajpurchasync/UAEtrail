/** Severity for outbound safety / ops banners on public detail surfaces. */
export type PlatformAlertSeverity = 'info' | 'warning' | 'critical';

/** Stored scope — how the alert is matched to a viewer context. */
export type PlatformAlertScope = 'global' | 'region' | 'point';

/**
 * Active platform alert row for public consumers (`GET /alerts/active`).
 * Plain text + optional outbound link — no rich HTML in the wire.
 */
export interface PublicActiveAlertDTO {
  id: string;
  severity: PlatformAlertSeverity;
  title: string;
  body: string;
  linkUrl?: string | null;
  linkLabel?: string | null;
  scope: PlatformAlertScope;
  /** When `scope` is `region`, matches emirate / coarse area label on the client. */
  region?: string | null;
}

export interface PublicActiveAlertsResponse {
  data: PublicActiveAlertDTO[];
}

/** Admin CRUD row for `platform_alerts`. */
export interface AdminPlatformAlertDTO extends PublicActiveAlertDTO {
  active: boolean;
  startsAt: string;
  endsAt: string;
  lat?: number | null;
  lng?: number | null;
  createdAt: string;
  updatedAt: string;
}
