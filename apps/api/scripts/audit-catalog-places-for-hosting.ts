/**
 * Audit catalog places for public outing publish (registry picker + destination linkage).
 * Run: npm --workspace @uaetrail/api exec tsx scripts/audit-catalog-places-for-hosting.ts
 */
import { resolveCliScriptName, runCliScript } from './cli-script-runner.js';
import { buildPlaceRegistry } from '../src/services/place-registry.js';
import { listPublishedDestinations } from '../src/lib/destinations-store.js';
import { locationHasRegistryCoverImage } from '../src/lib/catalog-registry-cover.js';
import { listAdminPlacesPaged } from '../src/lib/admin-store.js';
import { LocationStatus } from '../src/domain/enums.js';
import { resolveEffectiveCatalogDestinationId } from '../src/lib/destination-resolution.js';
import type { DestinationDTO } from '@uaetrail/shared-types';

type HostingReadiness = {
  id: string;
  name: string;
  activityType: string;
  status: string;
  inRegistryPicker: boolean;
  hasCover: boolean;
  hasCoords: boolean;
  destinationId: string | null;
  inferredDestinationId: string | null;
  readyForPublicOuting: boolean;
  blockers: string[];
  warnings: string[];
};

const HOSTING_TYPES = ['hiking', 'camping', 'event'] as const;

const auditPlace = (
  place: {
    id: string;
    name: string;
    activityType: string;
    status: string;
    images?: string[];
    latitude?: number | null;
    longitude?: number | null;
    destinationId?: string | null;
  },
  registryIds: Set<string>,
  destinations: DestinationDTO[]
): HostingReadiness => {
  const blockers: string[] = [];
  const warnings: string[] = [];
  const hasCover = locationHasRegistryCoverImage(place);
  const hasCoords = place.latitude != null && place.longitude != null;
  const destinationId = place.destinationId?.trim() || null;
  const publishDestinationId =
    hasCoords && place.latitude != null && place.longitude != null
      ? resolveEffectiveCatalogDestinationId(
          {
            id: place.id,
            destinationId: place.destinationId,
            latitude: place.latitude,
            longitude: place.longitude,
          },
          destinations
        )
      : null;
  const inRegistryPicker = registryIds.has(place.id);

  if (!inRegistryPicker) {
    if (!hasCover) blockers.push('no_cover_image');
    if (place.status !== LocationStatus.ACTIVE && place.status !== 'active') {
      blockers.push(`status_${place.status}`);
    }
  }
  if (!publishDestinationId) blockers.push('no_destination_link');
  if (!destinationId && publishDestinationId) warnings.push('destinationId_not_persisted_in_db');
  if (!hasCoords) blockers.push('no_coordinates');

  const readyForPublicOuting = inRegistryPicker && hasCoords && Boolean(publishDestinationId);

  return {
    id: place.id,
    name: place.name,
    activityType: String(place.activityType),
    status: String(place.status),
    inRegistryPicker,
    hasCover,
    hasCoords,
    destinationId,
    inferredDestinationId: publishDestinationId,
    readyForPublicOuting,
    blockers,
    warnings,
  };
};

