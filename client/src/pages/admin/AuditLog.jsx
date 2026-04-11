import { useState } from 'react';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { useAdminAudit } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDate } from '@/lib/utils';

const PAGE = 40;

export default function AuditLog() {
  const [event, setEvent] = useState('');
  const [actorId, setActorId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [skip, setSkip] = useState(0);
  const [expanded, setExpanded] = useState({});

  const params = {
    limit: PAGE,
    skip,
    ...(event && { event }),
    ...(actorId && { actorId }),
    ...(from && { from }),
    ...(to && { to }),
  };

  const { data: logs, isLoading, isFetching } = useAdminAudit(params);

  const list = Array.isArray(logs) ? logs : [];

  return (
    <PageWrapper>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Audit log</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <div className="space-y-2">
          <Label>Event type</Label>
          <Input value={event} onChange={(e) => setEvent(e.target.value)} placeholder="e.g. USER_LOGIN" />
        </div>
        <div className="space-y-2">
          <Label>Actor ID</Label>
          <Input value={actorId} onChange={(e) => setActorId(e.target.value)} placeholder="User ObjectId" />
        </div>
        <div className="space-y-2">
          <Label>From</Label>
          <Input type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>To</Label>
          <Input type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>
      <Button
        variant="secondary"
        className="mb-4"
        onClick={() => setSkip(0)}
      >
        Apply filters
      </Button>

      <div className="rounded-lg border bg-white overflow-x-auto">
        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Metadata</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((log) => (
                <TableRow key={log._id}>
                  <TableCell className="whitespace-nowrap text-sm">{formatDate(log.createdAt)}</TableCell>
                  <TableCell className="font-medium">{log.event}</TableCell>
                  <TableCell className="text-sm">
                    {log.actor?.username ?? log.actor ?? '—'}
                  </TableCell>
                  <TableCell>
                    {log.metadata ? (
                      <>
                        <Button
                          variant="link"
                          className="p-0 h-auto text-xs"
                          onClick={() =>
                            setExpanded((e) => ({ ...e, [log._id]: !e[log._id] }))
                          }
                        >
                          {expanded[log._id] ? 'Hide' : 'Show'} JSON
                        </Button>
                        {expanded[log._id] && (
                          <pre className="mt-2 text-xs bg-slate-50 p-2 rounded max-h-40 overflow-auto max-w-md">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        )}
                      </>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="flex gap-2 mt-4">
        <Button
          variant="outline"
          disabled={skip < PAGE || isFetching}
          onClick={() => setSkip((s) => Math.max(0, s - PAGE))}
        >
          Previous page
        </Button>
        <Button
          variant="outline"
          disabled={list.length < PAGE || isFetching}
          onClick={() => setSkip((s) => s + PAGE)}
        >
          Next page
        </Button>
      </div>
    </PageWrapper>
  );
}
