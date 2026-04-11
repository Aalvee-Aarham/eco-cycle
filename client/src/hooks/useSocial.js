import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { socialApi } from '@/api/social.api';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth.store';

export const useFeed = (p) => {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ['feed', p],
    queryFn: () => socialApi.feed(p),
    enabled: !!token,
  });
};

export const useProfile = (u) =>
  useQuery({ queryKey: ['profile', u], queryFn: () => socialApi.profile(u), enabled: !!u });

export const useFollowers = () => {
  const token = useAuthStore((s) => s.token);
  return useQuery({ queryKey: ['followers'], queryFn: socialApi.followers, enabled: !!token });
};

export const useFollowing = () => {
  const token = useAuthStore((s) => s.token);
  return useQuery({ queryKey: ['following'], queryFn: socialApi.following, enabled: !!token });
};

export function useFollow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: socialApi.follow,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] });
      qc.invalidateQueries({ queryKey: ['followers'] });
      qc.invalidateQueries({ queryKey: ['following'] });
      qc.invalidateQueries({ queryKey: ['feed'] });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Could not follow'),
  });
}

export function useUnfollow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: socialApi.unfollow,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] });
      qc.invalidateQueries({ queryKey: ['followers'] });
      qc.invalidateQueries({ queryKey: ['following'] });
      qc.invalidateQueries({ queryKey: ['feed'] });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Could not unfollow'),
  });
}

export function usePrivacy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (isPrivate) => socialApi.privacy(isPrivate),
    onSuccess: () => {
      toast.success('Privacy updated');
      qc.invalidateQueries({ queryKey: ['me'] });
      qc.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to update privacy'),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => socialApi.updateProfile(data),
    onSuccess: () => {
      toast.success('Profile saved');
      qc.invalidateQueries({ queryKey: ['me'] });
      qc.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Update failed'),
  });
}
