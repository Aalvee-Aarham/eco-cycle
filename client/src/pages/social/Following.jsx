import { PageWrapper } from '@/components/layout/PageWrapper';
import { useFollowing } from '@/hooks/useSocial';
import { UserCard } from '@/components/UserCard';
import { EmptyState } from '@/components/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { Link } from 'react-router-dom';

export default function Following() {
  const { data, isLoading } = useFollowing();
  const rows = Array.isArray(data) ? data : [];

  return (
    <PageWrapper>
      <h1 className="font-display text-2xl font-bold text-slate-900 mb-2">Following</h1>
      <p className="text-slate-500 mb-8">Accounts you follow.</p>

      {isLoading ? (
        <div className="space-y-2 max-w-md">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon="🌿"
          title="Not following anyone"
          description="Discover people on the leaderboard and follow their recycling journey."
          action={
            <Button asChild>
              <Link to="/leaderboard">Open leaderboard</Link>
            </Button>
          }
        />
      ) : (
        <div className="max-w-md rounded-lg border bg-white divide-y divide-slate-100">
          {rows.map((row) =>
            row.followee ? <UserCard key={row._id} user={row.followee} /> : null
          )}
        </div>
      )}
    </PageWrapper>
  );
}
