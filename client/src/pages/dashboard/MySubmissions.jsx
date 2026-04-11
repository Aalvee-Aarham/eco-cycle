import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { useSubmissions } from '@/hooks/useSubmissions';
import { CategoryBadge } from '@/components/CategoryBadge';
import { StateBadge } from '@/components/StateBadge';
import { PointsChip } from '@/components/PointsChip';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { CATEGORIES, STATE_META } from '@/lib/constants';
import { assetUrl, formatDate } from '@/lib/utils';
import { submissionId } from '@/lib/apiHelpers';

const PAGE = 12;
const FETCH_LIMIT = 200;
const ALL_STATES = ['', ...Object.keys(STATE_META)];

export default function MySubmissions() {
  const [show, setShow] = useState(PAGE);
  const [stateFilter, setStateFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const { data: raw, isLoading, isFetching } = useSubmissions({ limit: FETCH_LIMIT, skip: 0 });

  useEffect(() => {
    setShow(PAGE);
  }, [stateFilter, categoryFilter]);

  const filtered = useMemo(() => {
    const arr = Array.isArray(raw) ? raw : [];
    let out = arr;
    if (stateFilter) out = out.filter((s) => s.state === stateFilter);
    if (categoryFilter) out = out.filter((s) => s.category === categoryFilter);
    return out;
  }, [raw, stateFilter, categoryFilter]);

  const visible = useMemo(() => filtered.slice(0, show), [filtered, show]);

  return (
    <PageWrapper>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">My submissions</h1>

      <div className="flex flex-wrap gap-3 mb-6">
        <select
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
        >
          <option value="">All states</option>
          {ALL_STATES.filter(Boolean).map((s) => (
            <option key={s} value={s}>
              {STATE_META[s]?.label ?? s}
            </option>
          ))}
        </select>
        <select
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          title="No submissions yet"
          description="Upload an image on the Classify page to get started."
          action={
            <Button asChild>
              <Link to="/classify">Classify waste</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {visible.map((s) => (
            <Card key={submissionId(s)}>
              <CardContent className="p-4 flex flex-col sm:flex-row gap-4">
                {s.imageUrl && (
                  <img
                    src={assetUrl(s.imageUrl)}
                    alt=""
                    className="w-full sm:w-28 h-28 object-cover rounded-md border"
                  />
                )}
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {s.category && <CategoryBadge category={s.category} />}
                    <StateBadge state={s.state} />
                    {s.confidence != null && (
                      <span className="text-xs font-mono text-slate-500">{Math.round(s.confidence * 100)}%</span>
                    )}
                    {s.points > 0 && <PointsChip points={s.points} />}
                  </div>
                  <p className="text-xs text-slate-400">{formatDate(s.createdAt)}</p>
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/submissions/${submissionId(s)}`}>View</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length > show && (
            <Button variant="secondary" disabled={isFetching} onClick={() => setShow((x) => x + PAGE)}>
              {isFetching ? 'Loading…' : 'Load more'}
            </Button>
          )}
        </div>
      )}
    </PageWrapper>
  );
}
