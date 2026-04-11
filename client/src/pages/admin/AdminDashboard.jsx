import { Link } from 'react-router-dom';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { useAdminStats } from '@/hooks/useAdmin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const STATE_COLORS = {
  PENDING: '#94a3b8',
  CLASSIFIED: '#3b82f6',
  IN_DISPUTE: '#f97316',
  RESOLVED_AUTO: '#14b8a6',
  RESOLVED_MANUAL: '#a855f7',
  AWAITING_REWARD: '#eab308',
  REWARDED: '#22c55e',
  REDEEMED: '#15803d',
  FLAGGED: '#ef4444',
};

export default function AdminDashboard() {
  const { data: stats, isLoading } = useAdminStats();

  const breakdown = stats?.stateBreakdown ?? [];
  const inDispute = breakdown.find((x) => x._id === 'IN_DISPUTE')?.count ?? 0;
  const flagged = breakdown.find((x) => x._id === 'FLAGGED')?.count ?? 0;

  const chartData = breakdown
    .filter((x) => x._id)
    .map((x) => ({
      name: String(x._id).replace(/_/g, ' '),
      value: x.count,
      key: x._id,
    }));

  return (
    <PageWrapper>
      <h1 className="font-display text-2xl font-bold text-slate-900 mb-6">Admin</h1>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-10">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Total users</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-mono font-bold">{stats?.totalUsers ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Total submissions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-mono font-bold">{stats?.totalSubmissions ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">In dispute</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-mono font-bold">{inDispute}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Flagged</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-mono font-bold">{flagged}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {!isLoading && chartData.length > 0 && (
        <Card className="mb-10 max-w-xl">
          <CardHeader>
            <CardTitle className="text-base">Submissions by state</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={56}
                    outerRadius={96}
                    paddingAngle={2}
                  >
                    {chartData.map((entry) => (
                      <Cell key={entry.key} fill={STATE_COLORS[entry.key] ?? '#64748b'} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend layout="horizontal" verticalAlign="bottom" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <h2 className="text-lg font-semibold text-slate-800 mb-4">Quick links</h2>
      <div className="grid gap-4 md:grid-cols-3">
        <Link
          to="/admin/users"
          className="rounded-lg border bg-white p-6 shadow-sm hover:border-eco-300 transition-colors"
        >
          <p className="font-medium text-slate-900">User management</p>
          <p className="text-sm text-slate-500 mt-1">Roles and accounts</p>
        </Link>
        <Link
          to="/admin/audit"
          className="rounded-lg border bg-white p-6 shadow-sm hover:border-eco-300 transition-colors"
        >
          <p className="font-medium text-slate-900">Audit log</p>
          <p className="text-sm text-slate-500 mt-1">System events</p>
        </Link>
        <Link
          to="/admin/config"
          className="rounded-lg border bg-white p-6 shadow-sm hover:border-eco-300 transition-colors"
        >
          <p className="font-medium text-slate-900">System config</p>
          <p className="text-sm text-slate-500 mt-1">Thresholds & classifiers</p>
        </Link>
      </div>
    </PageWrapper>
  );
}
