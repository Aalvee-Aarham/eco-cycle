import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { useDisputeQueue } from '@/hooks/useDisputes';
import { CategoryBadge } from '@/components/CategoryBadge';
import { Button } from '@/components/ui/Button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { Skeleton } from '@/components/ui/Skeleton';
import { assetUrl } from '@/lib/utils';
import { submissionId } from '@/lib/apiHelpers';
import { formatDistanceToNow } from 'date-fns';

const PAGE = 15;

export default function DisputeQueue() {
  const [skip, setSkip] = useState(0);
  const { data, isLoading, isFetching } = useDisputeQueue({ limit: PAGE, skip });

  const queue = data?.queue ?? [];
  const total = data?.total ?? queue.length;
  const hasMore = skip + queue.length < total;

  return (
    <PageWrapper>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Dispute queue</h1>
      <p className="text-slate-500 mb-4">Submissions in IN_DISPUTE, oldest first.</p>

      <div className="rounded-lg border bg-white overflow-x-auto">
        {isLoading ? (
          <div className="p-8 space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : queue.length === 0 ? (
          <p className="p-8 text-center text-slate-500">Queue is empty.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Submission</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Confidence</TableHead>
                <TableHead>Age</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {queue.map((s) => {
                const uid = submissionId(s);
                const u = s.user;
                const uname = typeof u === 'object' && u?.username ? u.username : '—';
                return (
                  <TableRow key={uid}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {s.imageUrl && (
                          <img src={assetUrl(s.imageUrl)} alt="" className="h-10 w-10 rounded object-cover border" />
                        )}
                        <span className="font-mono text-xs text-slate-500">{uid.slice(-8)}</span>
                      </div>
                    </TableCell>
                    <TableCell>{uname}</TableCell>
                    <TableCell>{s.category ? <CategoryBadge category={s.category} /> : '—'}</TableCell>
                    <TableCell className="text-right font-mono">
                      {s.confidence != null ? `${Math.round(s.confidence * 100)}%` : '—'}
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {s.createdAt ? formatDistanceToNow(new Date(s.createdAt), { addSuffix: true }) : '—'}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" asChild>
                        <Link to={`/mod/disputes/${uid}`}>Review</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {hasMore && (
        <Button className="mt-4" variant="secondary" disabled={isFetching} onClick={() => setSkip((x) => x + PAGE)}>
          {isFetching ? 'Loading…' : 'Load more'}
        </Button>
      )}
    </PageWrapper>
  );
}
