import {
  isSocialTeamLabelType,
  type SocialTeamLabelType,
  SOCIAL_TEAM_LABEL_TYPES,
} from './social-group-limits.js';

/** Private team roster vs per-outing crew chat — not discoverable communities. */
export const MEMBER_GROUP_KINDS = ['team', 'outing_crew'] as const;
export type MemberGroupKind = (typeof MEMBER_GROUP_KINDS)[number];

const STORED_KIND_ALIASES: Record<string, MemberGroupKind> = {
  team: 'team',
  outing_crew: 'outing_crew',
  /** @deprecated Renamed — read only. */
  activity_crew: 'outing_crew',
};

/** Inbound mongo/API `type` — parse only; do not use for new logic. */
export const MEMBER_GROUP_INBOUND_TYPES = [
  'family',
  'friends',
  'colleagues',
  'outing_crew',
  /** @deprecated Inbound compat only — not the Activity entity. */
  'activity',
] as const;
export type MemberGroupInboundType = (typeof MEMBER_GROUP_INBOUND_TYPES)[number];

export const isMemberGroupKind = (value: string): value is MemberGroupKind =>
  (MEMBER_GROUP_KINDS as readonly string[]).includes(value);

export const normalizeMemberGroupKind = (kind: string | null | undefined): MemberGroupKind | null => {
  if (!kind) return null;
  return STORED_KIND_ALIASES[kind] ?? (isMemberGroupKind(kind) ? kind : null);
};

export const memberGroupKindFromInboundType = (type: string): MemberGroupKind =>
  type === 'activity' || type === 'outing_crew' ? 'outing_crew' : 'team';

export const memberGroupTeamLabelFromInboundType = (
  type: string
): SocialTeamLabelType | null => {
  if (type === 'activity' || type === 'outing_crew') return null;
  return isSocialTeamLabelType(type) ? type : 'friends';
};

export const memberGroupInboundTypeFromKind = (
  kind: MemberGroupKind,
  teamLabel: SocialTeamLabelType | null
): MemberGroupInboundType =>
  kind === 'outing_crew' ? 'outing_crew' : teamLabel ?? 'friends';

export const teamAllowsKidRoster = (input: {
  kind: MemberGroupKind;
  teamLabel: SocialTeamLabelType | null;
}): boolean => input.kind === 'team' && input.teamLabel === 'family';

/** Outing crew chat row — not a Team and not an Activity entity. */
export const isOutingCrewMemberGroup = (group: { kind: MemberGroupKind }): boolean =>
  group.kind === 'outing_crew';

/** Stored/API row before kind is guaranteed (FE + transitional Mongo). */
export const isOutingCrewGroupRow = (group: {
  kind?: MemberGroupKind | string | null;
  type?: string | null;
}): boolean => {
  const kind = normalizeMemberGroupKind(group.kind ?? null);
  if (kind === 'outing_crew') return true;
  const type = group.type ?? '';
  return type === 'activity' || type === 'outing_crew';
};

/** Resolve kind + label from a stored row (prefers explicit fields). */
export const resolveMemberGroupShape = (row: {
  kind?: MemberGroupKind | string | null;
  teamLabel?: SocialTeamLabelType | null;
  type: string;
}): { kind: MemberGroupKind; teamLabel: SocialTeamLabelType | null; inboundType: MemberGroupInboundType } => {
  const kind =
    normalizeMemberGroupKind(row.kind ?? null) ?? memberGroupKindFromInboundType(row.type);
  const teamLabel =
    kind === 'outing_crew'
      ? null
      : row.teamLabel ?? memberGroupTeamLabelFromInboundType(row.type);
  return {
    kind,
    teamLabel,
    inboundType: memberGroupInboundTypeFromKind(kind, teamLabel),
  };
};

export const MEMBER_GROUP_INBOUND_LABELS: Record<MemberGroupInboundType, string> = {
  family: 'Family',
  friends: 'Friends',
  colleagues: 'Colleagues',
  activity: 'Outing crew chat',
  outing_crew: 'Outing crew chat',
};

export const memberGroupInboundTypeLabel = (type: string): string =>
  (MEMBER_GROUP_INBOUND_TYPES as readonly string[]).includes(type)
    ? MEMBER_GROUP_INBOUND_LABELS[type as MemberGroupInboundType]
    : 'Team';

export const memberGroupRowLabel = (row: {
  kind?: MemberGroupKind | string | null;
  teamLabel?: SocialTeamLabelType | null;
  type: string;
}): string => {
  if (isOutingCrewGroupRow(row)) return MEMBER_GROUP_INBOUND_LABELS.outing_crew;
  return memberGroupInboundTypeLabel(resolveMemberGroupShape(row).inboundType);
};

/** Persisted team row — not an outing crew chat. */
export const isMemberGroupTeamRow = (row: {
  kind?: MemberGroupKind | string | null;
  type?: string | null;
}): boolean => !isOutingCrewGroupRow(row);

export { SOCIAL_TEAM_LABEL_TYPES, type SocialTeamLabelType };