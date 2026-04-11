import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { useDisputeAudit, useResolveDispute } from '@/hooks/useDisputes';
import { CategoryBadge } from '@/components/CategoryBadge';
import { StateBadge } from '@/components/StateBadge';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { CATEGORIES } from '@/lib/constants';
import { assetUrl, formatDate } from '@/lib/utils';

export default function DisputeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useDisputeAudit(id);
  const resolve = useResolveDispute();
  const [category, setCategory] = useState('recyclable');
  const [outcome, setOutcome] = useState('');

  const submission = data?.submission;
  const auditTrail = data?.auditTrail ?? [];

  const onResolve = () => {
    resolve.mutate(
      { id, category, outcome: outcome || undefined },
      { onSuccess: () => navigate('/mod/disputes') }
    );
  };

  return (
    <PageWrapper>
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/mod/disputes">← Back to queue</Link>
        </Button>
      </div>

      {isLoading || !submission ? (
        <Skeleton className="h-96 max-w-4xl" />
      ) : (
        <div className="max-w-4xl space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Image</CardTitle>
              </CardHeader>
              <CardContent>
                {submission.imageUrl && (
                  <img
                    src={assetUrl(submission.imageUrl)}
                    alt=""
                    className="w-full rounded-lg border object-contain max-h-80 bg-slate-50"
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Classification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>
                  <span className="text-slate-500">Category:</span>{' '}
                  {submission.category ? <CategoryBadge category={submission.category} /> : '—'}
                </p>
                <p>
                  <span className="text-slate-500">Confidence:</span>{' '}
                  <span className="font-mono">
                    {submission.confidence != null ? `${Math.round(submission.confidence * 100)}%` : '—'}
                  </span>
                </p>
                {submission.disputeResult && (
                  <p>
                    <span className="text-slate-500">Alternative:</span>{' '}
                    {submission.disputeResult.category} (
                    {submission.disputeResult.confidence != null
                      ? `${Math.round(submission.disputeResult.confidence * 100)}%`
                      : 'n/a'}
                    )
                  </p>
                )}
                <p>
                  <span className="text-slate-500">State:</span> <StateBadge state={submission.state} />
                </p>
                <p>
                  <span className="text-slate-500">Submitted by:</span>{' '}
                  {typeof submission.user === 'object' && submission.user?.username
                    ? `@${submission.user.username}`
                    : '—'}
                </p>
                {submission.flagReason && (
                  <div className="mt-4 p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">
                    <p className="font-bold flex items-center gap-2">⚠️ Flagged: {submission.flagReason}</p>
                    <p className="mt-1 opacity-80">Moderator review required to confirm if this is a genuine duplication or a valid unique submission.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Audit trail</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {auditTrail.length === 0 && <li className="text-slate-500">No audit entries.</li>}
                {auditTrail.map((log) => (
                  <li key={log._id} className="border-b border-slate-100 pb-2 last:border-0">
                    <span className="font-medium text-slate-800">{log.event}</span>
                    <span className="text-slate-400 mx-2">·</span>
                    <span className="text-slate-500">
                      {log.actor?.username ?? log.actor ?? 'system'} — {formatDate(log.createdAt)}
                    </span>
                    {log.metadata && (
                      <pre className="mt-1 text-xs bg-slate-50 p-2 rounded overflow-x-auto max-h-32">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resolve</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label htmlFor="cat">Final category</Label>
                <select
                  id="cat"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="note">Outcome note (optional)</Label>
                <Textarea
                  id="note"
                  placeholder="Notes for the audit log…"
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value)}
                />
              </div>
              <Button
                onClick={onResolve}
                disabled={resolve.isPending || !['IN_DISPUTE', 'FLAGGED'].includes(submission.state)}
              >
                {resolve.isPending ? 'Resolving…' : 'Resolve submission'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </PageWrapper>
  );
}
