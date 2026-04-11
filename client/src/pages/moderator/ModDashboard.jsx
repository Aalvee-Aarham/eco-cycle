import { Link } from 'react-router-dom';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { useDisputeStats } from '@/hooks/useDisputes';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { STATE_META } from '@/lib/constants';

function statsToMap(arr) {
  const m = {};
  if (!Array.isArray(arr)) return m;
  arr.forEach((row) => {
    if (row._id) m[row._id] = row.count;
  });
  return m;
}

export default function ModDashboard() {
  const { data: stats, isLoading } = useDisputeStats();
  const map = statsToMap(stats);

  return (
    <PageWrapper>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Moderator</h1>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">In dispute</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-mono font-bold">{map.IN_DISPUTE ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">{STATE_META.RESOLVED_AUTO.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-mono font-bold">{map.RESOLVED_AUTO ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">{STATE_META.RESOLVED_MANUAL.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-mono font-bold">{map.RESOLVED_MANUAL ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Flagged</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-mono font-bold">{map.FLAGGED ?? 0}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Button size="lg" asChild>
        <Link to="/mod/disputes">Go to dispute queue →</Link>
      </Button>
    </PageWrapper>
  );
}
