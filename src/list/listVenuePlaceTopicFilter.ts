import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { isGeographyMapSource } from '@uaetrail/shared-types';
import { mapItemMatchesShopsPill } from '../explore/exploreBrowseTaxonomy';
import type { ListVenuePlaceTopicKey } from './listVenuePlaceTopics';
import { LIST_VENUE_FACILITIES_TOPIC_SHIPPED } from './listVenuePlaceTopics';

/** Client filter for Places category topic pills. */
export const matchesListVenuePlaceTopic = (
  item: ExploreMapItemDTO,
  topic: ListVenuePlaceTopicKey
): boolean => {
  if (topic === 'shop') return mapItemMatchesShopsPill(item);
  if (!isGeographyMapSource(item.source)) return false;
  if (topic === 'facilities') return LIST_VENUE_FACILITIES_TOPIC_SHIPPED;
  if (topic === 'hiking') return item.kind === 'hiking';
  if (topic === 'camping') return item.kind === 'camping';
  if (topic === 'others') return item.kind !== 'hiking' && item.kind !== 'camping';
  return true;
};

export const isListVenuePlaceTopicKey = (key: string): key is ListVenuePlaceTopicKey =>
  key === 'hiking' ||
  key === 'camping' ||
  key === 'shop' ||
  key === 'others' ||
  (key === 'facilities' && LIST_VENUE_FACILITIES_TOPIC_SHIPPED);
