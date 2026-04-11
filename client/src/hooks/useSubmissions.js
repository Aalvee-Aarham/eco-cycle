import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { submissionsApi } from '@/api/submissions.api';
import { toast } from 'sonner';

export function useClassify() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file, classifierOverride }) => submissionsApi.classify(file, classifierOverride),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['submissions'] }),
    onError: (err) => toast.error(err.response?.data?.error || 'Classification failed'),
  });
}

export const useSubmissions = (params) =>
  useQuery({
    queryKey: ['submissions', params],
    queryFn: () => submissionsApi.list(params),
  });

export const useSubmission = (id) =>
  useQuery({
    queryKey: ['submission', id],
    queryFn: () => submissionsApi.get(id),
    enabled: !!id,
  });

export function useRedeem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => submissionsApi.redeem(id),
    onSuccess: () => {
      toast.success('Points redeemed!');
      qc.invalidateQueries({ queryKey: ['submissions'] });
      qc.invalidateQueries({ queryKey: ['me'] });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Redemption failed'),
  });
}
