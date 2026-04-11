import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/api/admin.api';
import { toast } from 'sonner';

export const useAdminStats = () =>
  useQuery({ queryKey: ['admin', 'stats'], queryFn: adminApi.stats });

export const useAdminUsers = (p) =>
  useQuery({ queryKey: ['admin', 'users', p], queryFn: () => adminApi.users(p) });

export const useAdminAudit = (p) =>
  useQuery({ queryKey: ['admin', 'audit', p], queryFn: () => adminApi.audit(p) });

export const useAdminConfig = () =>
  useQuery({ queryKey: ['admin', 'config'], queryFn: adminApi.getConfig });

export function useChangeRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }) => adminApi.changeRole(id, role),
    onSuccess: () => {
      toast.success('Role updated');
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Role update failed'),
  });
}

export function useSetConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value }) => adminApi.setConfig(key, value),
    onSuccess: () => {
      toast.success('Config saved');
      qc.invalidateQueries({ queryKey: ['admin', 'config'] });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to save config'),
  });
}
