export const getInitials = (name?: string | null, email?: string | null): string => {
  if (name) {
    const parts = name.trim().split(/\s+/);
    return parts.length > 1
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0][0].toUpperCase();
  }
  return email?.[0]?.toUpperCase() ?? '?';
};

/** Two uppercase initials from a display name, e.g. "John Doe" → "JD". */
export const initialsFromName = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

export const getFirstName = (name?: string | null, email?: string | null): string => {
  if (name?.trim()) return name.trim().split(/\s+/)[0];
  if (email) return email.split('@')[0];
  return 'Account';
};
