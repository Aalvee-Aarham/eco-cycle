import { Link } from 'react-router-dom';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useSocketStore } from '@/store/socket.store';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { Skeleton } from '@/components/ui/Skeleton';

const MEDALS = ['🥇', '🥈', '🥉'];

function formatAccuracy(v) {
  if (v == null || Number.isNaN(Number(v))) return '—';
  const n = Number(v);
  if (n >= 0 && n <= 1) return `${(n * 100).toFixed(1)}`;
  return `${n.toFixed(1)}`;
}

export default function Leaderboard() {
  const socketData = useSocketStore((st) => st.leaderboard);
  const { data: fetchedData, isLoading } = useLeaderboard(50);
  const board = Array.isArray(socketData) && socketData.length ? socketData : fetchedData ?? [];

  return (
    <PageWrapper>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Leaderboard</h1>
      <p className="text-slate-500 mb-6">Top recyclers by points — updates in real time.</p>

      <div className="rounded-lg border bg-white overflow-x-auto">
        {isLoading && !board.length ? (
          <div className="p-8">
            <Skeleton className="h-12 w-full mb-2" />
            <Skeleton className="h-12 w-full mb-2" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14">Rank</TableHead>
                <TableHead>Username</TableHead>
                <TableHead className="text-right">Points</TableHead>
                <TableHead className="text-right">Level</TableHead>
                <TableHead className="text-right">Accuracy %</TableHead>
                <TableHead className="text-right">Submissions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {board.map((u, i) => {
                const rank = u.rank ?? i + 1;
                const accent =
                  rank === 1 ? 'border-l-4 border-amber-400' : rank === 2 ? 'border-l-4 border-slate-300' : rank === 3 ? 'border-l-4 border-amber-700' : '';
                return (
                  <TableRow key={u._id ?? i} className={accent}>
                    <TableCell className="font-mono">
                      {rank <= 3 ? `${MEDALS[rank - 1]} ${rank}` : rank}
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link to={`/u/${u.username}`} className="hover:text-eco-600 hover:underline">
                        {u.username}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right font-mono">{u.totalPoints ?? 0}</TableCell>
                    <TableCell className="text-right font-mono">{u.level ?? '—'}</TableCell>
                    <TableCell className="text-right font-mono">{formatAccuracy(u.accuracyRate)}</TableCell>
                    <TableCell className="text-right font-mono">{u.submissionCount ?? 0}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
      {!isLoading && board.length === 0 && (
        <p className="text-center text-slate-500 py-12">No leaderboard data yet.</p>
      )}
    </PageWrapper>
  );
}
