import {
  computePlaceViewerAccess,
  resolveCatalogViewerLevel,
  type CatalogModerationStatus,
  type CatalogPublicationStatus,
  type PlaceViewerAccessDTO,
} from '@uaetrail/shared-types';
import type { Location } from '../domain/types.js';
import { UserRole } from '../domain/enums.js';

export type PlaceViewerAccessSource = Location & {
  moderationStatus?: CatalogModerationStatus;
  publicationStatus?: CatalogPublicationStatus;
  registeredByUserId?: string | null;
};

export const buildPlaceViewerAccess = (input: {
  viewerUserId: string | null;
  viewerRole?: string | null;
  place: PlaceViewerAccessSource;
}): PlaceViewerAccessDTO => {
  const isPlatformAdmin = input.viewerRole === UserRole.PLATFORM_ADMIN;
  const level = resolveCatalogViewerLevel({
    viewerUserId: input.viewerUserId,
    isPlatformAdmin,
    registeredByUserId: input.place.registeredByUserId ?? null,
    submittedById: input.place.submittedById ?? null,
    status: String(input.place.status),
    moderationStatus: input.place.moderationStatus,
    publicationStatus: input.place.publicationStatus,
  });

  return computePlaceViewerAccess({ level, viewerUserId: input.viewerUserId });
};
