import { useQuery } from '@tanstack/react-query';
import { fetchMyVerificationDocuments } from './memberVerificationClientApi';
import { myVerificationDocumentsQueryKey } from './clientQueryKeys';

export const useMyVerificationDocuments = () =>
  useQuery({
    queryKey: myVerificationDocumentsQueryKey,
    queryFn: fetchMyVerificationDocuments,
  });