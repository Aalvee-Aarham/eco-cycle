import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { useDisputeQueue } from '@/hooks/useDisputes';
import { CategoryBadge } from '@/components/CategoryBadge';
import { StateBadge } from '@/components/StateBadge';
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

const TIER_BADGE = {
  high:   'bg-emerald-100 text-emerald-700',
  medium: 'bg-amber-100 text-amber-700',
  low:    'bg-red-100 text-red-700',
};

const TIER_ICONS = { high: '⚡', medium: '⚠️', low: '🔴' };

const STATE_TABS = [
  { label: 'All', value: '' },
  { label: '⚠️ In Dispute', value: 'IN_DISPUTE' },
  { label: '🚩 Flagged', value: 'FLAGGED' },
  { label: '🤖 Auto-Resolved', value: 'RESOLVED_AUTO' },
];

export default function DisputeQueue() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const initialState = params.get('state') || '';

  const [skip, setSkip] = useState(0);
  const [activeState, setActiveState] = useState(initialState);

  // Reset page when tab changes
  useEffect(() => { setSkip(0); }, [activeState]);

  const { data, isLoading, isFetching } = useDisputeQueue({
    limit: PAGE,
    skip,
    state: activeState || undefined,
  });

  const queue = data?.queue ?? [];
  const total = data?.total ?? queue.length;
  const hasMore = skip + queue.length < total;

  return (
    <PageWrapper>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Dispute Queue</h1>
      <p className="text-slate-500 mb-4">Review submissions flagged by the confidence-tier system.</p>

      {/* State filter tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {STATE_TABS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setActiveState(value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              activeState === value
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
            }`}
          >
            {label}
          </button>
        ))}
        <span className="ml-auto text-sm text-slate-400 self-center">
          {total} total
        </span>
      </div>

      <div className="rounded-lg border bg-white overflow-x-auto">
        {isLoading ? (
          <div className="p-8 space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : queue.length === 0 ? (
          <p className="p-8 text-center text-slate-500">Queue is empty for this filter.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Submission</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Classifier</TableHead>
                <TableHead className="text-right">Confidence</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Age</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {queue.map((s) => {
                const uid = submissionId(s);
                const u = s.user;
                const uname = typeof u === 'object' && u?.username ? u.username : '—';
                const tier = s.confidenceTier;
                const isResolved = ['RESOLVED_AUTO', 'RESOLVED_MANUAL'].includes(s.state);
                return (
                  <TableRow key={uid} className={isResolved ? 'opacity-60' : ''}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {(s.detectedImageUrl || s.imageUrl) && (
                          <img
                            src={assetUrl(s.detectedImageUrl || s.imageUrl)}
                            alt=""
                            className="h-10 w-10 rounded object-cover border"
                          />
                        )}
                        <span className="font-mono text-xs text-slate-500">{uid.slice(-8)}</span>
                      </div>
                    </TableCell>
                    <TableCell>{uname}</TableCell>
                    <TableCell>{s.category ? <CategoryBadge category={s.category} /> : '—'}</TableCell>
                    <TableCell>
                      {tier ? (
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${TIER_BADGE[tier]}`}>
                          {TIER_ICONS[tier]} {tier}
                        </span>
                      ) : '—'}
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${
                        s.classifier === 'yolo' ? 'bg-emerald-50 text-emerald-700' : 'bg-indigo-50 text-indigo-700'
                      }`}>
                        {s.classifier ?? '—'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {s.confidence != null ? `${Math.round(s.confidence * 100)}%` : '—'}
                    </TableCell>
                    <TableCell><StateBadge state={s.state} /></TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {s.createdAt ? formatDistanceToNow(new Date(s.createdAt), { addSuffix: true }) : '—'}
                    </TableCell>
                    <TableCell>
                      {!isResolved ? (
                        <Button size="sm" asChild>
                          <Link to={`/mod/disputes/${uid}`}>Review</Link>
                        </Button>
                      ) : (
                        <Button size="sm" variant="ghost" asChild>
                          <Link to={`/mod/disputes/${uid}`}>View</Link>
                        </Button>
                      )}
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
