/** Default “what joiners should bring or know” for the hiking hosting flow (editable). */
export const DEFAULT_HIKING_JOIN_KIT = `Mandatory:
💧 2 Liter water
💧 Sports or Hiking shoes

Recommended:
🧴 Sunscreen
🧢 Cap or Hat

Not allowed:
🩴 Slippers or sandals`;

export const ensureHikingJoinKitText = (text: string): string => {
  const trimmed = text.trim();
  return trimmed ? trimmed : DEFAULT_HIKING_JOIN_KIT;
};
