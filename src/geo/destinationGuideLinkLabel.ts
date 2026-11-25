/** Consumer label for `/destination/:slug` drill-down from geo hubs (e.g. "JBR guide"). */
export const destinationGuideLinkLabel = (destinationName: string): string => {
  const name = destinationName.trim();
  if (!name) return 'Destination guide';
  return `${name} guide`;
};