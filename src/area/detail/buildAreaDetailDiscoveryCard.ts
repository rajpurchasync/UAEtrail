import type { AreaPublicDTO, ExploreMapItemDTO } from '@uaetrail/shared-types';
import { areaDetailPath } from '@uaetrail/shared-types';
import { buildDiscoveryCardViewModelCard } from '../../discovery';
import type { DiscoveryCardModel } from '../../discovery/discoveryCardModel';

/** Discovery card for area hub — wishlist / trip alerts parity with place detail. */
export const buildAreaDetailDiscoveryCard = (input: {
  area: AreaPublicDTO;
  shareText?: string | null;
}): DiscoveryCardModel => {
  const { area } = input;
  const path = areaDetailPath(area.slug);
  const item = {
    id: `area:${area.slug}`,
    kind: 'area',
    source: 'area',
    title: area.name,
    subtitle: area.region,
    latitude: area.center.latitude,
    longitude: area.center.longitude,
    path,
    image: area.imageUrl ?? null,
    areaId: area.id,
    areaSlug: area.slug,
    areaName: area.name,
  } as ExploreMapItemDTO;
  const card = buildDiscoveryCardViewModelCard(item);
  return {
    ...card,
    shareTitle: area.name,
    shareText: input.shareText ?? area.summary ?? null,
    sharePath: path,
  };
};