const main = async () => {
  const destinations = await listPublishedDestinations();

  const registryByType = new Map<string, Set<string>>();
  for (const type of HOSTING_TYPES) {
    const rows = await buildPlaceRegistry({ activityType: type });
    registryByType.set(type, new Set(rows.map((row) => row.id)));
  }

  const allRegistryIds = new Set<string>();
  for (const ids of registryByType.values()) {
    for (const id of ids) allRegistryIds.add(id);
  }

  const { items: allPlaces, total: locationCount } = await listAdminPlacesPaged({
    skip: 0,
    take: 5000,
  });

  const hostingCandidates = allPlaces.filter((place) => {
    if (place.status !== LocationStatus.ACTIVE && String(place.status).toLowerCase() !== 'active') {
      return false;
    }
    const kind = String(place.activityType).toLowerCase();
    return kind === 'hiking' || kind === 'camping' || kind === 'event' || kind === 'community_activity';
  });

  const rows = hostingCandidates.map((place) =>
    auditPlace(
      {
        id: place.id,
        name: place.name,
        activityType: String(place.activityType),
        status: String(place.status),
        images: place.images,
        latitude: place.latitude,
        longitude: place.longitude,
        destinationId: place.destinationId,
      },
      allRegistryIds,
      destinations
    )
  );

  const ready = rows.filter((row) => row.readyForPublicOuting);
  const notReady = rows.filter((row) => !row.readyForPublicOuting);

  console.log('\n=== Catalog places — public outing readiness ===\n');
  console.log(`Published destinations in DB: ${destinations.length}`);
  console.log(`All location documents: ${locationCount}`);
  console.log(`Active hiking/camp/event rows: ${hostingCandidates.length}`);
  console.log(`In organize picker (merged): ${allRegistryIds.size}`);
  console.log(`Ready for public map outing: ${ready.length}`);
  console.log(`Blocked: ${notReady.length}\n`);

  const needsBackfill = rows.filter((row) => row.warnings.includes('destinationId_not_persisted_in_db'));
  if (needsBackfill.length > 0) {
    console.log('--- Data hygiene (publish works; persist destinationId on location) ---');
    for (const row of needsBackfill.sort((a, b) => a.name.localeCompare(b.name))) {
      console.log(`  ! ${row.id} · ${row.name} · resolved ${row.inferredDestinationId}`);
    }
    console.log('');
  }

  if (ready.length > 0) {
    console.log('--- Ready (picker + coords + destination) ---');
    for (const row of ready.sort((a, b) => a.name.localeCompare(b.name))) {
      const dest = row.inferredDestinationId;
      console.log(`  ✓ ${row.id} · ${row.name} (${row.activityType}) · destination ${dest}`);
    }
    console.log('');
  }

  if (notReady.length > 0) {
    console.log('--- Not ready ---');
    for (const row of notReady.sort((a, b) => a.name.localeCompare(b.name))) {
      console.log(
        `  ✗ ${row.id} · ${row.name} (${row.activityType}) · ${row.blockers.join(', ')}` +
          (row.inRegistryPicker ? '' : ' · hidden_from_picker')
      );
    }
    console.log('');
  }

  const missingDestinationOnly = notReady.filter(
    (row) => row.blockers.includes('no_destination_link') && row.inRegistryPicker && row.hasCoords
  );
  if (missingDestinationOnly.length > 0) {
    console.log('--- Fix: run migrations / seed backfill (sets destinationId on locations) ---');
    console.log('  npm run seed   # includes catalog destination backfill where applicable');
    console.log(`  Places needing destinationId backfill: ${missingDestinationOnly.length}`);
    for (const row of missingDestinationOnly) {
      console.log(`    - ${row.id} (${row.name})`);
    }
  }

  const otherActive = allPlaces.filter((place) => {
    const active =
      place.status === LocationStatus.ACTIVE || String(place.status).toLowerCase() === 'active';
    if (!active) return false;
    const kind = String(place.activityType).toLowerCase();
    return kind !== 'hiking' && kind !== 'camping' && kind !== 'event' && kind !== 'community_activity';
  });
  if (otherActive.length > 0) {
    console.log('\n--- Other active catalog rows (not outing venue types) ---');
    for (const place of otherActive.sort((a, b) => a.name.localeCompare(b.name))) {
      const cover = locationHasRegistryCoverImage(place) ? 'cover' : 'no_cover';
      const dest = place.destinationId?.trim() || 'no_destination';
      console.log(`  · ${place.id} · ${place.name} (${place.activityType}) · ${cover} · ${dest}`);
    }
  }
};

runCliScript(resolveCliScriptName(import.meta.url), main);