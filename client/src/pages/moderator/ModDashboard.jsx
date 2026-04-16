import { Link } from 'react-router-dom';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { useDisputeStats } from '@/hooks/useDisputes';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';

const STAT_CARDS = [
  {
    key: 'IN_DISPUTE',
    label: 'In Dispute',
    description: 'Medium confidence — awaiting moderator review',
    color: 'text-amber-600',
    bg: 'bg-amber-50 border-amber-200',
    icon: '⚠️',
  },
  {
    key: 'FLAGGED',
    label: 'Flagged',
    description: 'Both models uncertain / duplicate',
    color: 'text-red-600',
    bg: 'bg-red-50 border-red-200',
    icon: '🚩',
  },
  {
    key: 'RESOLVED_AUTO',
    label: 'Auto-Resolved',
    description: 'Secondary model confirmed classification',
    color: 'text-teal-600',
    bg: 'bg-teal-50 border-teal-200',
    icon: '🤖',
  },
  {
    key: 'RESOLVED_MANUAL',
    label: 'Manually Resolved',
    description: 'Resolved by a moderator',
    color: 'text-purple-600',
    bg: 'bg-purple-50 border-purple-200',
    icon: '👤',
  },
];

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

  const actionable = (map.IN_DISPUTE ?? 0) + (map.FLAGGED ?? 0);

  return (
    <PageWrapper>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Moderator Dashboard</h1>
        {actionable > 0 && (
          <p className="text-sm text-amber-700 mt-1">
            {actionable} submission{actionable !== 1 ? 's' : ''} require your attention.
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {STAT_CARDS.map(({ key, label, description, color, bg, icon }) => (
            <Card key={key} className={`border ${bg}`}>
              <CardHeader className="pb-1">
                <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-1.5">
                  <span>{icon}</span> {label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-3xl font-mono font-bold ${color}`}>{map[key] ?? 0}</p>
                <p className="text-xs text-slate-400 mt-1 leading-tight">{description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Button size="lg" asChild>
          <Link to="/mod/disputes">
            Review dispute queue →
          </Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link to="/mod/disputes?state=FLAGGED">
            View flagged items →
          </Link>
        </Button>
      </div>
    </PageWrapper>
  );
}
