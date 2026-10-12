import type { CreateMemberMapPinInput } from '@uaetrail/shared-types';
import { api } from '../api/index';

export const createMemberMapPin = async (body: CreateMemberMapPinInput): Promise<void> => {
  await api.createPin(body);
};
