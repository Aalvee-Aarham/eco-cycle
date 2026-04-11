import { useMutation, useQuery } from '@tanstack/react-query';
import { authApi } from '@/api/auth.api';
import { useAuthStore } from '@/store/auth.store';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export function useLogin() {
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: ({ token, user }) => {
      setAuth(token, user);
      navigate(
        user.role === 'administrator' ? '/admin' : user.role === 'moderator' ? '/mod' : '/dashboard'
      );
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Login failed'),
  });
}

export function useRegister() {
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: authApi.register,
    onSuccess: ({ token, user }) => {
      setAuth(token, user);
      navigate('/dashboard');
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Registration failed'),
  });
}

export const useMe = () => {
  const { token } = useAuthStore();
  return useQuery({ queryKey: ['me'], queryFn: authApi.me, enabled: !!token });
};
