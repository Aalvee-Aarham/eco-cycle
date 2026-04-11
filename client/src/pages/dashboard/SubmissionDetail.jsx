import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { useSubmission, useRedeem } from '@/hooks/useSubmissions';
import { CategoryBadge } from '@/components/CategoryBadge';
import { StateBadge } from '@/components/StateBadge';
import { ConfidenceMeter } from '@/components/ConfidenceMeter';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { assetUrl, formatDate } from '@/lib/utils';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function SubmissionDetail() {
  const { id } = useParams();
  const { data: s, isLoading } = useSubmission(id);
  const redeem = useRedeem();
  const [reasonOpen, setReasonOpen] = useState(false);

  const canRedeem = s && (s.state === 'AWAITING_REWARD' || s.state === 'REWARDED');

  return (
    <PageWrapper>
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/submissions">← Back to list</Link>
        </Button>
      </div>

      {isLoading || !s ? (
        <Skeleton className="h-96 w-full max-w-3xl" />
      ) : (
        <div className="max-w-3xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Submission</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {s.imageUrl && (
                <img
                  src={assetUrl(s.imageUrl)}
                  alt=""
                  className="w-full max-h-96 object-contain rounded-lg border bg-slate-100"
                />
              )}

              <div className="flex flex-col sm:flex-row gap-8 items-start">
                <ConfidenceMeter value={s.confidence} />
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap gap-2 items-center">
                    {s.category && <CategoryBadge category={s.category} />}
                    <StateBadge state={s.state} />
                  </div>
                  {s.subcategory && (
                    <p className="text-sm text-slate-600">
                      <span className="text-slate-500">Subcategory:</span> {s.subcategory}
                    </p>
                  )}
                  {s.classifier && <p className="text-xs text-slate-400">Classifier: {s.classifier}</p>}
                  <p className="text-xs text-slate-400">Submitted {formatDate(s.createdAt)}</p>
                </div>
              </div>

              {s.reasoning && (
                <div className="border rounded-lg">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between p-3 text-sm font-medium text-slate-700"
                    onClick={() => setReasonOpen(!reasonOpen)}
                  >
                    AI reasoning
                    {reasonOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                  {reasonOpen && (
                    <div className="px-3 pb-3 text-sm text-slate-600 border-t bg-slate-50/80">{s.reasoning}</div>
                  )}
                </div>
              )}

              {s.disputeResult && (
                <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm">
                  <p className="font-medium text-orange-900">Dispute resolution</p>
                  <p className="text-orange-800 mt-1">
                    Alternative: {s.disputeResult.category} (
                    {s.disputeResult.confidence != null
                      ? `${Math.round(s.disputeResult.confidence * 100)}%`
                      : 'n/a'}
                    )
                  </p>
                </div>
              )}

              <div className="rounded-lg border bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-700 mb-2">Status</p>
                <p className="text-sm text-slate-600">
                  Current state: <StateBadge state={s.state} />
                </p>
                {s.flagReason && (
                  <p className="text-sm text-red-700 mt-2">Flag: {s.flagReason}</p>
                )}
              </div>

              {canRedeem && (
                <Button
                  onClick={() => redeem.mutate(s._id)}
                  disabled={redeem.isPending || s.state === 'REDEEMED'}
                >
                  {s.state === 'REDEEMED' ? 'Redeemed' : redeem.isPending ? 'Redeeming…' : 'Redeem points'}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </PageWrapper>
  );
}
