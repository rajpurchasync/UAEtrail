export const getInitials = (name?: string | null, email?: string | null): string => {
  if (name) {
    const parts = name.trim().split(/\s+/);
    return parts.length > 1
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0][0].toUpperCase();
  }
  return email?.[0]?.toUpperCase() ?? '?';
};

export const getFirstName = (name?: string | null, email?: string | null): string => {
  if (name?.trim()) return name.trim().split(/\s+/)[0];
  if (email) return email.split('@')[0];
  return 'Account';
};
