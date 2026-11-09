import type { VerificationDocumentType } from '@uaetrail/shared-types';
import { api } from '../api/index';
import type { MemberVerificationDocumentDTO } from '../api/domains/member';

export type { MemberVerificationDocumentDTO };

export const fetchMyVerificationDocuments = async (): Promise<MemberVerificationDocumentDTO[]> => {
  const res = await api.listMyVerificationDocuments();
  return res.data ?? [];
};

export const submitMyVerificationDocument = async (input: {
  docType: VerificationDocumentType;
  fileKey?: string;
}): Promise<MemberVerificationDocumentDTO> => {
  const res = await api.submitVerificationDocument(input);
  return res.data;
};
