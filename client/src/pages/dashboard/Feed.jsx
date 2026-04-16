import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { useFeed } from '@/hooks/useSocial';
import { CategoryBadge } from '@/components/CategoryBadge';
import { PointsChip } from '@/components/PointsChip';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/Card';
import { assetUrl } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { submissionsApi } from '@/api/submissions.api';

const PAGE = 15;

export default function Feed() {
  const [skip, setSkip] = useState(0);
  const { data, isLoading, isFetching } = useFeed({ limit: PAGE, skip });
  const { user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();

  const isAdmin = currentUser?.role === 'administrator';

  const items = Array.isArray(data) ? data : [];
  const hasMore = items.length === PAGE;

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this submission?')) return;
    try {
      await submissionsApi.delete(id);
      toast.success('Submission deleted');
      queryClient.invalidateQueries(['feed']);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete submission');
    }
  };

  return (
    <PageWrapper>
      <h1 className="font-display text-2xl font-bold text-slate-900 mb-2">Activity feed</h1>
      <p className="text-slate-500 mb-8">Updates from people you follow.</p>

      {isLoading && !items.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-[400px] w-full rounded-xl" />
          <Skeleton className="h-[400px] w-full rounded-xl hidden md:block" />
          <Skeleton className="h-[400px] w-full rounded-xl hidden lg:block" />
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((s) => {
            const u = s.user;
            const uname = typeof u === 'object' && u?.username ? u.username : 'user';
            
            // Format natural language category string
            let itemDesc = 'an item';
            if (s.subcategory) {
              itemDesc = s.subcategory.replace('_', ' ');
            } else if (s.category) {
              itemDesc = s.category === 'e-waste' ? 'e-waste' : `a ${s.category} item`;
            }

            return (
              <Card key={s._id} className="overflow-hidden bg-white border-slate-200 hover:border-slate-300 transition-colors shadow-sm hover:shadow-md flex flex-col">
                {/* Header: User Action & Info */}
                <div className="p-4 flex flex-row items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-eco-500 to-emerald-400 flex items-center justify-center text-white font-bold shrink-0 shadow-inner">
                    {uname[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">
                      <Link to={`/u/${uname}`} className="font-bold text-slate-900 hover:text-eco-600">
                        {uname}
                      </Link>
                      <span className="text-slate-500 mx-1">recycled</span>
                      <span className="font-medium text-slate-800">{itemDesc}</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5 font-medium">
                      {s.createdAt ? formatDistanceToNow(new Date(s.createdAt), { addSuffix: true }) : ''}
                    </p>
                  </div>
                  {s.points > 0 && (
                    <div className="shrink-0">
                      <PointsChip points={s.points} />
                    </div>
                  )}
                  {isAdmin && (
                    <button 
                      onClick={() => handleDelete(s._id)} 
                      className="text-red-400 hover:text-red-600 transition-colors ml-1 p-1.5 rounded-full hover:bg-red-50 focus:outline-none"
                      title="Permanently remove from database"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                {/* Body: Image with hover effect */}
                {s.detectedImageUrl || s.imageUrl ? (
                  <div className="w-full aspect-square sm:aspect-[4/3] bg-slate-100 relative group overflow-hidden border-y border-slate-100">
                    <img 
                      src={assetUrl(s.detectedImageUrl || s.imageUrl)} 
                      alt="Waste submission" 
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    {s.detectedImageUrl && (
                      <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[8px] font-bold px-1 py-0.5 rounded shadow-sm uppercase tracking-tighter">
                        AI Detected
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full aspect-square sm:aspect-[4/3] bg-slate-50 border-y border-slate-100 flex items-center justify-center text-slate-400 text-sm italic">
                    No image available
                  </div>
                )}

                {/* Footer: AI Details & Badges */}
                <div className="p-4 bg-white flex flex-wrap items-center justify-between gap-3 mt-auto">
                  <div className="flex flex-wrap items-center gap-2">
                    {s.category && <CategoryBadge category={s.category} />}
                    {s.confidence != null && (
                      <span className="text-xs font-mono text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                        {Math.round(s.confidence * 100)}% match
                      </span>
                    )}
                  </div>
                  {s.classifier && (
                     <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                       {s.classifier}
                     </span>
                  )}
                </div>
              </Card>
            );
          })}
          {hasMore && (
            <div className="col-span-full pt-4 flex justify-center">
              <Button
                variant="secondary"
                disabled={isFetching}
                onClick={() => setSkip((x) => x + PAGE)}
              >
                {isFetching ? 'Loading…' : 'Load more'}
              </Button>
            </div>
          )}
        </div>
      )}
    </PageWrapper>
  );
}
