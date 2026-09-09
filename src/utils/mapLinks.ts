export const buildGoogleMapsSearchUrl = (lat: number, lng: number): string =>
  `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

export const buildGoogleDriveUrl = (lat: number, lng: number): string =>
  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;

export const buildWazeDriveUrl = (lat: number, lng: number): string =>
  `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
