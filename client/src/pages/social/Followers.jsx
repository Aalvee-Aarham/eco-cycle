import { PageWrapper } from '@/components/layout/PageWrapper';
import { useFollowers } from '@/hooks/useSocial';
import { UserCard } from '@/components/UserCard';
import { EmptyState } from '@/components/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';

export default function Followers() {
  const { data, isLoading } = useFollowers();
  const rows = Array.isArray(data) ? data : [];

  return (
    <PageWrapper>
      <h1 className="font-display text-2xl font-bold text-slate-900 mb-2">Followers</h1>
      <p className="text-slate-500 mb-8">People who follow you.</p>

      {isLoading ? (
        <div className="space-y-2 max-w-md">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon="👀"
          title="No followers yet"
          description="Share your profile and climb the leaderboard to get noticed."
        />
      ) : (
        <div className="max-w-md rounded-lg border bg-white divide-y divide-slate-100">
          {rows.map((row) =>
            row.follower ? <UserCard key={row._id} user={row.follower} /> : null
          )}
        </div>
      )}
    </PageWrapper>
  );
}
