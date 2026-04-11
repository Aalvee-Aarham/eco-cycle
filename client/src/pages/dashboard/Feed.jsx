import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { useFeed } from '@/hooks/useSocial';
import { CategoryBadge } from '@/components/CategoryBadge';
import { PointsChip } from '@/components/PointsChip';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/Card';
import { assetUrl } from '@/lib/utils';

const PAGE = 15;

export default function Feed() {
  const [skip, setSkip] = useState(0);
  const { data, isLoading, isFetching } = useFeed({ limit: PAGE, skip });

  const items = Array.isArray(data) ? data : [];
  const hasMore = items.length === PAGE;

  return (
    <PageWrapper>
      <h1 className="font-display text-2xl font-bold text-slate-900 mb-2">Activity feed</h1>
      <p className="text-slate-500 mb-8">Updates from people you follow.</p>

      {isLoading && !items.length ? (
        <div className="space-y-6 max-w-xl mx-auto">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="No activity yet"
          description="Follow other eco-warriors to see their recycling wins here."
          action={
            <Button asChild>
              <Link to="/leaderboard">Browse leaderboard</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-6 max-w-xl mx-auto">
          {items.map((s) => {
            const u = s.user;
            const uname = typeof u === 'object' && u?.username ? u.username : 'user';
            return (
              <Card key={s._id} className="overflow-hidden bg-white shadow-sm hover:shadow transition-shadow">
                {/* Header: User Info */}
                <div className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-eco-100 flex items-center justify-center text-eco-700 font-bold shrink-0">
                    {uname[0]?.toUpperCase()}
                  </div>
                  <div>
                    <Link to={`/u/${uname}`} className="font-medium text-slate-900 hover:text-eco-600">
                      @{uname}
                    </Link>
                    <p className="text-xs text-slate-500">
                      {s.createdAt ? formatDistanceToNow(new Date(s.createdAt), { addSuffix: true }) : ''}
                    </p>
                  </div>
                </div>

                {/* Body: Image */}
                {s.imageUrl && (
                  <div className="w-full aspect-video bg-slate-50 overflow-hidden max-h-[400px]">
                    <img 
                      src={assetUrl(s.imageUrl)} 
                      alt="Waste submission" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Footer: Details & Points */}
                <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {s.category && <CategoryBadge category={s.category} />}
                    {s.confidence != null && (
                      <span className="text-xs font-mono text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-200 shadow-sm">
                        {Math.round(s.confidence * 100)}% Match
                      </span>
                    )}
                  </div>
                  {s.points > 0 && <PointsChip points={s.points} />}
                </div>
              </Card>
            );
          })}
          {hasMore && (
            <Button
              variant="secondary"
              disabled={isFetching}
              onClick={() => setSkip((x) => x + PAGE)}
            >
              {isFetching ? 'Loading…' : 'Load more'}
            </Button>
          )}
        </div>
      )}
    </PageWrapper>
  );
}
