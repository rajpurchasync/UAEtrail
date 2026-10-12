import type {
  CreateMemberMapPinInput,
  MemberJourneyMapDTO,
  MemberMapPinDTO,
  UpdateMemberMapPinInput,
} from '@uaetrail/shared-types';
import { api } from '../api/index';

export const fetchMemberJourneyMap = async (): Promise<MemberJourneyMapDTO> => {
  const res = await api.getJourneyMap();
  return res.data;
};

export const createMemberMapPin = async (
  body: CreateMemberMapPinInput
): Promise<MemberMapPinDTO> => {
  const res = await api.createPin(body);
  return res.data;
};

export const updateMemberMapPin = async (
  pinId: string,
  body: UpdateMemberMapPinInput
): Promise<MemberMapPinDTO> => {
  const res = await api.updatePin(pinId, body);
  return res.data;
};

export const deleteMemberMapPin = async (pinId: string): Promise<void> => {
  await api.deletePin(pinId);
};
