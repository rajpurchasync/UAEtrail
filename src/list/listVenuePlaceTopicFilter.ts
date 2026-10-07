import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import type { ListVenuePlaceTopicKey } from './listVenuePlaceTopics';
import { LIST_VENUE_FACILITIES_TOPIC_SHIPPED } from './listVenuePlaceTopics';

/** Client filter for Places category topic pills — aligns with explore venue kinds. */
export const matchesListVenuePlaceTopic = (
  item: ExploreMapItemDTO,
  topic: ListVenuePlaceTopicKey
): boolean => {
  if (item.source !== 'venue') return false;
  if (topic === 'facilities') return LIST_VENUE_FACILITIES_TOPIC_SHIPPED;
  if (topic === 'hiking') return item.kind === 'hiking';
  if (topic === 'camping') return item.kind === 'camping';
  if (topic === 'others') return item.kind !== 'hiking' && item.kind !== 'camping';
  return true;
};

export const isListVenuePlaceTopicKey = (key: string): key is ListVenuePlaceTopicKey =>
  key === 'hiking' ||
  key === 'camping' ||
  key === 'others' ||
  (key === 'facilities' && LIST_VENUE_FACILITIES_TOPIC_SHIPPED);
