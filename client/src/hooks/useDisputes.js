import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { disputesApi } from '@/api/disputes.api';
import { toast } from 'sonner';

export const useDisputeQueue = (params) =>
  useQuery({
    queryKey: ['disputes', 'queue', params],
    queryFn: () => disputesApi.queue(params),
  });

export const useDisputeStats = () =>
  useQuery({
    queryKey: ['disputes', 'stats'],
    queryFn: disputesApi.stats,
  });

export const useDisputeAudit = (id) =>
  useQuery({
    queryKey: ['disputes', 'audit', id],
    queryFn: () => disputesApi.audit(id),
    enabled: !!id,
  });

export function useResolveDispute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, category, outcome }) => disputesApi.resolve(id, { category, outcome }),
    onSuccess: () => {
      toast.success('Dispute resolved');
      qc.invalidateQueries({ queryKey: ['disputes'] });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Resolution failed'),
  });
}
