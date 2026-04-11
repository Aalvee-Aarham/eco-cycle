import { Link } from 'react-router-dom';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { useAuthStore } from '@/store/auth.store';
import { useMe } from '@/hooks/useAuth';
import { useSubmissions } from '@/hooks/useSubmissions';
import { LevelBar } from '@/components/LevelBar';
import { CategoryBadge } from '@/components/CategoryBadge';
import { StateBadge } from '@/components/StateBadge';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDate } from '@/lib/utils';
import { Shield } from 'lucide-react';

export default function Dashboard() {
  const { user: stored } = useAuthStore();
  const { data: me, isLoading } = useMe();
  const user = me ?? stored;
  const { data: subsRaw, isLoading: subsLoading } = useSubmissions({ limit: 3 });

  const recent = Array.isArray(subsRaw) ? subsRaw.slice(0, 3) : [];

  return (
    <PageWrapper>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Dashboard</h1>
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : (
              <>
                <div>
                  <p className="text-sm text-slate-500">Total points</p>
                  <p className="text-4xl font-mono font-bold text-eco-600">{user?.totalPoints ?? 0}</p>
                </div>
                <LevelBar totalPoints={user?.totalPoints ?? 0} />
                <div className="flex flex-wrap gap-2 text-sm">
                  <span className="text-slate-600">
                    Submissions: <strong className="font-mono">{user?.submissionCount ?? 0}</strong>
                  </span>
                  <span className="text-slate-400">·</span>
                  <span className="text-slate-600">
                    Accuracy:{' '}
                    <strong className="font-mono">{Math.round((user?.accuracyRate ?? 0) * 100) / 100}%</strong>
                  </span>
                </div>
                <Badge variant="secondary" className="capitalize">
                  {user?.role ?? 'citizen'}
                </Badge>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent submissions</CardTitle>
            <Button variant="link" className="p-0 h-auto" asChild>
              <Link to="/submissions">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {subsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : recent.length === 0 ? (
              <p className="text-sm text-slate-500">No submissions yet. Start by classifying waste.</p>
            ) : (
              <ul className="space-y-3">
                {recent.map((s) => (
                  <li key={s._id} className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3 last:border-0">
                    {s.category && <CategoryBadge category={s.category} />}
                    <StateBadge state={s.state} />
                    <span className="text-xs text-slate-500 font-mono">
                      {s.confidence != null ? `${Math.round(s.confidence * 100)}%` : '—'}
                    </span>
                    <span className="text-xs text-slate-400 ml-auto">{formatDate(s.createdAt)}</span>
                    <Link to={`/submissions/${s._id}`} className="text-xs font-medium text-eco-600 hover:underline">
                      View
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button asChild>
              <Link to="/classify">Classify waste</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/leaderboard">View leaderboard</Link>
            </Button>
            {['moderator', 'administrator'].includes(user?.role) && (
              <Button variant="secondary" asChild>
                <Link to="/mod" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" /> Moderator
                </Link>
              </Button>
            )}
            {user?.role === 'administrator' && (
              <Button variant="outline" asChild>
                <Link to="/admin">Admin console</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}
