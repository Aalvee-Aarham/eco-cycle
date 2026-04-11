import { useQuery } from '@tanstack/react-query';
import { leaderboardApi } from '@/api/leaderboard.api';

export const useLeaderboard = (limit = 50) =>
  useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => leaderboardApi.get(limit),
    staleTime: 30_000,
  });
