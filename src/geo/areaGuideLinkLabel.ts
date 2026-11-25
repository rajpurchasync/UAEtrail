/** Consumer label for `/area/:slug` drill-down from geo hubs (e.g. "JBR guide"). */
export const areaGuideLinkLabel = (destinationName: string): string => {
  const name = areaName.trim();
  if (!name) return 'Area guide';
  return `${name} guide`;
};
